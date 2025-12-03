const mongoose = require('mongoose');
require('dotenv').config();

async function checkReviews() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check all products for reviews
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    
    console.log('Total products:', products.length);
    
    let totalReviews = 0;
    products.forEach(p => {
      if (p.reviews && p.reviews.length > 0) {
        console.log('\nProduct:', p.name);
        console.log('Reviews:', p.reviews.length);
        console.log(JSON.stringify(p.reviews, null, 2));
        totalReviews += p.reviews.length;
      }
    });
    
    console.log('\n===================');
    console.log('Total reviews found:', totalReviews);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkReviews();
