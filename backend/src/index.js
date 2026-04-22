const express = require('express');
const cors = require('cors');
require('dotenv').config();

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
    const text = data.responses?.[0]?.fullTextAnnotation?.text || '';
    console.log('Extracted text:', text.substring(0, 200));
    console.log('Error if any:', JSON.stringify(data.responses?.[0]?.error));
    const items = parseReceiptText(text);
    res.json({ items });
  } catch (error) {
    console.log('Caught error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-invite', async (req, res) => {
  try {
    const { phoneNumber, senderName, sessionId } = req.body;
    console.log('[MOCK SMS] To:', phoneNumber);
    console.log('[MOCK SMS] Message:', senderName, 'is splitting a bill with you! Session:', sessionId);
    res.json({ success: true, messageId: 'mock-' + Date.now() });
  } catch (error) {
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
    const items = parseReceiptText(text);
    console.log('Found items:', items.length);
    res.json({ items });
  } catch (error) {
    console.log('Puppeteer error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items = [];
  const priceRegex = /\$?(\d+\.\d{2})/;

  const skipLine = (line) => {
    const skipPatterns = [
      /subtotal/i, /^total/i, /tax/i, /tip/i, /cash/i,
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
    if (skipLine(line)) continue;

    const priceMatch = line.match(priceRegex);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      const name = line.replace(/\$?\d+\.\d{2}/, '').trim();
      if (name.length > 2 && price > 0 && price < 500 && !skipLine(name)) {
        items.push({ name, price });
      }
      continue;
    }

    const nextLine = lines[i + 1] || '';
    const nextPriceMatch = nextLine.match(priceRegex);
    if (nextPriceMatch && !skipLine(nextLine)) {
      const price = parseFloat(nextPriceMatch[1]);
      const name = line.replace(/\$?\d+\.\d{2}/, '').trim();
      if (name.length > 2 && price > 0 && price < 500 && !skipLine(name)) {
        items.push({ name, price });
        i++;
      }
    }
  }
  return items;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});