// Script to fix MANTRA MFS110 product image
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const productSchema = new mongoose.Schema({
  name: String,
  images: [String],
}, { strict: false });

const Product = mongoose.model('Product', productSchema);

async function fixMFS110Image() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the MFS110 product
    const product = await Product.findOne({ 
      name: { $regex: /MFS110/i } 
    });

    if (!product) {
      console.log('Product not found!');
      return;
    }

    console.log('Found product:', product.name);
    console.log('Current images:', product.images);

    // Update with correct image URL
    // Using the correct MANTRA MFS110 image from reliable source
    const correctImage = 'https://m.media-amazon.com/images/I/51Qv5QO2qML._SX679_.jpg';
    
    const result = await Product.updateOne(
      { name: { $regex: /MFS110/i } },
      { $set: { images: [correctImage] } }
    );

    console.log('Update result:', result);
    console.log('✅ Image updated successfully!');

    // Verify the update
    const updated = await Product.findOne({ name: { $regex: /MFS110/i } });
    console.log('New images:', updated.images);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixMFS110Image();
