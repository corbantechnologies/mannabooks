import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    console.log("--- SAFARICOM DARAJA DIAGNOSTIC ---");
    const env = process.env.MPESA_ENV || "sandbox";
    const consumerKey = process.env.MPESA_CONSUMER_KEY || "";
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "";
    const passkey = process.env.MPESA_PASSKEY || "";
    const shortcode = process.env.MPESA_SHORTCODE || "";

    console.log(`Environment: ${env}`);
    console.log(`Base URL: ${env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke"}`);
    console.log(`Consumer Key: ${consumerKey ? `${consumerKey.substring(0, 8)}... (${consumerKey.length} chars)` : "MISSING ❌"}`);
    console.log(`Consumer Secret: ${consumerSecret ? `${consumerSecret.substring(0, 8)}... (${consumerSecret.length} chars)` : "MISSING ❌"}`);
    console.log(`Passkey: ${passkey ? `${passkey.substring(0, 8)}... (${passkey.length} chars)` : "MISSING ❌"}`);
    console.log(`Shortcode: ${shortcode || "MISSING ❌"}`);

    if (!consumerKey || !consumerSecret) {
        console.error("❌ Consumer Key or Secret missing!");
        process.exit(1);
    }

    const baseUrl = env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    console.log("\n1. Requesting OAuth Access Token from Safaricom...");
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    
    try {
        const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const tokenText = await tokenRes.text();
        console.log(`HTTP Status: ${tokenRes.status} ${tokenRes.statusText}`);
        console.log(`Response Body: ${tokenText}`);

        if (!tokenRes.ok) {
            console.error("❌ Failed to authenticate with Safaricom Daraja.");
            process.exit(1);
        }

        const tokenData = JSON.parse(tokenText);
        const accessToken = tokenData.access_token;
        console.log(`✅ Access Token successfully retrieved!`);

        // Test STK Push formatting
        const targetPhone = process.argv[2] || "254700000000";
        console.log(`\n2. Testing STK Push Payload to: ${targetPhone}...`);

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

        const stkPayload = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: 1,
            PartyA: targetPhone,
            PartyB: shortcode,
            PhoneNumber: targetPhone,
            CallBackURL: "https://www.mannabooks.co.ke/api/billing/mpesa-callback",
            AccountReference: "TEST-PRO",
            TransactionDesc: "Test Manna",
        };

        console.log("Sending payload:", JSON.stringify(stkPayload, null, 2));

        const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(stkPayload),
        });

        const stkText = await stkRes.text();
        console.log(`STK HTTP Status: ${stkRes.status} ${stkRes.statusText}`);
        console.log(`STK Response Body: ${stkText}`);

    } catch (err) {
        console.error("Fatal diagnostic error:", err);
    }
}

main();
