const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}));
  
  // Update ALL products with proper images based on their names
  const imageMap = {
    // Fingerprint Scanners
    'mantra': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    'morpho': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    'startek': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    'biometric': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    'fingerprint': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    
    // GPS devices
    'gps': 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop',
    'gnss': 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop',
    'geosync': 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop',
    'navic': 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop',
    'raivens': 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop',
    'evolute libra': 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop',
    'tatvik': 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop',
    
    // Thermal Printers
    'thermal': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop',
    'printer': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop',
    'hop': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop',
    'pos': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop',
    'epson': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop',
    'passbook': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop',
    
    // Paper
    'paper': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=400&fit=crop',
    'oddy': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=400&fit=crop',
    
    // ATM/Payment
    'pax': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop',
    'atm': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop',
    
    // Smartwatch
    'smartwatch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    'fire-boltt': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    'boat storm': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    'watch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    
    // Keyboard/Mouse
    'keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
    'zebronics': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
    'mouse': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
    
    // USB/Cable
    'usb': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    'boat a325': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
  };

  // Default image for any product not matching above
  const defaultImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';

  const products = await Product.find({});
  console.log(`Found ${products.length} products\n`);

  let updated = 0;
  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    
    // Find matching image
    let newImage = defaultImage;
    for (const [keyword, image] of Object.entries(imageMap)) {
      if (nameLower.includes(keyword)) {
        newImage = image;
        break;
      }
    }
    
    // Update the product
    await Product.updateOne(
      { _id: product._id },
      { $set: { image: newImage, images: [newImage] } }
    );
    console.log(`✓ ${product.name.substring(0, 50).padEnd(50)} -> Updated`);
    updated++;
  }

  console.log(`\nDone! Updated ${updated} products`);
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
