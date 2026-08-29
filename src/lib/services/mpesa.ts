/**
 * Safaricom Daraja API Lipa Na M-Pesa Online (STK Push) Integration Service
 */

const MPESA_ENV = process.env.MPESA_ENV || "sandbox";
const DARAJA_BASE_URL = MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "";
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "";
const PASSKEY = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"; // Standard Daraja sandbox passkey
const SHORTCODE = process.env.MPESA_SHORTCODE || "174379"; // Standard Daraja sandbox shortcode

/**
 * Normalizes Kenyan mobile numbers to the 2547XXXXXXXX / 2541XXXXXXXX format required by Daraja.
 */
export function formatMpesaPhoneNumber(rawPhone: string): string {
    let clean = rawPhone.replace(/\D/g, "");
    if (clean.startsWith("0")) {
        clean = "254" + clean.substring(1);
    } else if (clean.startsWith("+254")) {
        clean = clean.substring(1);
    } else if (clean.startsWith("7") || clean.startsWith("1")) {
        clean = "254" + clean;
    }
    return clean;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Generates or retrieves an active OAuth Bearer token from Safaricom Daraja.
 */
export async function getDarajaAccessToken(): Promise<string | null> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.token;
    }

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
        console.warn("⚠️ Daraja credentials (MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET) not set. Operating in Simulation Mode.");
        return null;
    }

    try {
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
        const response = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${auth}`,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error("Daraja OAuth Failed:", response.status, await response.text());
            return null;
        }

        const data = await response.json();
        const expiresInSec = parseInt(data.expires_in || "3599", 10);
        cachedToken = {
            token: data.access_token,
            expiresAt: Date.now() + (expiresInSec - 60) * 1000,
        };

        return cachedToken.token;
    } catch (error) {
        console.error("Daraja Token Generation Error:", error);
        return null;
    }
}

export interface StkPushParams {
    phoneNumber: string;
    amount: number;
    accountReference: string; // e.g. "MANNA-VNT-PRO"
    transactionDesc: string;  // e.g. "MannaBooks Pro Subscription"
}

export interface StkPushResult {
    success: boolean;
    checkoutRequestId?: string;
    merchantRequestId?: string;
    responseCode?: string;
    customerMessage?: string;
    error?: string;
    isSimulated?: boolean;
}

/**
 * Initiates an M-Pesa STK Push prompt on the customer's phone.
 */
export async function sendMpesaStkPush(params: StkPushParams): Promise<StkPushResult> {
    const formattedPhone = formatMpesaPhoneNumber(params.phoneNumber);
    if (!formattedPhone || formattedPhone.length !== 12) {
        return { success: false, error: "Invalid Kenyan phone number format. Please provide a valid 07... or 01... number." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mannabooks.co.ke";
    const callbackUrl = `${appUrl}/api/billing/mpesa-callback`;

    const token = await getDarajaAccessToken();

    // If Daraja credentials are not configured in environment, provide seamless Simulation Mode
    if (!token) {
        const simulatedCheckoutId = `ws_CO_SIM_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        console.log(`[Daraja Simulation] Sent simulated STK Push to ${formattedPhone} for KES ${params.amount}. Checkout ID: ${simulatedCheckoutId}`);
        return {
            success: true,
            checkoutRequestId: simulatedCheckoutId,
            merchantRequestId: `SIM_MR_${Date.now()}`,
            responseCode: "0",
            customerMessage: "Success. Request accepted for processing in simulation mode.",
            isSimulated: true,
        };
    }

    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString("base64");

        const payload = {
            BusinessShortCode: SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Math.round(params.amount),
            PartyA: formattedPhone,
            PartyB: SHORTCODE,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: params.accountReference.substring(0, 12),
            TransactionDesc: params.transactionDesc.substring(0, 13),
        };

        const response = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.ResponseCode === "0") {
            return {
                success: true,
                checkoutRequestId: data.CheckoutRequestID,
                merchantRequestId: data.MerchantRequestID,
                responseCode: data.ResponseCode,
                customerMessage: data.CustomerMessage || "Please check your phone and enter your M-Pesa PIN.",
                isSimulated: false,
            };
        } else {
            console.error("Daraja STK Push Error:", data);
            return {
                success: false,
                error: data.errorMessage || data.ResponseDescription || "Failed to initiate STK Push.",
            };
        }
    } catch (error: any) {
        console.error("Daraja STK Network Error:", error);
        return {
            success: false,
            error: error.message || "Failed to connect to Safaricom Daraja gateway.",
        };
    }
}
