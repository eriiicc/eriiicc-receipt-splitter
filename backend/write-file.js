require('dotenv').config();
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

client.messages.create({
  body: 'Test from receipt splitter!',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+17578145180'
})
.then(m => console.log('Success:', m.sid))
.catch(e => console.log('Error:', e.message));