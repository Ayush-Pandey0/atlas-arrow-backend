const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://ayushpandey23_db_user:ayush123@cluster0.kanyaon.mongodb.net/atlasarrow?retryWrites=true&w=majority';

async function fixProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Reset rating and reviews to 0 for all products
    const result = await db.collection('products').updateMany(
      {},
      { $set: { rating: 0, reviews: [], numReviews: 0 } }
    );
    
    console.log('Updated products:', result.modifiedCount);
    
    // Verify
    const products = await db.collection('products').find({}).toArray();
    products.forEach(p => {
      console.log(p.name + ' - Rating:', p.rating, 'Reviews:', p.reviews?.length || 0);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
fixProducts();
