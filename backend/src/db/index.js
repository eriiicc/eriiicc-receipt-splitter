const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

const adapter = new JSONFile(path.join(__dirname, '../../db.json'));
const db = new Low(adapter, { sessions: {}, claims: [] });

const init = async () => {
  await db.read();
  db.data ||= { sessions: {}, claims: [] };
};

const createSession = async (id, restaurantName, items, tax, tip) => {
  await db.read();
  db.data.sessions[id] = { id, restaurantName, items, tax, tip, createdAt: Date.now() };
  await db.write();
};

const getSession = async (id) => {
  await db.read();
  return db.data.sessions[id] || null;
};

const claimItems = async (sessionId, selections, claimedBy) => {
  await db.read();
  for (const { itemIndex, qty } of selections) {
    db.data.claims.push({ sessionId, itemIndex, qtyClaimed: qty, claimedBy, createdAt: Date.now() });
  }
  await db.write();
};

const getClaims = async (sessionId) => {
  await db.read();
  return db.data.claims.filter(c => c.sessionId === sessionId);
};

module.exports = { init, createSession, getSession, claimItems, getClaims };