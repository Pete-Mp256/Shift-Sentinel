const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const shiftRoutes = require('./routes/shifts');
const taskRoutes = require('./routes/tasks');
const incidentRoutes = require('./routes/incidents');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const handoverRoutes = require('./routes/handovers');
const managerRoutes = require('./routes/managers');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/managers', managerRoutes);

// In production the built React app (client/build) is served from this same server,
// so the site and the API share one address and the client's relative /api calls just work.
const CLIENT_BUILD = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(path.join(CLIENT_BUILD, 'index.html'))) {
  app.use(express.static(CLIENT_BUILD));
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(CLIENT_BUILD, 'index.html')));
}

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Errors passed to next(err), including malformed JSON bodies
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
