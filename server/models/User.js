// server/models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  walletAddress: { type: String, unique: true },
  nonce: { type: String },
  role: { type: String, enum: ['buyer', 'seller'], default: 'buyer' },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
