const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      restaurant_name TEXT,
      items JSONB,
      tax REAL,
      tip REAL,
      payment_info JSONB,
      created_at BIGINT
    );

    CREATE TABLE IF NOT EXISTS claims (
      id SERIAL PRIMARY KEY,
      session_id TEXT,
      item_index INTEGER,
      qty_claimed INTEGER,
      claimed_by TEXT,
      created_at BIGINT
    );
  `);
  console.log('Database initialized');
};

const createSession = async (id, restaurantName, items, tax, tip, paymentInfo) => {
  await pool.query(
    `INSERT INTO sessions (id, restaurant_name, items, tax, tip, payment_info, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET items = $3, tax = $4, tip = $5, payment_info = $6`,
    [id, restaurantName, JSON.stringify(items), tax, tip, JSON.stringify(paymentInfo || {}), Date.now()]
  );
};

const getSession = async (id) => {
  const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    restaurantName: row.restaurant_name,
    items: row.items,
    tax: row.tax,
    tip: row.tip,
    paymentInfo: row.payment_info,
    createdAt: row.created_at,
  };
};

const claimItems = async (sessionId, selections, claimedBy) => {
  for (const { itemIndex, qty } of selections) {
    await pool.query(
      `INSERT INTO claims (session_id, item_index, qty_claimed, claimed_by, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, itemIndex, qty, claimedBy, Date.now()]
    );
  }
};

const getClaims = async (sessionId) => {
  const result = await pool.query('SELECT * FROM claims WHERE session_id = $1', [sessionId]);
  return result.rows.map(row => ({
    sessionId: row.session_id,
    itemIndex: row.item_index,
    qtyClaimed: row.qty_claimed,
    claimedBy: row.claimed_by,
  }));
};

const getAllSessions = async () => {
  const result = await pool.query('SELECT * FROM sessions ORDER BY created_at DESC');
  const sessions = [];
  for (const row of result.rows) {
    const claims = await getClaims(row.id);
    const claimedMap = {};
    for (const claim of claims) {
      claimedMap[claim.itemIndex] = (claimedMap[claim.itemIndex] || 0) + claim.qtyClaimed;
    }
    const items = (row.items || []).map((item, index) => ({
      ...item,
      claimed: claimedMap[index] || 0,
      available: item.quantity - (claimedMap[index] || 0),
    }));
    sessions.push({
      id: row.id,
      restaurantName: row.restaurant_name,
      items,
      tax: row.tax,
      tip: row.tip,
      paymentInfo: row.payment_info,
      createdAt: row.created_at,
    });
  }
  return sessions;
};

module.exports = { init, createSession, getSession, claimItems, getClaims, getAllSessions };