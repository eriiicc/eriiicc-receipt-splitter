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
console.log('Clean image length:', cleanImage.length);
console.log('First 50 chars:', cleanImage.substring(0, 50));
const jpegBase64 = cleanImage;
    console.log('Calling Vision API...');
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: jpegBase64 },
            features: [{ type: 'TEXT_DETECTION' }],
          }],
        }),
      }
    );
    console.log('Vision API status:', response.status);
    const data = await response.json();
    console.log('Vision API data keys:', Object.keys(data));
console.log('Full Vision response:', JSON.stringify(data).substring(0, 500));
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

function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items = [];
  const priceRegex = /^\$?(\d+\.\d{2})$/;
  const skipPatterns = [
    /regular price/i,
    /^[0-9]+ @/i,
    /% off/i,
    /new bal/i,
    /cannot be/i,
    /^[0-9]{3}-[0-9]{3}/,
    /^[tn]$/i,
    /subtotal/i,
    /total/i,
    /tax/i,
    /cash/i,
    /change/i,
    /balance/i,
    /savings/i,
    /discount/i,
    /^\d+$/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const shouldSkip = skipPatterns.some(p => p.test(line));
    if (shouldSkip) continue;

    const nextLine = lines[i + 1] || '';
    const lineAfter = lines[i + 2] || '';

    const nextIsPrice = priceRegex.test(nextLine.replace(/^[TN]\s*/, ''));
    const lineAfterIsPrice = priceRegex.test(lineAfter.replace(/^[TN]\s*/, ''));

    if (nextIsPrice || lineAfterIsPrice) {
      const priceLine = nextIsPrice ? nextLine : lineAfter;
      const priceMatch = priceLine.replace(/^[TN]\s*/, '').match(/(\d+\.\d{2})/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        const name = line
  .replace(/^\d{6,}\s*/, '')
  .replace(/^\d{3}-\d{3}-\d{3}-\d{3}-\d{3}\s*/, '')
  .replace(/\s{2,}/g, ' ')
  .trim();

        if (
          name.length > 2 &&
          price > 0 &&
          price < 500 &&
          !skipPatterns.some(p => p.test(name))
        ) {
          items.push({ name, price });
          i = nextIsPrice ? i + 1 : i + 2;
        }
      }
    }
  }
  return items;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});