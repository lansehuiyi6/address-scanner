'use strict';

const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const addressSchema = new Schema({
  chainType: {
    type: String,
    lowercase: true,
    required: true
  },
  address: {
    index: true,
    type: String,
    lowercase: true
  },
  balance: {
    type: String
  },
  isContract: {
    type: Boolean,
    default: false
  },
  scannedBlockNumber: {
    type: Number,
    required: true,
    default: '0'
  }
}, {
  collection: 'address',
  id: false
});

addressSchema.index({chainType:1, address:1}, {unique: true});

module.exports = addressSchema;