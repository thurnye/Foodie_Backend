module.exports = {
    apps: [
      {
        name: 'foodie',
        script: 'server.js', // Your entry file
        watch: true, // Enable watching file changes
        exec_mode: 'cluster',
        instances: 'max', // Or a specific number of instances
        interpreter: 'nodemon', // Use nodemon to run your app
        env: {
          NODE_ENV: 'development',
          // Add other environment variables here
        },
        watch: ['.'], // Watch all files in the current directory
        ignore_watch: ['node_modules', 'logs'], // Ignore changes in node_modules and logs
        max_memory_restart: '500M', // Restart if memory usage exceeds 500MB
        error_file: './logs/err.log', // Specify error log file
        out_file: './logs/out.log', // Specify output log file
        log_date_format: 'YYYY-MM-DD HH:mm Z', // Log date format
      },
    ],
  };
  
  