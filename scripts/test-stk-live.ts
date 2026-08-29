import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const phone = "254740964423";
    console.log(`\n🚀 Triggering LIVE Safaricom STK Push to: ${phone}`);

    const { sendMpesaStkPush } = await import("../src/lib/services/mpesa");

    const result = await sendMpesaStkPush({
        phoneNumber: phone,
        amount: 1,
        accountReference: "MB-TEST",
        transactionDesc: "MannaBooks Test",
    });

    console.log("\n=== STK PUSH RESULT ===");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
        console.log(`\n📲 STK Push successfully dispatched to phone ${phone}! Check phone screen for PIN prompt.`);
    } else {
        console.error(`\n❌ Failed to dispatch STK Push: ${result.error}`);
    }

    process.exit(0);
}

main().catch(console.error);
