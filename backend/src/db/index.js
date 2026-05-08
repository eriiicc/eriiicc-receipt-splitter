const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../db.json');

const readDb = () => {
  if (!fs.existsSync(DB_PATH)) {
    return { sessions: {}, claims: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { sessions: {}, claims: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const init = () => {
  if (!fs.existsSync(DB_PATH)) {
    writeDb({ sessions: {}, claims: [] });
  }
};

const createSession = async (id, restaurantName, items, tax, tip, paymentInfo) => {
  const db = readDb();
  db.sessions[id] = { id, restaurantName, items, tax, tip, paymentInfo: paymentInfo || {}, createdAt: Date.now() };
  writeDb(db);
};


const getSession = async (id) => {
  const db = readDb();
  return db.sessions[id] || null;
};

const claimItems = async (sessionId, selections, claimedBy) => {
  const db = readDb();
  for (const { itemIndex, qty } of selections) {
    db.claims.push({ sessionId, itemIndex, qtyClaimed: qty, claimedBy, createdAt: Date.now() });
  }
  writeDb(db);
};

const getClaims = async (sessionId) => {
  const db = readDb();
  return db.claims.filter(c => c.sessionId === sessionId);
};

module.exports = { init, createSession, getSession, claimItems, getClaims };

const getAllSessions = async () => {
  const db = readDb();
  console.log('Total sessions in DB:', Object.keys(db.sessions).length);
  return Object.values(db.sessions).sort((a, b) => b.createdAt - a.createdAt);
};