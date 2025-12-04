const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({}, {strict: false}));
  const Cart = mongoose.model('Cart', new mongoose.Schema({}, {strict: false}));
  const Order = mongoose.model('Order', new mongoose.Schema({}, {strict: false}));
  
  // Delete all non-admin users
  const result = await User.deleteMany({ role: { $ne: 'admin' } });
  console.log('Deleted', result.deletedCount, 'users');
  
  // Delete all carts
  const cartResult = await Cart.deleteMany({});
  console.log('Deleted', cartResult.deletedCount, 'carts');
  
  // Delete all orders
  const orderResult = await Order.deleteMany({});
  console.log('Deleted', orderResult.deletedCount, 'orders');
  
  mongoose.disconnect();
});
