const { db } = require('./src/config/database');

try {
    const sessionId = "test-session";
    const contacts = db.prepare(`
        SELECT remote_jid FROM conversation_memory WHERE session_id = ?
        UNION
        SELECT JSON_EXTRACT(details, '$.remoteJid') as remote_jid FROM activity_logs
        WHERE user_email = ? AND details LIKE '%remoteJid%' AND JSON_EXTRACT(details, '$.remoteJid') IS NOT NULL
    `).all(sessionId, sessionId)
    .map(row => row.remote_jid)
    .filter(jid => jid && jid.endsWith('@s.whatsapp.net'));

    console.log("Test passed! Contacts fetched without SQL errors.");
    console.log(contacts);
} catch (e) {
    console.error("Error:", e.message);
}
