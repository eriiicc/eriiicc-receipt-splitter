const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();
const { init, createSession, getSession, claimItems, getClaims, getAllSessions } = require('./db/index');

init();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Receipt splitter API is running!' });
});

app.post('/api/scan-receipt', async (req, res) => {
  console.log('Request received, image size:', req.body.image?.length);
  try {
    const { image } = req.body;
    const cleanImage = image.replace(/^data:image\/\w+;base64,/, '').replace(/\s/g, '');
    console.log('First 20 chars of image:', cleanImage.substring(0, 20));
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ image: { content: cleanImage }, features: [{ type: 'TEXT_DETECTION' }] }],
        }),
      }
    );
    console.log('Vision API status:', response.status);
    const data = await response.json();
    console.log('Full Vision response:', JSON.stringify(data).substring(0, 500));
    const text = data.responses?.[0]?.fullTextAnnotation?.text || '';
    console.log('Extracted text:', text.substring(0, 200));
    console.log('Error if any:', JSON.stringify(data.responses?.[0]?.error));
    const { items, tax, tip, restaurantName } = parseReceiptText(text);
    res.json({ items, tax, tip, restaurantName });
  } catch (error) {
    console.log('Caught error:', error.message);
    res.status(500).json({ error: error.message });
  }
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
    const { paymentInfo } = req.body;
    await createSession(sessionId, restaurantName, items, tax, tip, paymentInfo);
    
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

 const guestWebUrl = `https://eriiicc-receipt-splitter-production.up.railway.app/guest?session=${sessionId}`;
    
    const message = await client.messages.create({
      body: `${senderName} invited you to split a bill${restaurantName ? ' at ' + restaurantName : ''}! Select your items here: ${guestWebUrl}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log('SMS sent to:', phoneNumber, 'SID:', message.sid);
    res.json({ success: true, messageId: message.sid });
  } catch (error) {
    console.log('SMS error:', error.message);
    res.status(500).json({ error: error.message });
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

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await getAllSessions();
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/guest', async (req, res) => {
  const { session } = req.query;
  if (!session) {
    return res.send('<h1>Invalid link</h1>');
  }

  try {
    const sessionData = await getSession(session);
    if (!sessionData) {
      return res.send('<h1>Session not found or expired</h1>');
    }
    const claims = await getClaims(session);
    const claimedMap = {};
    for (const claim of claims) {
      claimedMap[claim.itemIndex] = (claimedMap[claim.itemIndex] || 0) + claim.qtyClaimed;
    }
    const items = sessionData.items.map((item, index) => ({
      ...item,
      claimed: claimedMap[index] || 0,
      available: item.quantity - (claimedMap[index] || 0),
    }));

    const itemsJson = JSON.stringify(items);
    const sessionJson = JSON.stringify({ ...sessionData, items });

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settled - Split Bill</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F2EDE0; min-height: 100vh; }
    .header { background: #1A4A3A; padding: 20px 24px; color: #F0D080; }
    .header h1 { font-size: 24px; font-weight: 600; }
    .header p { font-size: 14px; opacity: 0.8; margin-top: 4px; }
    .restaurant { background: #fff; padding: 16px 24px; border-bottom: 1px solid #EEE8D0; }
    .restaurant h2 { font-size: 18px; color: #1A4A3A; font-weight: 600; }
    .restaurant p { font-size: 13px; color: #6B7B6E; margin-top: 2px; }
    .items { padding: 16px 24px; }
    .items h3 { font-size: 15px; color: #6B7B6E; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .item { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 10px; border: 2px solid transparent; transition: all 0.2s; }
    .item.claimed { opacity: 0.4; }
    .item.selected { border-color: #1A4A3A; background: #F0FFF8; }
    .item-row { display: flex; justify-content: space-between; align-items: center; }
    .item-name { font-size: 16px; color: #1A1A1A; font-weight: 500; }
    .item-price { font-size: 15px; color: #1A4A3A; font-weight: 600; }
    .item-claimed-label { font-size: 12px; color: #6B7B6E; margin-top: 4px; font-style: italic; }
    .qty-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .qty-label { font-size: 13px; color: #6B7B6E; }
    .qty-btn { width: 36px; height: 36px; border-radius: 18px; border: 1.5px solid #EEE8D0; background: #fff; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #1A1A1A; transition: all 0.15s; }
    .qty-btn.active { background: #1A4A3A; border-color: #1A4A3A; color: #F0D080; }
    .qty-total { font-size: 13px; color: #1A4A3A; font-weight: 500; margin-left: 4px; }
    .footer { position: sticky; bottom: 0; background: #fff; padding: 16px 24px; border-top: 1px solid #EEE8D0; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .total-label { font-size: 16px; color: #6B7B6E; }
    .total-amount { font-size: 22px; font-weight: 600; color: #1A4A3A; }
    .confirm-btn { width: 100%; padding: 16px; background: #1A4A3A; color: #F0D080; border: none; border-radius: 10px; font-size: 16px; font-weight: 500; cursor: pointer; }
    .confirm-btn:disabled { background: #6B7B6E; }
    .payment-section { display: none; padding: 24px; }
    .payment-section.show { display: block; }
    .payment-title { font-size: 20px; font-weight: 600; color: #1A4A3A; margin-bottom: 8px; }
    .payment-subtitle { font-size: 14px; color: #6B7B6E; margin-bottom: 24px; }
    .total-card { background: #EEE8D0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .total-card .label { font-size: 14px; color: #26705A; margin-bottom: 8px; }
    .total-card .amount { font-size: 48px; font-weight: 600; color: #1A4A3A; }
    .pay-btn { width: 100%; padding: 16px; border: none; border-radius: 10px; font-size: 16px; font-weight: 500; cursor: pointer; color: #fff; margin-bottom: 12px; }
    .pay-venmo { background: #008CFF; }
    .pay-cashapp { background: #00D632; }
    .pay-zelle { background: #6D1ED4; }
    .available-label { font-size: 12px; color: #E8923A; font-weight: 500; margin-left: 4px; }
  </style>
</head>
<body>
 <div class="header">
    <h1>Settled</h1>
    <p>Select what you ordered</p>
  </div>

  <div id="name-section" style="padding: 24px; background: #fff; border-bottom: 1px solid #EEE8D0;">
    <p style="font-size: 14px; color: #6B7B6E; margin-bottom: 12px;">What's your first name?</p>
    <div style="display: flex; gap: 10px;">
      <input id="guest-name" type="text" placeholder="Your first name" 
        style="flex: 1; padding: 12px 16px; border: 1.5px solid #EEE8D0; border-radius: 10px; font-size: 16px; outline: none;"
        onkeyup="checkName()" />
      <button onclick="submitName()" id="name-btn" 
        style="padding: 12px 20px; background: #1A4A3A; color: #F0D080; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; opacity: 0.5;" 
        disabled>Let's go</button>
    </div>
  </div>

  <div id="main-content" style="display: none;">
  <div class="restaurant">
    <h2>${sessionData.restaurantName || 'Your Bill'}</h2>
    <p>Tap items to claim what you ordered</p>
  </div>
  <div class="items">
    <h3>Items</h3>
    <div id="items-list"></div>
  </div>
  <div class="footer" id="footer">
    <div class="total-row">
      <span class="total-label">Your total</span>
      <span class="total-amount" id="total-display">$0.00</span>
    </div>
    <button class="confirm-btn" id="confirm-btn" onclick="confirmSelection()" disabled>Claim my items</button>
  </div>

  </div><!-- end main-content -->

  <div class="payment-section" id="payment-section">
    <div class="payment-title">Pay your share</div>
    <div class="payment-subtitle">Choose how you want to pay</div>
    <div class="total-card">
      <div class="label">Your total</div>
      <div class="amount" id="payment-amount">$0.00</div>
    </div>
    <button class="pay-btn pay-venmo" id="venmo-btn" onclick="payVenmo()">Pay with Venmo</button>
    <button class="pay-btn pay-cashapp" id="cashapp-btn" onclick="payCashApp()">Pay with Cash App</button>
    <button class="pay-btn pay-zelle" id="zelle-btn" onclick="payZelle()">Pay with Zelle</button>
  </div>

  <script>
let guestName = 'Guest';

    function checkName() {
      const val = document.getElementById('guest-name').value.trim();
      const btn = document.getElementById('name-btn');
      btn.disabled = val.length < 1;
      btn.style.opacity = val.length < 1 ? '0.5' : '1';
    }

    function submitName() {
      const val = document.getElementById('guest-name').value.trim();
      if (!val) return;
      guestName = val;
      document.getElementById('name-section').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
    }
    const sessionData = ${sessionJson};
    const items = sessionData.items;
    const tax = sessionData.tax || 0;
    const tip = sessionData.tip || 0;
    const selections = {};

    function renderItems() {
      const list = document.getElementById('items-list');
      list.innerHTML = items.map((item, i) => {
        const isClaimed = item.available === 0;
        const btns = Array.from({length: item.available + 1}, (_, q) =>
          \`<button class="qty-btn \${selections[i] === q ? 'active' : ''}" onclick="setQty(\${i}, \${q})">\${q}</button>\`
        ).join('');
        const availableLabel = item.available < item.quantity ? \`<span class="available-label">\${item.available} of \${item.quantity} left</span>\` : '';
        const totalLabel = selections[i] > 0 ? \`<span class="qty-total">= $\${(item.price * selections[i]).toFixed(2)}</span>\` : '';
        return \`<div class="item \${isClaimed ? 'claimed' : ''} \${selections[i] > 0 ? 'selected' : ''}" id="item-\${i}">
          <div class="item-row">
            <span class="item-name">\${item.name}</span>
            <span class="item-price">$\${item.price.toFixed(2)} each</span>
          </div>
          \${isClaimed ? '<div class="item-claimed-label">Already claimed</div>' : \`
          <div class="qty-row">
            <span class="qty-label">Qty:</span>
            \${btns}
            \${availableLabel}
            \${totalLabel}
          </div>\`}
        </div>\`;
      }).join('');
    }

    function setQty(index, qty) {
      selections[index] = qty;
      renderItems();
      updateTotal();
    }

    function getReceiptSubtotal() {
      return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    function getSubtotal() {
      return items.reduce((sum, item, i) => sum + item.price * (selections[i] || 0), 0);
    }

    function getTotal() {
      const subtotal = getSubtotal();
      const receiptSubtotal = getReceiptSubtotal();
      const myTax = receiptSubtotal > 0 ? (subtotal / receiptSubtotal) * tax : 0;
      const myTip = receiptSubtotal > 0 ? (subtotal / receiptSubtotal) * tip : 0;
      return subtotal + myTax + myTip;
    }

    function updateTotal() {
      const total = getTotal();
      document.getElementById('total-display').textContent = '$' + total.toFixed(2);
      document.getElementById('confirm-btn').disabled = getSubtotal() === 0;
    }

  async function confirmSelection() {
      const sel = Object.entries(selections)
        .filter(([_, qty]) => qty > 0)
        .map(([index, qty]) => ({ itemIndex: parseInt(index), qty }));

    await fetch('/api/session/${session}/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections: sel, claimedBy: guestName })
      });

      const total = getTotal().toFixed(2);
      document.getElementById('payment-amount').textContent = '$' + total;
      document.querySelector('.footer').style.display = 'none';
      document.querySelector('.items').style.display = 'none';
      document.querySelector('.restaurant').style.display = 'none';
      document.getElementById('payment-section').classList.add('show');

      try {
        const response = await fetch('/api/session/${session}/host-payment-info');
        const info = await response.json();
        
        const venmoBtn = document.getElementById('venmo-btn');
        const cashappBtn = document.getElementById('cashapp-btn');
        const zelleBtn = document.getElementById('zelle-btn');

        if (info.venmo) {
          venmoBtn.style.display = 'block';
          venmoBtn.onclick = () => {
            window.location.href = 'venmo://paycharge?txn=pay&recipients=' + info.venmo + '&amount=' + total + '&note=Settled+-+' + encodeURIComponent(sessionData.restaurantName || 'Bill');
          };
        } else {
          venmoBtn.style.display = 'none';
        }

        if (info.cashapp) {
          cashappBtn.style.display = 'block';
          cashappBtn.onclick = () => {
            const cashTag = info.cashapp.startsWith('$') ? info.cashapp : '$' + info.cashapp;
            window.location.href = 'cashapp://cash.app/pay/' + cashTag;
            setTimeout(() => {
              window.location.href = 'https://cash.app/' + cashTag;
            }, 500);
          };
        } else {
          cashappBtn.style.display = 'none';
        }

        if (info.zelle) {
          zelleBtn.style.display = 'block';
          zelleBtn.onclick = () => {
            alert('Send $' + total + ' via Zelle to: ' + info.zelle);
          };
        } else {
          zelleBtn.style.display = 'none';
        }
      } catch(e) {
        console.log('Could not load payment info', e);
      }
    }

    function payVenmo() {
      alert('Ask your friend for their Venmo to send payment.');
    }
    function payCashApp() {
      alert('Ask your friend for their Cash App to send payment.');
    }
    function payZelle() {
      alert('Ask your friend for their Zelle to send payment.');
    }

    renderItems();
    updateTotal();
  </script>
</body>
</html>`);
  } catch (error) {
    res.status(500).send('<h1>Error loading session</h1>');
  }
});

app.get('/api/session/:id/host-payment-info', async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) return res.status(404).json({});
    res.json(session.paymentInfo || {});
  } catch (error) {
    res.status(500).json({});
  }
});


app.post('/api/session/:id/save', async (req, res) => {
  console.log('Save session request:', req.params.id);
  try {
    const { selections, claimedBy, items, tax, tip, restaurantName, sessionId } = req.body;
    const id = req.params.id;
    
    const existing = await getSession(id);
    if (!existing) {
      await createSession(id, restaurantName, items, tax, tip, {});
    }
    
    if (selections && selections.length > 0) {
      await claimItems(id, selections, claimedBy || 'host');
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items = [];
  const priceRegex = /\$?(\d+\.\d{2})/;
  let tax = 0;
  let tip = 0;
  let restaurantName = '';

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    const cleaned = line.replace(/^your receipt for /i, '').trim();
    if (cleaned.length > 2 && !/^\d/.test(cleaned) && !/^http/i.test(cleaned) && !/^your receipt/i.test(cleaned)) {
      restaurantName = cleaned;
      break;
    }
  }

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
      /@ \$/i,
      /^\d+ @/i,
      /ea$/i,
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
      const cleanName = name.replace(/^\d{5,}\s*/, '').replace(/^\d{3}-\d{3}-\d{3}-\d{3}-\d{3}\s*/, '').trim();
      const qtyMatch = cleanName.match(/^([1-9]\d?)\s+(.+)/);
      if (cleanName.length > 2 && price > 0 && price < 500 && !skipLine(cleanName)) {
        if (qtyMatch) {
          const qty = parseInt(qtyMatch[1]);
          const itemName = qtyMatch[2];
          items.push({ name: itemName, price: price / qty, quantity: qty });
        } else {
          items.push({ name: cleanName, price, quantity: 1 });
        }
      }
      continue;
    }

    const nextLine = lines[i + 1] || '';
    const nextPriceMatch = nextLine.match(priceRegex);
    if (nextPriceMatch && !skipLine(nextLine)) {
      const price = parseFloat(nextPriceMatch[1]);
      const name = line.replace(/\$?\d+\.\d{2}/, '').trim();
      const cleanName = name.replace(/^\d{5,}\s*/, '').replace(/^\d{3}-\d{3}-\d{3}-\d{3}-\d{3}\s*/, '').trim();
      const qtyMatch2 = cleanName.match(/^([1-9]\d?)\s+(.+)/);
      if (cleanName.length > 2 && price > 0 && price < 500 && !skipLine(cleanName)) {
        if (qtyMatch2) {
          const qty = parseInt(qtyMatch2[1]);
          const itemName = qtyMatch2[2];
          items.push({ name: itemName, price: price / qty, quantity: qty });
        } else {
          items.push({ name: cleanName, price, quantity: 1 });
        }
        i++;
      }
    }
  }
  return { items, tax, tip, restaurantName };
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Version: 2.0 - all routes loaded');
  console.log('Vision key starts:', process.env.GOOGLE_VISION_API_KEY?.substring(0, 15));
});