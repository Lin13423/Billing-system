const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// DARAJA LIVE CREDENTIALS
const CONSUMER_KEY = 'AGJGJGGktfRf8OHhos6TJXKupDMb3f2wG9pZDdF8tG5qm0qK';
const CONSUMER_SECRET = 'xmd2sXJzRA6Chl1KHGvR9jG0qtSBse1oRBCdgBjb4DnO7SEi4QzPVwKNWWraubJd';

app.post('/api/stkpush', async (req, res) => {
    try {
        const { phone, amount, shortcode, passkey, transactionType, env } = req.body;
        
        // 1. Determine Environment Host
        const host = env === 'LIVE' 
            ? 'https://api.safaricom.co.ke' 
            : 'https://sandbox.safaricom.co.ke';

        // 2. Generate OAuth Access Token
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
        const tokenRes = await axios.get(`${host}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { Authorization: `Basic ${auth}` }
        });
        const token = tokenRes.data.access_token;

        // 3. Generate Timestamp and Password Hash
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
        const formattedPhone = phone.replace(/^0/, '254').replace(/[^0-9]/g, '');

        // 4. Dispatch STK Push Request to Safaricom
        const stkRes = await axios.post(
            `${host}/mpesa/stkpush/v1/processrequest`,
            {
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: transactionType || 'CustomerPayBillOnline',
                Amount: Math.round(amount),
                PartyA: formattedPhone,
                PartyB: shortcode,
                PhoneNumber: formattedPhone,
                CallBackURL: 'https://lin13423.github.io/Billing-system/',
                AccountReference: 'LinBilling',
                TransactionDesc: 'WiFi Internet Access'
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        res.json({ success: true, data: stkRes.data });
    } catch (error) {
        console.error("Daraja Error:", error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data || error.message 
        });
    }
});

app.listen(3000, () => console.log('Lin Billing Backend Proxy running on port 3000'));
