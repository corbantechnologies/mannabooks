/**
 * Safaricom Daraja API Lipa Na M-Pesa Online (STK Push) Integration Service
 */

export interface DarajaConfig {
    env: "sandbox" | "production";
    baseUrl: string;
    consumerKey: string;
    consumerSecret: string;
    passkey: string;
    shortcode: string;
}

export function getDarajaConfig(): DarajaConfig {
    const env = (process.env.MPESA_ENV === "production" ? "production" : "sandbox") as "sandbox" | "production";
    const baseUrl = env === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    const consumerKey = (process.env.MPESA_CONSUMER_KEY || "").trim();
    const consumerSecret = (process.env.MPESA_CONSUMER_SECRET || "").trim();
    const passkey = (process.env.MPESA_PASSKEY || "").trim();
    const shortcode = (process.env.MPESA_SHORTCODE || "174379").trim();

    return {
        env,
        baseUrl,
        consumerKey,
        consumerSecret,
        passkey,
        shortcode,
    };
}

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

    const config = getDarajaConfig();

    if (!config.consumerKey || !config.consumerSecret) {
        console.error("❌ Daraja credentials (MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET) missing from environment.");
        return null;
    }

    try {
        const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
        const response = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${auth}`,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Daraja OAuth Failed:", response.status, errText);
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

    const config = getDarajaConfig();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mannabooks.co.ke";
    const callbackUrl = `${appUrl}/api/billing/mpesa-callback`;

    const token = await getDarajaAccessToken();

    if (!token) {
        return {
            success: false,
            error: "Unable to authenticate with Safaricom M-Pesa gateway. Please check Daraja API credentials in environment.",
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

        const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString("base64");

        const payload = {
            BusinessShortCode: config.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Math.max(1, Math.round(params.amount)),
            PartyA: formattedPhone,
            PartyB: config.shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: params.accountReference.substring(0, 12),
            TransactionDesc: params.transactionDesc.substring(0, 13),
        };

        const response = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
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
                customerMessage: data.CustomerMessage || "Please check your phone and enter your M-Pesa PIN to complete payment.",
                isSimulated: false,
            };
        } else {
            console.error("Daraja STK Push Error:", data);
            return {
                success: false,
                error: data.errorMessage || data.ResponseDescription || "Safaricom rejected the payment request.",
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

export interface StkQueryResult {
    success: boolean;
    resultCode?: number;
    resultDesc?: string;
    isPending?: boolean;
    error?: string;
}

/**
 * Queries Safaricom Daraja to check if the STK Push transaction completed, cancelled, or is pending.
 */
export async function queryMpesaStkPushStatus(checkoutRequestId: string): Promise<StkQueryResult> {
    const config = getDarajaConfig();
    const token = await getDarajaAccessToken();

    if (!token) {
        return { success: false, error: "Failed to authenticate with Daraja gateway." };
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

        const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString("base64");

        const payload = {
            BusinessShortCode: config.shortcode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId,
        };

        const response = await fetch(`${config.baseUrl}/mpesa/stkpushquery/v1/query`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.ResponseCode === "0") {
            const resCode = parseInt(data.ResultCode, 10);
            return {
                success: resCode === 0,
                resultCode: resCode,
                resultDesc: data.ResultDesc || "Processed",
                isPending: false,
            };
        } else if (data.errorCode === "500.001.1001" || data.errorMessage?.includes("ongoing")) {
            // Transaction is still being processed on customer phone
            return {
                success: false,
                isPending: true,
                resultDesc: "Payment prompt is still pending on user's device...",
            };
        } else {
            return {
                success: false,
                resultDesc: data.errorMessage || data.ResponseDescription,
                isPending: false,
            };
        }
    } catch (err: any) {
        console.error("Daraja Query Error:", err);
        return { success: false, error: err.message || "Failed to query transaction status." };
    }
}
