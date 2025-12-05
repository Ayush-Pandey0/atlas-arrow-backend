const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  happyCustomers: { type: Number, default: 0 },
  productsSold: { type: Number, default: 0 },
  citiesServed: { type: Number, default: 0 },
  customerRating: { type: Number, default: 4.8 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stats', statsSchema);
