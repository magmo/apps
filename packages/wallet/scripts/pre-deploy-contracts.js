'use strict';

const {
  deployContracts,
} = require('magmo-devtools');
const fs = require('fs-extra');
const paths = require('../config/paths');

// Ensure environment variables are read.
// require('../config/env');

process.env.DEV_GANACHE_HOST = process.env.DEV_GANACHE_HOST || 'localhost';
process.env.DEV_GANACHE_PORT = process.env.DEV_GANACHE_PORT || 8545;
process.env.DEV_GANACHE_NETWORK_ID = process.env.DEV_GANACHE_NETWORK_ID || 5777;
process.env.DEFAULT_GAS = process.env.DEFAULT_GAS || 6721975;
process.env.DEFAULT_GAS_PRICE = process.env.DEFAULT_GAS_PRICE || 20000000000;

process.env.TARGET_NETWORK = 'ropsten';
  deployContracts().then(() => {
    process.env.TARGET_NETWORK = 'kovan';
    deployContracts().then(() => {
      process.env.TARGET_NETWORK = 'rinkeby';
      deployContracts().then(() => {

      fs.readdir(paths.buildContracts+ '/', function(err, items) {
        for (var i=0; i<items.length; i++) {
          fs.readJson(paths.buildContracts + '/' + items[i]).then((artifact) => {

          const strippedArtifact = {
            "contractName" : artifact.contractName,
            "abi": artifact.abi,
            "bytecode": artifact.bytecode,
            "networks": artifact.networks,
            };

          let data = JSON.stringify(strippedArtifact, null, 2);

          fs.writeFile(paths.appPreBuiltContractArtifacts + '/' + items[i], data, (err) => {  
            if (err) {throw err;}
            });
              
          console.log('Saved ' + artifact.contractName);
          })
          .catch(err => {
            console.error(err)
          })
        }})
    })
  })
})