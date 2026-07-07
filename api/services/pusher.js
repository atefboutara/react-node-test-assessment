const Pusher = require('pusher');

const CHANNEL_NAME = 'messages';

const requiredEnvironmentVariables = [
  'PUSHER_APP_ID',
  'PUSHER_KEY',
  'PUSHER_SECRET',
  'PUSHER_CLUSTER',
];

let pusher = null;

const isConfigured = requiredEnvironmentVariables.every(
  (variableName) => process.env[variableName]?.trim()
);

if (isConfigured) {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });

  console.log('Pusher Channels initialized');
} else {
  console.warn(
    'Pusher Channels is not configured. Realtime events are disabled.'
  );
}

async function publishEvent(eventName, data) {
  if (!pusher) {
    return false;
  }

  try {
    await pusher.trigger(CHANNEL_NAME, eventName, data);
    return true;
  } catch (error) {
    console.error(`Failed to publish Pusher event "${eventName}":`, error);
    return false;
  }
}

module.exports = {
  publishEvent,
};