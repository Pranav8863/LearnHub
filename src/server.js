const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 LearnHub Server is running on port ${env.PORT}`);
      console.log(`🌐 Environment: ${env.NODE_ENV}`);
      console.log(`📡 Health Check: http://localhost:${env.PORT}/api/health`);
      console.log(`===============================================`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
