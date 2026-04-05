/**
 * KeywordResponder Model
 * Manages keyword-based auto-responses
 */

const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const MemoryCache = require('../utils/cache');

const activeRulesCache = new MemoryCache(60); // 60 seconds TTL

class KeywordResponder {
    /**
     * Find all rules for a session
     */
    static findBySessionId(sessionId) {
        return db.prepare('SELECT * FROM keyword_responders WHERE session_id = ? ORDER BY created_at DESC').all(sessionId);
    }

    /**
     * Find active rules for a session
     */
    static findActiveBySessionId(sessionId) {
        const cacheKey = `active_rules_${sessionId}`;
        const cached = activeRulesCache.get(cacheKey);
        if (cached) return cached;

        const rules = db.prepare('SELECT * FROM keyword_responders WHERE session_id = ? AND is_active = 1').all(sessionId);
        activeRulesCache.set(cacheKey, rules);
        return rules;
    }

    /**
     * Find rule by ID
     */
    static findById(id) {
        return db.prepare('SELECT * FROM keyword_responders WHERE id = ?').get(id);
    }

    /**
     * Create a new rule
     */
    static create(data) {
        const { session_id, keyword, match_type, response_type, response_content, file_name } = data;
        const id = uuidv4();

        db.prepare(`
            INSERT INTO keyword_responders (
                id, session_id, keyword, match_type, response_type, response_content, file_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, session_id, keyword, match_type || 'contains', response_type || 'text', response_content, file_name || null);

        activeRulesCache.delete(`active_rules_${session_id}`);

        return this.findById(id);
    }

    /**
     * Update a rule
     */
    static update(id, data) {
        const existingRule = this.findById(id);
        if (!existingRule) return null;

        const { keyword, match_type, response_type, response_content, file_name, is_active } = data;

        db.prepare(`
            UPDATE keyword_responders
            SET keyword = COALESCE(?, keyword),
                match_type = COALESCE(?, match_type),
                response_type = COALESCE(?, response_type),
                response_content = COALESCE(?, response_content),
                file_name = COALESCE(?, file_name),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(keyword, match_type, response_type, response_content, file_name, is_active, id);

        activeRulesCache.delete(`active_rules_${existingRule.session_id}`);

        return this.findById(id);
    }

    /**
     * Delete a rule
     */
    static delete(id) {
        const existingRule = this.findById(id);
        const result = db.prepare('DELETE FROM keyword_responders WHERE id = ?').run(id);

        if (existingRule && result.changes > 0) {
            activeRulesCache.delete(`active_rules_${existingRule.session_id}`);
        }

        return result;
    }
}

module.exports = KeywordResponder;
