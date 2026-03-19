const http = require('http');
const app = require('./app');
const env = require('./config/env');
const connectDatabase = require('./config/db');
const { findAvailablePort } = require('./utils/port');

const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDatabase();

    const port =
      env.nodeEnv === 'development'
        ? await findAvailablePort(env.port)
        : env.port;

    if (port !== env.port) {
      console.warn(`Port ${env.port} is busy. Using port ${port} instead.`);
    }

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `Port ${port} is already in use. Stop the conflicting process or set PORT in .env.`
        );
      } else {
        console.error('Server failed:', error.message);
      }

      process.exit(1);
    });

    server.listen(port, () => {
      console.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = server;
