const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
// const { googleAuth } = require('google-auth-library');
const { OAuth2Client } = require('google-auth-library');
const { request } = require('https');
const { url } = require('inspector');



const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = 'token.json';

async function authorize() {
  const credentials = require('./credentials.json'); // Update with your credentials file
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

  try {
    const token = require(`./${TOKEN_PATH}`);
    oAuth2Client.setCredentials(token);
  } catch (err) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    const { default: open } = await import('open');
    console.log('Authorize this app by visiting this url:', authUrl);
  await open(authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
setTimeout(() => {
}, 20000);
console.log(Headers)
    const code = await new Promise((resolve) => {
      rl.question('Enter the code from the page after authorizing: ', (code) => {
        rl.close();
        resolve(code);
      });
    });

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  }

  return oAuth2Client;
}

async function listEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
 
  const response = await gmail.users.messages.list({
    userId: 'me',
  });

  return response.data.messages;
}

async function sendReply(auth, threadId) {
  const gmail = google.gmail({ version: 'v1', auth });

  // Get the latest message in the thread
  const response = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
  });
 
  const latestMessage = response.data.messages[0];
  const originalMessageId = latestMessage.id;

  // Check if you have replied to this thread before
  if (latestMessage.labelIds.includes('SENT')) {
    console.log('Already replied to this thread.');
    return;
  }

  // // Create a reply
  // const reply = `Thank you for your email.`;
  // Send the reply
  try {
    const emailContent = "From: \"Stanley Toles\" <shakshamneekhra96@gmail.com>\r\n" +
  "To: \"Stanley Toles\" <shakshamneekhra96@gmail.com>\r\n" +
  "Subject: Assigment\r\n" +
  "Content-type: text/html;charset=iso-8859-1\r\n\r\n" +
  "Thank-you for visiting ";

const encodedEmail = Buffer.from(emailContent).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        threadId,
        raw: encodedEmail,
  
      },
    });
  } catch (error) {
    console.log(error)
  }
try {
  await gmail.users.messages.modify({
    userId: 'me',
    id: originalMessageId,
    requestBody: {
      addLabelIds: ['UNREAD'], 
    },
  });

  console.log('Replied to the email successfully.');
} catch (error) {
  console.log(error)
  
}
await createLabelIfNotExists(gmail, "UNREAD");
await gmail.users.messages.modify({
  userId: 'me',
  id: originalMessageId,
  requestBody: {
    addLabelIds: ['UNREAD'], 
  },
});

console.log('Replied to the email and added label successfully.');
  // Label the original message as replied
  
}


async function createLabelIfNotExists(gmail, labelName) {
  const labels = await gmail.users.labels.list({
    userId: 'me',
  });

  const existingLabel = labels.data.labels.find(label => label.name === labelName);

  if (!existingLabel) {
    await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: labelName,
      },
    });
    console.log(`Label '${labelName}' created.`);
  }
}
async function main() {
  const auth = await authorize();
  
  const repeatInterval = getRandomInt(45, 120);
  console.log(`Next repetition in ${repeatInterval} seconds.`);

  setTimeout(async () => {
    const emails = await listEmails(auth);

    for (const email of emails) {
      await sendReply(auth, email.threadId);
    }

    // Recursive call for the next repetition
    main();
  }, repeatInterval * 1000);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

main();

