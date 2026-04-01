const express = require('express');
const router = express.Router();
const CalService = require('../services/CalService');
const { log } = require('../utils/logger');

// OAuth Callback (Unprotected, handles its own state)
router.get('/callback', async (req, res) => {
    const { code, state: userId, error, error_description } = req.query;

    const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3005';

    if (error) {
        log(`OAuth Callback error from Cal.com: ${error} - ${error_description}`, 'SYSTEM', { error, error_description }, 'ERROR');
        return res.redirect(`${frontendUrl}/dashboard/ai?cal=error&message=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !userId) {
        return res.status(400).send('Missing code or state');
    }

    try {
        // Construct the same redirectUri used during the authorization request
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        await CalService.exchangeCode(code, userId, baseUrl);

        // Redirect back to frontend
        const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3005';
        res.redirect(`${frontendUrl}/dashboard/ai?cal=success`);
    } catch (error) {
        log(`OAuth Callback error: ${error.message}`, 'SYSTEM', null, 'ERROR');
        res.status(500).send('Authentication failed');
    }
});

module.exports = router;
