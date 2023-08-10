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

      console.log(response.message)

      res.status(response.status)
      res.json(response.message)
    } else {
      response = { message: 'Authorized request to Zoom Webhook sample.', status: 200 }

      console.log(response.message)

      res.status(response.status)
      res.json(response)

  if(req.body.event === 'meeting.participant_joined') {
    const participantName = req.body.payload.object.participant.user_name;
    const meetingId = req.body.payload.object.id;

    // List of meeting IDs you're interested in
    const targetMeetingIds = [
  '7214926104', '3401482925', '2173325443', '7873022402', '5257477503',
  '9522960235', '6872746626', '3075618023', '5519524161', '9223375392',
  '8504100770', '4320805963', '7614622031', '3825701420', '8411939930',
  '8465883832', '8020338961', '6263281468', '8611941283', '5203069113',
  '4075983581', '9029618114', '6819765727', '5642208590', '6461130412',
  '5336564866', '3400768558', '6396767386', '8967202011', '4774066127',
  '9998173534', '7669829455', '2739038613', '9681127256', '2725784985',
  '3776271342', '7250159365', '9072235292', '5103702513', '8917770397',
  '3807441029', '4825464477', '5615261244', '5301098967', '5117169595',
  '7529538283', '8230366299', '5944978371', '4541815666', '8240787316'
];

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

    }
  } else {

    response = { message: 'Unauthorized request to Zoom Webhook sample.', status: 401 }

    console.log(response.message)

    res.status(response.status)
    res.json(response)
  }
})

app.listen(port, () => console.log(`Zoom Webhook sample listening on port ${port}!`))
