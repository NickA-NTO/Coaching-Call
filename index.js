const https = require('https');
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')

const app = express()
const port = process.env.PORT || 4000
const googleChatWebhookUrl = new URL(process.env.GOOGLE_CHAT_WEBHOOK_URL)

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

  // Handle the URL validation event
  if(req.body.event === 'endpoint.url_validation') {
    return res.json({ challenge: req.body.payload.challenge });
  }
  
  if(req.body.event === 'meeting.participant_joined') {
    // ... the rest of your code ...
  }

  res.status(200).end();
})

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

  if(req.body.event === 'meeting.participant_joined') { // Changed to 'meeting.participant_joined'
    const participantName = req.body.payload.object.participant.user_name;
    const meetingId = req.body.payload.object.id;
    const hostId = req.body.payload.object.host_id; // User ID of the host

    console.log(`Host ID: ${hostId}`); // Log the host ID

    // List of meeting IDs you're interested in
    const targetMeetingIds = ['5257477503'];

    if (!targetMeetingIds.includes(meetingId)) {
        console.log(`Ignoring meeting ID: ${meetingId}`);
        return res.status(200).end();
    }

    const chatMessage = `${participantName} has joined Coaching Room ${meetingId}.`; // Changed to 'has joined'
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
