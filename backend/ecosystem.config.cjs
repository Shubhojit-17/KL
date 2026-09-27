module.exports = {
  apps: [
    {
      name: 'kl-vase-backend',
      script: 'src/server.js',
      cwd: '/var/www/kl-vase/backend',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
