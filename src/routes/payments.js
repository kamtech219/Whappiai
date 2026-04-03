const express = require('express');
const router = express.Router();
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');
const { createCheckoutSession, handleWebhook } = require('../services/payment');
const PricingService = require('../services/PricingService');
const { log } = require('../utils/logger');
const { db } = require('../config/database');

// POST /api/v1/payments/checkout
router.post('/checkout', ClerkExpressWithAuth(), async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.auth.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Non autorisé' });
        }

        const user = User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const checkoutUrl = await createCheckoutSession(user, planId);
        res.json({ url: checkoutUrl });
    } catch (error) {
        log('Erreur lors de la création du lien de paiement', 'PAYMENT', { error: error.message }, 'ERROR');
        res.status(500).json({ error: 'Erreur lors de la création du lien de paiement' });
    }
});

// GET /api/v1/payments/history
router.get('/history', ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Non autorisé' });
        }

        const history = db.prepare('SELECT * FROM credit_history WHERE user_id = ? AND type = "purchase" ORDER BY created_at DESC').all(userId);
        res.json({ status: 'success', data: history });
    } catch (error) {
        log('Erreur lors de la récupération de l\'historique des paiements', 'PAYMENT', { error: error.message }, 'ERROR');
        res.status(500).json({ error: 'Impossible de récupérer l\'historique des paiements' });
    }
});

// GET /api/v1/payments/plans
router.get('/plans', (req, res) => {
    try {
        const plans = PricingService.getActivePlans();
        res.json(plans);
    } catch (error) {
        log('Erreur lors de la récupération des plans', 'PAYMENT', { error: error.message }, 'ERROR');
        res.status(500).json({ error: 'Impossible de récupérer les plans' });
    }
});

// POST /api/v1/payments/webhook
router.post('/webhook', express.json(), async (req, res) => {
    const signature = req.headers['x-chariow-signature']; 
    const payload = req.body;

    try {
        await handleWebhook(req.headers['x-chariow-event'] || 'unknown', payload);
        res.status(200).send('OK');
    } catch (error) {
        log('Erreur webhook', 'PAYMENT', { error: error.message }, 'ERROR');
        res.status(500).send('Webhook Error');
    }
});

module.exports = router;
