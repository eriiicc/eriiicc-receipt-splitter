const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../settled.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    restaurant_name TEXT,
    items TEXT,
    tax REAL,
    tip REAL,
    created_at INTEGER
  );
`);

const createSession = (id, restaurantName, items, tax, tip) => {
  db.prepare(`
    INSERT INTO sessions (id, restaurant_name, items, tax, tip, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, restaurantName, JSON.stringify(items), tax, tip, Date.now());
};

const getSession = (id) => {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!row) return null;
  return {
    id: row.id,
    restaurantName: row.restaurant_name,
    items: JSON.parse(row.items),
    tax: row.tax,
    tip: row.tip,
  };
};

module.exports = { createSession, getSession };