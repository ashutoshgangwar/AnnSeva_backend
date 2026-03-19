const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AnnaSeva backend is running.',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
};

module.exports = {
  getHealth,
};
