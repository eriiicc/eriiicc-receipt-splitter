const fs = require('fs');
const path = require('path');

const privacy = `<!DOCTYPE html>
<html>
<head><title>Settled - Privacy Policy</title>
<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#1a1a1a;}</style>
</head>
<body>
<h1>Privacy Policy</h1>
<p>Last updated: April 2026</p>
<h2>Information We Collect</h2>
<p>Settled collects phone numbers you provide when inviting others to split a bill. We do not store payment information. Receipt data is processed temporarily to extract line items and is not permanently stored.</p>
<h2>How We Use Your Information</h2>
<p>Phone numbers are used solely to send bill split invitations via SMS. We do not sell or share your information with third parties for marketing purposes.</p>
<h2>SMS Communications</h2>
<p>By using Settled, you consent to receive SMS messages when a friend invites you to split a bill. Message and data rates may apply. Reply STOP to opt out.</p>
<h2>Data Retention</h2>
<p>Bill split session data is retained for 30 days then deleted automatically.</p>
<h2>Contact</h2>
<p>For privacy questions, contact us at privacy@settled.app</p>
</body>
</html>`;

const terms = `<!DOCTYPE html>
<html>
<head><title>Settled - Terms of Service</title>
<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#1a1a1a;}</style>
</head>
<body>
<h1>Terms of Service</h1>
<p>Last updated: April 2026</p>
<h2>Acceptance of Terms</h2>
<p>By using Settled, you agree to these terms. If you do not agree, do not use the app.</p>
<h2>Description of Service</h2>
<p>Settled is a mobile application that helps users split bills and receipts among groups. The app facilitates payment requests but does not process payments directly.</p>
<h2>User Responsibilities</h2>
<p>Users are responsible for ensuring they have permission to share others' phone numbers. Users must only invite people who have consented to receive SMS messages from them.</p>
<h2>SMS Messaging</h2>
<p>Settled sends SMS messages on behalf of users to their invited contacts. Message and data rates may apply. Recipients can opt out by replying STOP.</p>
<h2>Payments</h2>
<p>Settled facilitates connections to third-party payment services (Venmo, Cash App, Zelle). We are not responsible for payment disputes or transaction failures.</p>
<h2>Limitation of Liability</h2>
<p>Settled is provided as-is. We are not liable for any damages arising from use of the service.</p>
<h2>Contact</h2>
<p>For questions, contact us at support@settled.app</p>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', 'legal', 'privacy.html'), privacy);
fs.writeFileSync(path.join(__dirname, '..', 'legal', 'terms.html'), terms);
console.log('Done! Legal pages created.');