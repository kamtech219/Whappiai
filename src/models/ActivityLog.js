/**
 * Activity Log Model
 * SQLite-based activity logging
 */

const { db } = require('../config/database');
const { log } = require('../utils/logger');

class ActivityLog {
    /**
     * Log an activity
     * @param {object} data - Activity data
     * @returns {object} Created log entry
     */
    static log(data) {
        const stmt = db.prepare(`
            INSERT INTO activity_logs (
                user_email, action, resource, resource_id, details, ip, user_agent, success, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        const result = stmt.run(
            data.userEmail || null,
            data.action,
            data.resource || null,
            data.resourceId || null,
            data.details ? JSON.stringify(data.details) : null,
            data.ip || null,
            data.userAgent || null,
            data.success !== false ? 1 : 0
        );

        return { id: result.lastInsertRowid };
    }

    /**
     * Get activities with optional filters
     * @param {object} options - Filter options
     * @returns {array} Array of activities
     */
    static getAll(options = {}) {
        const { userEmail, action, resource, startDate, endDate, limit = 100, offset = 0 } = options;

        let sql = 'SELECT * FROM activity_logs WHERE 1=1';
        const params = [];

        if (userEmail) {
            sql += ' AND user_email = ?';
            params.push(userEmail);
        }

        if (action) {
            sql += ' AND action = ?';
            params.push(action);
        }

        if (resource) {
            sql += ' AND resource = ?';
            params.push(resource);
        }

        if (startDate) {
            sql += ' AND created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            sql += ' AND created_at <= ?';
            params.push(endDate);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit);
        params.push(offset);

        const stmt = db.prepare(sql);
        return stmt.all(...params).map(row => ({
            ...row,
            timestamp: row.created_at, // Frontend expects timestamp
            status: row.success === 1 ? 'success' : 'failure', // Frontend expects status
            details: row.details ? JSON.parse(row.details) : null
        }));
    }

    /**
     * Get all logs with pagination (Alias for api.js)
     */
    static getLogs(limit = 100, offset = 0) {
        return this.getAll({ limit, offset });
    }

    /**
     * Get user specific logs with pagination (Alias for api.js)
     */
    static getUserLogs(userEmail, limit = 100, offset = 0) {
        return this.getAll({ userEmail, limit, offset });
    }

    /**
     * Get activity summary for dashboard
     * @param {string} userEmail - Filter by user (optional)
     * @param {number} days - Number of days to look back
     * @returns {object} Summary statistics
     */
    static getSummary(userEmail = null, days = 7) {
        // Calculate date limit in JS to ensure cross-env consistency
        const date = new Date();
        date.setDate(date.getDate() - (parseInt(days) || 7));
        const dateLimit = date.toISOString().replace('T', ' ').split('.')[0];

        log(`[ActivityLog] Génération du résumé pour ${days} jours (depuis ${dateLimit} UTC)`, 'SYSTEM', { days, since: dateLimit }, 'DEBUG');

        let sqlBase = `FROM activity_logs WHERE created_at >= ?`;
        const params = [dateLimit];
        if (userEmail) {
            sqlBase += ' AND user_email = ?';
            params.push(userEmail);
        }

        try {
            // ⚡ Bolt: Single optimized query for all summary stats using SUM/COUNT to let SQLite do the math
            // This replaces 4 separate queries with one, avoiding memory bloat from fetching all rows.
            const query = `
                SELECT
                    COUNT(*) as total_count,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
                    action,
                    user_email
                ${sqlBase}
                GROUP BY action, user_email
            `;

            const rows = db.prepare(query).all(...params);

            let totalActivities = 0;
            let successCount = 0;
            const byAction = {};
            const byUser = {};

            for (const row of rows) {
                totalActivities += row.total_count;
                successCount += row.success_count || 0;

                // Action grouping
                if (row.action) {
                    const key = row.action.toLowerCase();
                    // Normalized keys for standard frontend cards
                    if (key.includes('message_send') || key.includes('campaign_message')) {
                        byAction['send_message'] = (byAction['send_message'] || 0) + row.total_count;
                    }
                    if (key.includes('session_create') || key === 'create') {
                        byAction['create'] = (byAction['create'] || 0) + row.total_count;
                    }
                    byAction[key] = (byAction[key] || 0) + row.total_count;
                }

                // User grouping
                const userKey = row.user_email || 'anonymous';
                byUser[userKey] = (byUser[userKey] || 0) + row.total_count;
            }

            const successRate = totalActivities > 0 ? Math.round((successCount / totalActivities) * 100) : 100;

            log(`[ActivityLog] Total des activités dans la période: ${totalActivities}`, 'SYSTEM', { totalActivities }, 'DEBUG');

            return {
                totalActivities,
                successRate,
                byUser,
                byAction
            };
        } catch (error) {
            log(`[ActivityLog] ERREUR dans getSummary: ${error.message}`, 'SYSTEM', { error: error.message }, 'ERROR');
            return { totalActivities: 0, byUser: {}, byAction: {} };
        }
    }

    /**
     * Helper: Log login attempt
     */
    static logLogin(userEmail, ip, userAgent, success = true) {
        return this.log({
            userEmail,
            action: 'LOGIN',
            resource: 'auth',
            ip,
            userAgent,
            success
        });
    }

    /**
     * Helper: Log session creation
     */
    static logSessionCreate(userEmail, sessionId, ip, userAgent) {
        return this.log({
            userEmail,
            action: 'SESSION_CREATE',
            resource: 'session',
            resourceId: sessionId,
            ip,
            userAgent
        });
    }

    /**
     * Helper: Log session deletion
     */
    static logSessionDelete(userEmail, sessionId, ip, userAgent) {
        return this.log({
            userEmail,
            action: 'SESSION_DELETE',
            resource: 'session',
            resourceId: sessionId,
            ip,
            userAgent
        });
    }

    /**
     * Helper: Log message send
     */
    static logMessageSend(userEmail, sessionId, recipient, messageType, ip, userAgent) {
        return this.log({
            userEmail,
            action: 'MESSAGE_SEND',
            resource: 'message',
            resourceId: sessionId,
            details: { recipient, messageType },
            ip,
            userAgent
        });
    }

    /**
     * Helper: Log campaign action
     */
    static logCampaign(userEmail, action, campaignId, details = null) {
        return this.log({
            userEmail,
            action: `CAMPAIGN_${action.toUpperCase()}`,
            resource: 'campaign',
            resourceId: campaignId,
            details
        });
    }

    static logCampaignCreate(userEmail, campaignId, name, recipientCount) {
        return this.logCampaign(userEmail, 'CREATE', campaignId, { name, recipientCount });
    }

    static logCampaignUpdate(userEmail, campaignId, name, changes) {
        return this.logCampaign(userEmail, 'UPDATE', campaignId, { name, changes });
    }

    static logCampaignDelete(userEmail, campaignId, name) {
        return this.logCampaign(userEmail, 'DELETE', campaignId, { name });
    }

    static logCampaignStart(userEmail, campaignId, name, recipientCount) {
        return this.logCampaign(userEmail, 'START', campaignId, { name, recipientCount });
    }

    static logCampaignPause(userEmail, campaignId, reason) {
        return this.logCampaign(userEmail, 'PAUSE', campaignId, { reason });
    }

    static logCampaignResume(userEmail, campaignId, name) {
        return this.logCampaign(userEmail, 'RESUME', campaignId, { name });
    }

    static logCampaignComplete(userEmail, campaignId, name, statistics) {
        return this.logCampaign(userEmail, 'COMPLETE', campaignId, { name, statistics });
    }

    static logCampaignRetry(userEmail, campaignId, name, retryCount) {
        return this.logCampaign(userEmail, 'RETRY', campaignId, { name, retryCount });
    }

    static logCampaignMessage(userEmail, campaignId, recipient, status, error = null) {
        return this.logCampaign(userEmail, 'MESSAGE', campaignId, { recipient, status, error });
    }

    /**
     * Helper: Log AI Model management action
     */
    static logAIModel(userEmail, action, modelId, details = null) {
        return this.log({
            userEmail,
            action: `AI_MODEL_${action.toUpperCase()}`,
            resource: 'ai_model',
            resourceId: modelId,
            details
        });
    }

    /**
     * Helper: Log user management action
     */
    static logUserAction(userEmail, action, resource, resourceId, details) {
        return this.log({
            userEmail,
            action,
            resource,
            resourceId,
            details
        });
    }

    /**
     * Get daily analytics for a user
     * Optimized version: Uses GROUP BY to reduce query count from O(n) to O(1)
     * @param {string} userEmail - User email
     * @param {number} days - Number of days
     * @returns {array} Daily data points
     */
    static getAnalytics(userEmail = null, days = 7) {
        const daysBack = (parseInt(days) || 7) - 1;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        const startDateStr = startDate.toISOString().split('T')[0] + ' 00:00:00';

        // 1. Fetch all activity logs stats in one query
        let logSql = `
            SELECT
                date(created_at) as log_date,
                COUNT(CASE WHEN action IN ('MESSAGE_SEND', 'CAMPAIGN_MESSAGE', 'send_message') THEN 1 END) as messages,
                COUNT(CASE WHEN action LIKE 'AI_%' OR action LIKE 'ai_%' THEN 1 END) as ai_total,
                COUNT(CASE WHEN (action LIKE 'AI_%' OR action LIKE 'ai_%') AND success = 1 THEN 1 END) as ai_success
            FROM activity_logs
            WHERE created_at >= ?
        `;
        const logParams = [startDateStr];
        if (userEmail) {
            logSql += ' AND user_email = ?';
            logParams.push(userEmail);
        }
        logSql += ' GROUP BY log_date';

        const logRows = db.prepare(logSql).all(...logParams);
        const logMap = logRows.reduce((acc, row) => {
            acc[row.log_date] = row;
            return acc;
        }, {});

        // 2. Fetch all credit usage in one query
        let creditSql = `
            SELECT
                date(created_at) as credit_date,
                SUM(amount) as total_credits
            FROM credit_history
            WHERE created_at >= ? AND type = 'debit'
        `;
        const creditParams = [startDateStr];
        if (userEmail) {
            const user = db.prepare('SELECT id FROM users WHERE email = ?').get(userEmail);
            if (user) {
                creditSql += ' AND user_id = ?';
                creditParams.push(user.id);
            } else {
                creditSql += ' AND 1=0';
            }
        }
        creditSql += ' GROUP BY credit_date';

        const creditRows = db.prepare(creditSql).all(...creditParams);
        const creditMap = creditRows.reduce((acc, row) => {
            acc[row.credit_date] = row.total_credits;
            return acc;
        }, {});

        // 3. Assemble final data array for all requested days
        const data = [];
        const now = new Date();
        for (let i = daysBack; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const logData = logMap[dateStr] || { messages: 0, ai_total: 0, ai_success: 0 };
            const aiRate = logData.ai_total > 0 ? Math.round((logData.ai_success / logData.ai_total) * 100) : 100;

            data.push({
                date: dateStr,
                messages: logData.messages,
                aiRate: aiRate,
                credits: creditMap[dateStr] || 0
            });
        }

        return data;
    }

    /**
     * Clean old logs
     * @param {number} daysToKeep - Number of days to keep
     * @returns {number} Number of deleted logs
     */
    static cleanOld(daysToKeep = 30) {
        const stmt = db.prepare(`
            DELETE FROM activity_logs 
            WHERE created_at < datetime('now', '-' || ? || ' days')
        `);
        const result = stmt.run(daysToKeep);
        return result.changes;
    }
}

module.exports = ActivityLog;
