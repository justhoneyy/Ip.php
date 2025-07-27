const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'consent.html'));
});

app.post('/log', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ua = req.headers['user-agent'];
    const ref = req.headers['referer'] || 'Direct';
    const clientData = req.body || {};

    // Get ISP & location using ip-api
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

    const log = `
[${new Date().toISOString()}]
IP: ${ip}
ISP: ${ispInfo}
Location: ${city}, ${country}
User-Agent: ${ua}
Referrer: ${ref}
Screen: ${clientData.screen}
Language: ${clientData.language}
Platform: ${clientData.platform}
Browser Info: ${clientData.browserInfo}
Battery Level: ${clientData.battery?.level}
Charging: ${clientData.battery?.charging}
---------------------------
`;

    fs.appendFileSync(path.join(__dirname, 'logs', 'visits.log'), log);
    res.json({ status: 'logged' });
});

app.get('/go', (req, res) => {
    const target = req.query.url;
    if (!target || !target.startsWith('http')) {
        return res.status(400).send('Invalid or missing redirect URL.');
    }
    return res.redirect(target);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
         
