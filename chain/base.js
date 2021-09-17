'use strict';

const Web3 = require("web3");
const Web3_v2 = require('web3_1.2');

const TimeoutPromise = require('../utils/timeoutPromise.js')
const promiseTimeout = 30 * 1000;

class baseChain {
  constructor(log, nodeUrl, chainType = null) {
    this.log = log;
    this.nodeUrl = nodeUrl;

    this.chainType = chainType;
    this.sync_interval_block_num = 1000;

    this.client = this.getClient(nodeUrl);
  }

  getClient(nodeUrl) {
    if (nodeUrl.indexOf("http://") !== -1 || nodeUrl.indexOf("https://") !== -1) {
      return new Web3(new Web3.providers.HttpProvider(nodeUrl));
    } else {
      return new Web3(new Web3.providers.IpcProvider(nodeUrl, net));
    }
  }

  getClientV2(nodeUrl) {
    if (nodeUrl.indexOf("http://") !== -1 || nodeUrl.indexOf("https://") !== -1) {
      return new Web3_v2(new Web3_v2.providers.HttpProvider(nodeUrl));
    } else {
      return new Web3_v2(new Web3_v2.providers.IpcProvider(nodeUrl, net));
    }
  }

  getBlockNumberSync() {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getBlockNumber(function(err, blockNumber) {
          if (err) {
            reject(err);
          } else {
            // log.debug("ChainType:", chainType, 'getBlockNumberSync successfully with result: ', blockNumber);
            resolve(blockNumber);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, promiseTimeout, "ChainType: " + chainType + ' getBlockNumberSync timeout');
  }

  getBlockByNumberSync(blockNumber) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getBlock(blockNumber, true, function(err, result) {
          if (err) {
            reject(err);
          } else {
            // log.debug("ChainType:", chainType, 'getBlockByNumberSync successfully with result: ', result);
            resolve(result);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, promiseTimeout, "ChainType: " + chainType + ' getBlockByNumberSync timeout');
  }

  getBalanceSync(address) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getBalance(address, function(err, result) {
          if (err) {
            reject(err);
          } else {
            // log.debug("ChainType:", chainType, 'getBalanceSync successfully with result: ', result);
            resolve(result);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, promiseTimeout, "ChainType: " + chainType + ' getBalanceSync timeout');
  }

  getTransactionReceiptSync(txHash) {
    let client = this.client;
    let chainType = this.chainType;

    return new TimeoutPromise(function(resolve, reject) {
      client.eth.getTransactionReceipt(txHash, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    }, promiseTimeout, "ChainType: " + chainType + ' getTransactionReceiptSync timeout')
  }

  isContract(address) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getCode(address, function (err, result) {
          if (err) {
            reject(err);
          } else {
            if (result === '0x') {
              resolve(false);
            } else {
              // log.debug("ChainType:", chainType, 'isContract true with address: ', address);
              resolve(true);
            }
          }
        })
      } catch (err) {
        reject(err);
      }
    }, promiseTimeout, "ChainType: " + chainType + ' isContract timeout');
  }
}

module.exports = baseChain;