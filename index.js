const https = require('https');
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')

const app = express()
const port = process.env.PORT || 4000
const googleChatWebhookUrl = new URL(process.env.GOOGLE_CHAT_WEBHOOK_URL)

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.status(200)
  res.send(`Zoom Webhook sample successfully running. Set this URL with the /webhook path as your apps Event notification endpoint URL. https://github.com/zoom/webhook-sample`)
})

app.post('/webhook', (req, res) => {
  console.log(req.headers)
  console.log(req.body)

  const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`
  const hashForVerify = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(message).digest('hex')
  const signature = `v0=${hashForVerify}`

  if (req.headers['x-zm-signature'] !== signature) {
    console.log('Unauthorized request to Zoom Webhook.')
    return res.status(403).end()
  }

  if(req.body.event === 'meeting.participant_left') {
    const participantName = req.body.payload.object.participant.user_name;

    // List of participant names you're interested in
    const targetNames = ['Alpha Autoproctor 3', 'alphaproctor3@alpha.school'];

    if (!targetNames.includes(participantName)) {
        console.log(`Ignoring participant: ${participantName}`);
        return res.status(200).end();
    }

    const chatMessage = `${participantName} has left the meeting.`;
    const postData = JSON.stringify({ 'text': chatMessage });

    const options = {
      hostname: googleChatWebhookUrl.hostname,
      path: googleChatWebhookUrl.pathname + googleChatWebhookUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const googleChatRequest = https.request(options, (googleChatRes) => {
      googleChatRes.on('data', (d) => {
        process.stdout.write(d);
      });
    });

    googleChatRequest.on('error', (error) => {
      console.error('Error sending message to Google Chat', error);
    });

    googleChatRequest.write(postData);
    googleChatRequest.end();

    console.log(`Message sent to Google Chat: ${chatMessage}`);
  }

  res.status(200).end();
})

app.listen(port, () => console.log(`Zoom Webhook sample listening on port ${port}!`))
