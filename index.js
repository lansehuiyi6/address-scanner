"use strict"

const loglevel = 'debug';
const Logger = require('./utils/logger.js');
global.syncLogger = new Logger("address-scanner", "log/address-scanner.log", "log/address-scanner_error.log", loglevel);

global.modelOps = require('./db');
let { syncChain } = require('./chain');

const SYNC_INTERVAL_TIME = 10 * 1000;

function sleep(time) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  })
}

async function syncMain(logger) {
  logger.info("********************************** syncMain start **********************************");

  let firstSyncDone = false;
  while (1) {
    try {
      let chainType = 'MOVR';
      let nodeUrl = 'https://rpc.moonriver.moonbeam.network'
      let sync_interval_block_num = 1000;
  
      logger.info("********************************** syncChain begin **********************************", "chainType is", chainType);
      await syncChain(chainType, global.syncLogger, nodeUrl, sync_interval_block_num);
      logger.info("********************************** syncChain done **********************************", "chainType is", chainType);

      if (!firstSyncDone) {
        firstSyncDone = true;
        logger.info("********************************** syncChain firstSyncDone **********************************", "chainType is", chainType);
      }
    } catch (err) {
      logger.error("syncMain failed:", err);
    }
    await sleep(SYNC_INTERVAL_TIME);
  }
}

async function main() {
  try {
    global.syncLogger.info("agent start!", global.argv);

    while (!global.modelOps || (global.modelOps.db && global.modelOps.db.readyState !== global.modelOps.db.states.connected)) {
      global.syncLogger.warn("wait for address-scanner db connected");
      await sleep(10 * 1000);
    }

    syncMain(global.syncLogger);

  } catch (err) {
    global.syncLogger.error("main start", err);
    process.exit(0);
  }
}

process.on('uncaughtException', error => {
  // Will print "uncaughtException err is not defined"
  global.syncLogger.error('uncaughtException', error.message || error);
  // console.log('uncaughtException', error.message, error);
});

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  global.syncLogger.error('unhandledRejection', error.message || error);
  // console.log('unhandledRejection', error.message, error);
});

main();
