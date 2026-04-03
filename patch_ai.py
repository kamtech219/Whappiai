import re

with open('src/services/ai.js', 'r') as f:
    content = f.read()

# Add string-similarity import
if 'string-similarity' not in content:
    content = content.replace("const { db } = require('../config/database');", "const { db } = require('../config/database');\nconst stringSimilarity = require('string-similarity');")

# Modify isLoopDetected
old_isLoopDetected = """
    static isLoopDetected(sessionId, remoteJid) {
        const key = `${sessionId}:${remoteJid}`;
        const now = Date.now();
        const history = aiResponseHistory.get(key) || [];

        // Keep only timestamps from the last 10 minutes
        const recentResponses = history.filter(ts => (now - ts) < 10 * 60 * 1000);
        aiResponseHistory.set(key, recentResponses);

        // Threshold: More than 10 responses in 10 minutes is likely a loop
        if (recentResponses.length >= 10) {
            log(`Protection anti-boucle activée pour ${remoteJid} : ${recentResponses.length} réponses en 10 min.`, sessionId, { event: 'ai-loop-block', remoteJid, count: recentResponses.length }, 'WARN');
            return true;
        }
        return false;
    }
"""

new_isLoopDetected = """
    static isLoopDetected(sessionId, remoteJid, newResponseContent = null) {
        const key = `${sessionId}:${remoteJid}`;
        const now = Date.now();
        const history = aiResponseHistory.get(key) || [];

        // Keep only timestamps and contents from the last 10 minutes
        const recentResponses = history.filter(item => (now - item.timestamp) < 10 * 60 * 1000);
        aiResponseHistory.set(key, recentResponses);

        // 1. Time-based threshold: More than 10 responses in 10 minutes is likely a loop
        if (recentResponses.length >= 10) {
            log(`Protection anti-boucle activée pour ${remoteJid} : ${recentResponses.length} réponses en 10 min.`, sessionId, { event: 'ai-loop-block', remoteJid, count: recentResponses.length, reason: 'frequency' }, 'WARN');
            return true;
        }

        // 2. Semantic similarity threshold
        if (newResponseContent && recentResponses.length > 0) {
            // Check similarity with the last few messages
            const lastMessages = recentResponses.slice(-3).map(item => item.content).filter(Boolean);
            for (const oldMsg of lastMessages) {
                if (stringSimilarity.compareTwoStrings(oldMsg.toLowerCase(), newResponseContent.toLowerCase()) > 0.85) {
                    log(`Protection anti-boucle activée pour ${remoteJid} : similarité sémantique détectée`, sessionId, { event: 'ai-loop-block', remoteJid, reason: 'semantic-similarity' }, 'WARN');
                    return true;
                }
            }
        }

        return false;
    }
"""

content = content.replace(old_isLoopDetected.strip(), new_isLoopDetected.strip())

# Modify recordAIResponse
old_recordAIResponse = """
    static recordAIResponse(sessionId, remoteJid) {
        const key = `${sessionId}:${remoteJid}`;
        const history = aiResponseHistory.get(key) || [];
        history.push(Date.now());
        aiResponseHistory.set(key, history);
    }
"""

new_recordAIResponse = """
    static recordAIResponse(sessionId, remoteJid, content = '') {
        const key = `${sessionId}:${remoteJid}`;
        const history = aiResponseHistory.get(key) || [];
        history.push({ timestamp: Date.now(), content });
        aiResponseHistory.set(key, history);
    }
"""

content = content.replace(old_recordAIResponse.strip(), new_recordAIResponse.strip())

# Modify handleIncomingMessage where recordAIResponse is called? Wait, recordAIResponse is called in sendAutoResponse.

with open('src/services/ai.js', 'w') as f:
    f.write(content)
