const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Delete all users except admin
    const userResult = await mongoose.connection.db.collection('users').deleteMany({ 
      email: { $ne: 'admin@atlasarrow.com' } 
    });
    console.log(`🗑️  Deleted ${userResult.deletedCount} users (kept admin)`);
    
    // Clear all reviews from products
    const productResult = await mongoose.connection.db.collection('products').updateMany(
      {},
      { $set: { reviews: [] } }
    );
    console.log(`🗑️  Cleared reviews from ${productResult.modifiedCount} products`);
    
    // Delete all orders
    const orderResult = await mongoose.connection.db.collection('orders').deleteMany({});
    console.log(`🗑️  Deleted ${orderResult.deletedCount} orders`);
    
    // Delete all carts
    const cartResult = await mongoose.connection.db.collection('carts').deleteMany({});
    console.log(`🗑️  Deleted ${cartResult.deletedCount} carts`);
    
    // Clear wishlists from remaining admin user
    await mongoose.connection.db.collection('users').updateMany(
      {},
      { $set: { wishlist: [] } }
    );
    console.log(`🗑️  Cleared all wishlists`);
    
    console.log('\n✅ Database cleaned successfully! Only admin account remains.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
