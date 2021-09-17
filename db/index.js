"use strict"

const mongoose = require('mongoose');
const ModelOps = require('../db/modelOps');

let dbOption = {
  // autoReconnect: true,
  useNewUrlParser: true,
  // reconnectTries: Number.MAX_VALUE,
  // reconnectInterval: 100,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 360000
}
let dbUrl = `mongodb://localhost:27017`;
dbUrl = `mongodb://127.0.0.1:27017`;
dbUrl = `mongodb://192.168.88.129:27017`;

dbUrl = dbUrl + "/address_scanner";
// dbUrl = dbUrl + "?authSource=admin";

let db = mongoose.createConnection(dbUrl, dbOption);

db.on('connected', function(err) {
  if (err) {
    global.syncLogger.error('Unable to connect to database(' + dbUrl.split('/')[3] + ')：' + err);
    global.syncLogger.error('Aborting');
    process.exit();
  } else {
    global.syncLogger.info('Connecting to database ' + dbUrl.split('/')[3] + ' is successful!');
  }
});

db.on("reconnected", () => {
  global.syncLogger.warn('Reconnecting to database ' + dbUrl.split('/')[3]);
});

db.on("error", (err) => {
  global.syncLogger.error('Connecting to database ' + dbUrl.split('/')[3] + ' failed!');
  global.syncLogger.error(err);
  if (err.message && err.message.match(/failed to connect to server .* on first connect/)) {
    setTimeout(function () {
      global.syncLogger.debug("Retrying first connect...");
      db.openUri(dbUrl, dbOption);
    }, 5 * 1000)
  } else {
    global.syncLogger.error('Connecting to database ' + dbUrl.split('/')[3] + 'Aborting!');
    process.exit(1);
  }
});
db.on("parseError", (err) => {
  global.syncLogger.error('Connected database ' + dbUrl.split('/')[3] + ' :ParseError happened');
  global.syncLogger.error(err);
  global.syncLogger.error("Aborting!");
  // process.exit(1);
});
db.on("disconnected", () => {
  global.syncLogger.warn('Connected database ' + dbUrl.split('/')[3] + ' :disconnected happened');
});
db.on("reconnectFailed", (err) => {
  global.syncLogger.error('Connected database ' + dbUrl.split('/')[3] + ' :reconnectFailed happened', err);
});
db.on("reconnectTries", () => {
  global.syncLogger.error('Connected database ' + dbUrl.split('/')[3] + ' :reconnectFailed happened, and no longer attempt to reconnect');
});
db.on("close", () => {
  global.syncLogger.info('Connected database ' + dbUrl.split('/')[3] + '::connect:Close happened');
  process.exit(1);
});

let modelOps = new ModelOps(global.syncLogger, db);

module.exports = modelOps;