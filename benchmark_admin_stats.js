const Database = require('better-sqlite3');
const db = new Database(':memory:');

db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, is_active INTEGER);
    CREATE TABLE whatsapp_sessions (id INTEGER PRIMARY KEY, status TEXT);
    CREATE TABLE credit_history (id INTEGER PRIMARY KEY, amount INTEGER, type TEXT);
`);

// Insert some data
for (let i = 0; i < 1000; i++) {
    db.prepare('INSERT INTO users (is_active) VALUES (?)').run(i % 2);
    db.prepare('INSERT INTO whatsapp_sessions (status) VALUES (?)').run(i % 3 === 0 ? 'CONNECTED' : 'DISCONNECTED');
    db.prepare('INSERT INTO credit_history (amount, type) VALUES (?, ?)').run(10, i % 2 === 0 ? 'debit' : 'purchase');
}

const iterations = 10000;

console.time('Sequential Queries');
for (let i = 0; i < iterations; i++) {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 1").get().count;
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM whatsapp_sessions').get().count;
    const connectedSessions = db.prepare("SELECT COUNT(*) as count FROM whatsapp_sessions WHERE status = 'CONNECTED'").get().count;
    const totalCreditsDeducted = db.prepare("SELECT SUM(amount) as total FROM credit_history WHERE type = 'debit'").get().total || 0;
    const totalCreditsPurchased = db.prepare("SELECT SUM(amount) as total FROM credit_history WHERE type = 'purchase'").get().total || 0;
}
console.timeEnd('Sequential Queries');

console.time('Bundled Query');
const stmt = db.prepare(`
    SELECT
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as activeUsers,
        (SELECT COUNT(*) FROM whatsapp_sessions) as totalSessions,
        (SELECT COUNT(*) FROM whatsapp_sessions WHERE status = 'CONNECTED') as connectedSessions,
        (SELECT COALESCE(SUM(amount), 0) FROM credit_history WHERE type = 'debit') as totalCreditsDeducted,
        (SELECT COALESCE(SUM(amount), 0) FROM credit_history WHERE type = 'purchase') as totalCreditsPurchased
`);
for (let i = 0; i < iterations; i++) {
    const row = stmt.get();
}
console.timeEnd('Bundled Query');
