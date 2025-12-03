const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // 1. Get all users first
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\n=== Current Users ===');
    users.forEach(u => console.log(`- ${u.email} (${u.role || 'customer'})`));
    
    // 2. Delete all users except admin and vikash
    const deleteResult = await mongoose.connection.db.collection('users').deleteMany({
      $and: [
        { role: { $ne: 'admin' } },
        { email: { $not: /vikash/i } }
      ]
    });
    console.log(`\nDeleted ${deleteResult.deletedCount} users (keeping admin and vikash)`);
    
    // 3. Show remaining users
    const remainingUsers = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\n=== Remaining Users ===');
    remainingUsers.forEach(u => console.log(`- ${u.email} (${u.role || 'customer'})`));
    
    // 4. Delete all notifications (they are fake/demo)
    const notifResult = await mongoose.connection.db.collection('notifications').deleteMany({});
    console.log(`\nDeleted ${notifResult.deletedCount} fake notifications`);
    
    // 5. Check reviews in products
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    let totalReviews = 0;
    console.log('\n=== Products with Reviews ===');
    products.forEach(p => {
      if (p.reviews && p.reviews.length > 0) {
        console.log(`- ${p.name}: ${p.reviews.length} review(s)`);
        p.reviews.forEach(r => {
          console.log(`  * Rating: ${r.rating}, Comment: ${r.comment?.substring(0, 50)}...`);
        });
        totalReviews += p.reviews.length;
      }
    });
    console.log(`Total reviews in database: ${totalReviews}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Database cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
