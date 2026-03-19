const net = require('net');

const isPortAvailable = (port) =>
  new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      reject(error);
    });

    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port);
  });

const findAvailablePort = async (preferredPort, maxAttempts = 10) => {
  for (
    let candidatePort = preferredPort;
    candidatePort < preferredPort + maxAttempts;
    candidatePort += 1
  ) {
    const available = await isPortAvailable(candidatePort);

    if (available) {
      return candidatePort;
    }
  }

  throw new Error(
    `No free port found between ${preferredPort} and ${preferredPort + maxAttempts - 1}.`
  );
};

module.exports = {
  findAvailablePort,
};