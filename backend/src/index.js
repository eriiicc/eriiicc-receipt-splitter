const express = require('express');
const cors = require('cors');
const { init, createSession, getSession, claimItems, getClaims } = require('./db/index');
init();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Receipt splitter API is running!' });
});

app.post('/api/scan-receipt-url', async (req, res) => {
  try {
    const { url } = req.body;
    console.log('Fetching receipt URL via ScraperAPI:', url);

    const scraperUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true`;
    
    const response = await fetch(scraperUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
    });
    
  const html = await response.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/td>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#[0-9]+;/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .join('\n');
    
    console.log('Cleaned text (first 500):', text.substring(0, 500));
    const { items, tax, tip, restaurantName } = parseReceiptText(text);
    console.log('Found items:', items.length, 'Tax:', tax, 'Tip:', tip);
    res.json({ items, tax, tip, restaurantName });
  } catch (error) {
    console.log('URL scan error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-invite', async (req, res) => {
  try {
    const { phoneNumber, senderName, sessionId, items, tax, tip, restaurantName, guestLink } = req.body;
    await createSession(sessionId, restaurantName, items, tax, tip);
    console.log('[MOCK SMS] To:', phoneNumber);
    console.log('[MOCK SMS] Message:', senderName, 'is splitting a bill with you!');
    console.log('[MOCK SMS] Guest link:', guestLink);
    res.json({ success: true, messageId: 'mock-' + Date.now() });
  } catch (error) {
    console.log('Invite error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/scan-receipt-url', async (req, res) => {
  let browser = null;
  try {
    const { url } = req.body;
    console.log('Fetching receipt URL with Puppeteer:', url);
    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page text (first 500 chars):', text.substring(0, 500));
  const { items, tax, tip, restaurantName } = parseReceiptText(text);
res.json({ items, tax, tip, restaurantName });
  } catch (error) {
    console.log('Puppeteer error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.get('/api/session/:id', async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const claims = await getClaims(req.params.id);
    const claimedMap = {};
    for (const claim of claims) {
      claimedMap[claim.itemIndex] = (claimedMap[claim.itemIndex] || 0) + claim.qtyClaimed;
    }
    const itemsWithAvailability = session.items.map((item, index) => ({
      ...item,
      claimed: claimedMap[index] || 0,
      available: item.quantity - (claimedMap[index] || 0),
    }));
    res.json({ ...session, items: itemsWithAvailability });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/session/:id/claim', async (req, res) => {
  try {
    const { selections, claimedBy } = req.body;
    await claimItems(req.params.id, selections, claimedBy || 'guest');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let restaurantName = '';
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (line.length > 2 && !/^\d/.test(line) && !/^http/i.test(line)) {
      restaurantName = line;
      break;
    }
  }
  console.log('Restaurant name found:', restaurantName);
  const items = [];
  const priceRegex = /\$?(\d+\.\d{2})/;
  let tax = 0;
  let tip = 0;

  const skipLine = (line) => {
    const skipPatterns = [
      /subtotal/i, /^total/i, /cash/i,
      /change/i, /balance/i, /savings/i, /surcharge/i,
      /guest count/i, /ordered:/i, /check #/i,
      /input type/i, /transaction/i, /authorization/i,
      /approval/i, /payment id/i, /application id/i,
      /emv/i, /chip/i, /american express/i, /visa/i,
      /mastercard/i, /xxxx/i, /approved/i,
      /^\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}/,
      /^[0-9]{3}-[0-9]{3}/,
      /^[tn]$/i, /regular price/i, /% off/i,
      /new bal/i, /cannot be/i, /^\d+$/,
    ];
    return skipPatterns.some(p => p.test(line));
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const taxMatch = line.match(/tax/i);
    if (taxMatch) {
      const priceMatch = line.match(priceRegex);
      if (priceMatch) { tax = parseFloat(priceMatch[1]); continue; }
      const nextLine = lines[i + 1] || '';
      const nextPriceMatch = nextLine.match(priceRegex);
      if (nextPriceMatch) { tax = parseFloat(nextPriceMatch[1]); i++; continue; }
    }

    const tipMatch = line.match(/^tip$/i);
    if (tipMatch) {
      const nextLine = lines[i + 1] || '';
      const nextPriceMatch = nextLine.match(priceRegex);
      if (nextPriceMatch) { tip = parseFloat(nextPriceMatch[1]); i++; continue; }
    }

    if (skipLine(line)) continue;

    const priceMatch = line.match(priceRegex);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      const name = line.replace(/\$?\d+\.\d{2}/, '').trim();
      const qtyMatch = name.match(/^(\d+)\s+(.+)/);
      if (name.length > 2 && price > 0 && price < 500 && !skipLine(name)) {
        if (qtyMatch) {
          const qty = parseInt(qtyMatch[1]);
          const itemName = qtyMatch[2];
          items.push({ name: itemName, price: price / qty, quantity: qty });
        } else {
          items.push({ name, price, quantity: 1 });
        }
      }
      continue;
    }

    const nextLine = lines[i + 1] || '';
    const nextPriceMatch = nextLine.match(priceRegex);
    if (nextPriceMatch && !skipLine(nextLine)) {
      const price = parseFloat(nextPriceMatch[1]);
      const name = line.replace(/\$?\d+\.\d{2}/, '').trim();
      const qtyMatch2 = name.match(/^(\d+)\s+(.+)/);
      if (name.length > 2 && price > 0 && price < 500 && !skipLine(name)) {
        if (qtyMatch2) {
          const qty = parseInt(qtyMatch2[1]);
          const itemName = qtyMatch2[2];
          items.push({ name: itemName, price: price / qty, quantity: qty });
        } else {
          items.push({ name, price, quantity: 1 });
        }
        i++;
      }
    }
  }
  return { items, tax, tip, restaurantName };
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});