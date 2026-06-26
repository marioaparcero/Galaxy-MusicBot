module.exports = {
  apps : [{
    name: "Lucio",
    script: 'index.js',
    watch: false,
    env: {
      TOKENLUCIO: "",
      TOKEN_DVA: "VALOR_OTRA_VARIABLE"
    },
    // watch: '.'
  }, //{
    // script: './service-worker/',
    // watch: ['./service-worker']
 // }
],

  // deploy : {
  //   production : {
  //     user : 'SSH_USERNAME',
  //     host : 'SSH_HOSTMACHINE',
  //     ref  : 'origin/master',
  //     repo : 'GIT_REPOSITORY',
  //     path : 'DESTINATION_PATH',
  //     'pre-deploy-local': '',
  //     'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
  //     'pre-setup': ''
  //   }
  // }
};
