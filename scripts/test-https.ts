import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import https from "https";

async function testWithHttps() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const options = {
        hostname: "api.safaricom.co.ke",
        port: 443,
        path: "/oauth/v1/generate?grant_type=client_credentials",
        method: "GET",
        headers: {
            Authorization: `Basic ${auth}`,
            "User-Agent": "MannaBooks/1.0",
        },
        timeout: 15000,
    };

    console.log("Testing direct HTTPS request to api.safaricom.co.ke...");

    const req = https.request(options, (res) => {
        let data = "";
        console.log("Status:", res.statusCode, res.statusMessage);
        res.on("data", (chunk) => {
            data += chunk;
        });
        res.on("end", () => {
            console.log("Body:", data);
        });
    });

    req.on("error", (e) => {
        console.error("HTTPS error:", e.message);
    });

    req.on("timeout", () => {
        console.error("HTTPS request timed out");
        req.destroy();
    });

    req.end();
}

testWithHttps();
