require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to server/.env');
  process.exit(1);
}

const app = require('./app');
const jobs = require('./jobs/scheduler');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  jobs.start();
  keepMlAwake();
});

// Free hosting puts the ML service to sleep after ~15 minutes without requests, and waking it
// takes about a minute. While this API is awake, ping the ML service so predictions stay fast.
function keepMlAwake() {
  const url = process.env.ML_SERVICE_URL;
  if (!url || process.env.ML_KEEPALIVE !== 'true') return;
  const ping = () => fetch(`${url.replace(/\/$/, '')}/health`).catch(() => {});
  ping();
  setInterval(ping, 10 * 60 * 1000).unref();
}
