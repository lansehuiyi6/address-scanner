"use strict"

const BaseChain = require('../chain/base');

let logger = global.syncLogger;

function getChain(chainType, logger, nodeUrl) {
  return new BaseChain(logger, nodeUrl, chainType);
}

async function syncChain(chainType, logger, nodeUrl, sync_interval_block_num) {
  logger.info("********************************** syncChain **********************************", chainType);

  let blockNumber = 0;
  let curBlock = 0;
  let chain = getChain(chainType, logger, nodeUrl);

  try {
    curBlock = await chain.getBlockNumberSync();
    logger.info("Current block is:", curBlock, chainType);
  } catch (err) {
    logger.error("getBlockNumberSync from :", chainType, err);
    return;
  }

  try {
    blockNumber = await global.modelOps.getScannedBlockNumberSync(chainType);
    logger.info("Current sync will start from block:", blockNumber, chainType);
  } catch (err) {
    logger.error("getScannedBlockNumberSync from :", chainType, err);
    return;
  }

  let from = blockNumber;

  if (curBlock) {
    let to = curBlock;

    try {
      if (from <= to) {
        let blkIndex = from;
        let blkEnd;
        let range = to - from;
        let cntPerTime = sync_interval_block_num;

        while (blkIndex < to) {
          if ((blkIndex + cntPerTime) > to) {
            blkEnd = to;
          } else {
            blkEnd = blkIndex + cntPerTime;
          }

          logger.info("blockSync range: From ", from, " to ", to, " remain ", range, ", FromBlk:", blkIndex, ", ToBlk:", blkEnd, chainType);

          await syncBlocks(chain, blkIndex, blkEnd)

          await global.modelOps.syncSaveScannedBlockNumber(chainType, blkEnd);
          logger.info("********************************** saveState **********************************", chainType, blkEnd);

          blkIndex += cntPerTime;
          range -= cntPerTime;
        }
      }
    } catch (err) {
      logger.error("syncChain from :", chainType, err);
      return;
    }
  }
}

async function syncBlocks(chain, fromBlk, toBlk) {
  let chainType = chain.chainType;
  try {
    let blocks = [];
    for (let blockNumber = fromBlk; blockNumber < toBlk; blockNumber++) {
      blocks.push(blockNumber);
    }
    let multiBlocks = [...blocks].map((blockNumber) => {
      return new Promise(async (resolve, reject) => {
        try {
          logger.info("syncBlocks blockNumber begin :", chainType, blockNumber);
          await syncOneBlock(chain, blockNumber);
          logger.info("syncBlocks blockNumber done :", chainType, blockNumber);
          resolve();
        } catch (err) {
          logger.error("syncBlocks blockNumber failed :", chainType, blockNumber, err);
          reject('syncBlocks failed');
        }
      })
    })
    try {
      await Promise.all(multiBlocks);
      logger.debug("syncOneBlock multiBlocks done", chainType, fromBlk, toBlk);
    } catch (err) {
      logger.error("syncBlocks multiBlocks failed", err);
      return await Promise.reject(err);
    }
  } catch (err) {
    logger.error("syncBlocks failed :", chainType, fromBlk, toBlk, err);
    throw new Error('syncBlocks failed');
  }
}

async function syncOneBlock(chain, blockNumber) {
  let chainType = chain.chainType;
  try {
    let block = await chain.getBlockByNumberSync(blockNumber);
    let transactions = await block.transactions;

    let multiTrans = [...transactions].map((transaction) => {
      return new Promise(async (resolve, reject) => {
        try {
          logger.debug("syncOneBlock transaction begin :", chainType, blockNumber, transaction.hash);
          let from = transaction.from;
          let fromIsContract = false;
          if (from) {
            fromIsContract = await chain.isContract(from);
            let fromBalance = await chain.getBalanceSync(from);

            let fromContent = {
              balance: fromBalance.toString(10),
              isContract: fromIsContract,
              scannedBlockNumber: blockNumber
            }
            // logger.debug("syncOneBlock transaction from done:", chainType, blockNumber, transaction.hash, from);
            await global.modelOps.syncSaveAddress(chainType, from, fromContent);
          }

          let to = transaction.to;
          let toIsContract = false;
          if (to) {
            toIsContract = await chain.isContract(to);
            let toBalance = await chain.getBalanceSync(to);

            let toContent = {
              balance: toBalance.toString(10),
              isContract: toIsContract,
              scannedBlockNumber: blockNumber
            }
            // logger.debug("syncOneBlock transaction to done:", chainType, blockNumber, transaction.hash, to);
            await global.modelOps.syncSaveAddress(chainType, to, toContent);
          }

          let txContent = {
            blockHash: transaction.blockHash,
            blockNumber: transaction.blockNumber,
            transactionIndex: transaction.transactionIndex,
            input: transaction.input,
            from: transaction.from,
            to: transaction.to,
            value: transaction.value.toString(10)
          }
          if (fromIsContract || toIsContract) {
            txContent.txType = 'contract';
          } else {
            txContent.txType = 'normal';
          }
          await global.modelOps.syncSaveTx(chainType, transaction.hash, txContent);

          logger.debug("syncOneBlock transaction done :", chainType, blockNumber, transaction.hash);
          resolve();
        } catch (err) {
          logger.error("syncOneBlock transaction failed :", chainType, blockNumber, transaction, err);
          reject('syncOneBlock failed');
        }
      })
    })
    try {
      await Promise.all(multiTrans);
      logger.debug("syncOneBlock multiTrans done", chainType, blockNumber);
    } catch (err) {
      logger.error("syncOneBlock multiTrans failed", err);
      return await Promise.reject(err);
    }
  } catch (err) {
    logger.error("syncOneBlock failed :", chainType, blockNumber, err);
    throw new Error('syncOneBlock failed');
  }
}

exports.getChain = getChain;
exports.syncChain = syncChain;