'use strict';

const addressSchema = require('../db/models/addressModel.js');
const transactionSchema = require('../db/models/transactionModel.js');
const stateSchema = require('../db/models/stateModel.js');
const DbAccess = require('../db/dbAccess');

class ModelOps {
  constructor(logger, chainDb) {
    this.logger = logger;
    this.db = chainDb;

    this.dbAccess = new DbAccess(logger);

    this.addressModel = this.getModel('address', addressSchema);
    this.transactionModel = this.getModel('transaction', transactionSchema);
    this.stateModel = this.getModel('state', stateSchema);
  }

  getModel(name, schema) {
    let logger = this.logger;
    if (this.db) {
      return this.db.model(name, schema);
    } else {
      logger.error('Connecting to database failed!');
      logger.error('Aborting');
      process.exit();
    }
  }

  saveScannedBlockNumber(chainType, number) {
    this.dbAccess.updateDocument(this.stateModel, {
      chainType: chainType
    }, { chainType: chainType, scannedBlockNumber: number });
  }

  syncSaveScannedBlockNumber(chainType, number) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.dbAccess.syncUpdateDocument(this.stateModel, {
          chainType: chainType
        }, { chainType: chainType, scannedBlockNumber: number });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  getScannedBlockNumber(chainType, callback) {
    this.dbAccess.findDocumentOne(this.stateModel, {
      chainType: chainType
    }, function(err, result) {
      let number = 0;
      if (!err && result !== null) {
        number = result.scannedBlockNumber;
      }
      callback(err, number);
    });
  }

  async getScannedBlockNumberSync(chainType) {
    try {
      let result = await this.dbAccess.syncFindDocument(this.stateModel, {
        chainType: chainType
      });
      this.logger.debug("Synchronously getScannedBlockNumber (" + result + ")");
      let blockNumber;
      if (result.length !== 0) {
        blockNumber = result[0].scannedBlockNumber;
      } else {
        blockNumber = 0;
      }
      return blockNumber;
    } catch (err) {
      // this.logger.error(err);
      return await Promise.reject(err);
    }
  }

  saveScannedAddress(chainType, address, content) {
    this.dbAccess.updateDocument(this.addressModel, {
      chainType: chainType,
      address: address
    }, content);
  }

  syncSaveAddress(chainType, address, content) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.dbAccess.syncUpdateDocument(this.addressModel, {
          chainType: chainType,
          address: address
        }, content);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  syncSaveTx(chainType, txHash, content) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.dbAccess.syncUpdateDocument(this.transactionModel, {
          chainType: chainType,
          txHash: txHash
        }, content);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

}

module.exports = ModelOps;