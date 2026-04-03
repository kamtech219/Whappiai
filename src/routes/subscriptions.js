const express = require('express');
const router = express.Router();
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const SubscriptionService = require('../services/SubscriptionService');
const PricingService = require('../services/PricingService');
const { log } = require('../utils/logger');

// GET /api/v1/subscriptions/plans
router.get('/plans', async (req, res) => {
    try {
        const plans = PricingService.getAllPlans();
        res.json({ status: 'success', data: plans });
    } catch (error) {
        log('Error fetching plans', 'PRICING', { error: error.message }, 'ERROR');
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET /api/v1/subscriptions/current
router.get('/current', ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const subscription = SubscriptionService.getCurrentSubscription(userId);
        res.json({ status: 'success', data: subscription });
    } catch (error) {
        log('Error fetching subscription', 'SUBSCRIPTION', { error: error.message }, 'ERROR');
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/v1/subscriptions/change-plan
router.post('/change-plan', ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { planId } = req.body;

        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        if (!planId) return res.status(400).json({ status: 'error', message: 'Plan ID is required' });

        // Logic for handling downgrades/upgrades cleanly
        // Typically, actual payment/checkout creates a Chariow session via /payments/checkout.
        // However, if the user downgrades to "free" or wants to switch via our internal system
        // before billing logic catches up, we handle it here.
        if (planId === 'free') {
            const result = await SubscriptionService.cancel(userId);
            return res.json({ status: 'success', message: 'Downgraded to free plan', result });
        }

        // For paid plans, redirect them to checkout, or handle internal subscription switch if valid.
        // As a fallback, we just subscribe them here for testing/simplicity.
        const subId = await SubscriptionService.subscribe(userId, planId);
        res.json({ status: 'success', message: 'Plan changed successfully', subscriptionId: subId });
    } catch (error) {
        log('Error changing plan', 'SUBSCRIPTION', { error: error.message }, 'ERROR');
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/v1/subscriptions/subscribe
router.post('/subscribe', ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { planCode } = req.body;
        
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        if (!planCode) return res.status(400).json({ status: 'error', message: 'Plan code is required' });

        const subId = await SubscriptionService.subscribe(userId, planCode);
        res.json({ status: 'success', message: 'Subscription successful', subscriptionId: subId });
    } catch (error) {
        log('Error subscribing', 'SUBSCRIPTION', { error: error.message }, 'ERROR');
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/v1/subscriptions/cancel
router.post('/cancel', ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const result = await SubscriptionService.cancel(userId);
        if (result) {
            res.json({ status: 'success', message: 'Subscription cancelled' });
        } else {
            res.status(400).json({ status: 'error', message: 'No active subscription found or cancellation failed' });
        }
    } catch (error) {
        log('Error cancelling subscription', 'SUBSCRIPTION', { error: error.message }, 'ERROR');
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
