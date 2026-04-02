const { db } = require('./src/config/database');

try {
    const sessionId = "test-session";
    const userEmail = "test@example.com";

    // Simulate some logs to see if extraction works
    db.prepare(`
        INSERT INTO activity_logs (user_email, action, details)
        VALUES (?, 'MESSAGE_SEND', ?)
    `).run(userEmail, JSON.stringify({ recipient: '1234567890@s.whatsapp.net', messageType: 'text' }));

    const contacts = db.prepare(`
        SELECT remote_jid FROM conversation_memory WHERE session_id = ?
        UNION
        SELECT JSON_EXTRACT(details, '$.recipient') as remote_jid FROM activity_logs
        WHERE user_email = ? AND details LIKE '%recipient%' AND JSON_EXTRACT(details, '$.recipient') IS NOT NULL
    `).all(sessionId, userEmail)
    .map(row => row.remote_jid)
    .filter(jid => jid && jid.endsWith('@s.whatsapp.net'));

    console.log("Test passed! Contacts fetched:");
    console.log(contacts);
} catch (e) {
    console.error("Error:", e.message);
}
