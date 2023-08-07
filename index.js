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
  var response

  console.log(req.headers)
  console.log(req.body)

  // construct the message string
  const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`

  const hashForVerify = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(message).digest('hex')

  // hash the message string with your Webhook Secret Token and prepend the version semantic
  const signature = `v0=${hashForVerify}`

  // you validating the request came from Zoom https://marketplace.zoom.us/docs/api-reference/webhook-reference#notification-structure
  if (req.headers['x-zm-signature'] === signature) {

    // Zoom validating you control the webhook endpoint https://marketplace.zoom.us/docs/api-reference/webhook-reference#validate-webhook-endpoint
    if(req.body.event === 'endpoint.url_validation') {
      const hashForValidate = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(req.body.payload.plainToken).digest('hex')

      response = {
        message: {
          plainToken: req.body.payload.plainToken,
          encryptedToken: hashForValidate
        },
        status: 200
      }

  if(req.body.event === 'meeting.participant_joined') {
    const participantName = req.body.payload.object.participant.user_name;
    const meetingId = req.body.payload.object.id;

    // List of meeting IDs you're interested in
    const targetMeetingIds = ['7873022402', '5257477503'];

    if (!targetMeetingIds.includes(meetingId)) {
        console.log(`Ignoring meeting ID: ${meetingId}`);
        return res.status(200).end();
    }

    const chatMessage = `${participantName} has joined coaching room ${meetingId}.`;
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
