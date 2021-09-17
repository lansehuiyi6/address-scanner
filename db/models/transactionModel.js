'use strict';

const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const transactionSchema = new Schema({
  chainType: {
    type: String,
    lowercase: true,
    required: true
  },
  txType: {
    type: String
  },
  blockHash: {
    type: String,
    lowercase: true
  },
  blockNumber: {
    type: Number,
    default: 0,
    index: true
  },
  transactionIndex: {
    type: Number,
    default: 0
  },
  txHash: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  input: {
    type: String
  },
  from: {
    type: String,
    lowercase: true,
  },
  to: {
    type: String,
    lowercase: true,
  },
  value: {
    type: String
  }
}, {
  collection: 'transaction',
  id: false
});

transactionSchema.index({chainType:1, txHash:1}, {unique: true});
module.exports = transactionSchema;