const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://ayushpandey23_db_user:ayush123@cluster0.kanyaon.mongodb.net/atlasarrow?retryWrites=true&w=majority&appName=Cluster0';

// Map product names to local image files
const productImageMap = {
  'MANTRA MFS110 L1 Fingerprint Scanner': 'Biometric Fingerprint Scanner MANTRA MFS110 L1 Capture.png',
  'Morpho MSO1300 E2/E3 Fingerprint Scanner': 'Morpho L1 Idemia MSO1300 E3 RD Fingerprint Device.jpg',
  'Startek FM220U Fingerprint Scanner': 'Startek FM220U L1 Biometric Device.jpg',
  'Evolute Libra L1 GPS Device': 'Evolute Geosync-B1.webp',
  'Raivens Navic L1 GPS Device': 'Raivens USB GPS Receiver GPS 8.0 without Antenna.webp',
  'Raivens GNSS100 GPS Device': 'Raivens GPS 8.0 USB Receiver with antenna.jpeg',
  'TATVIK TMF20 GNSS100 GPS Device': 'TATVIK GNSS100 (2025) GPS Receiver.png',
  'Evolute Essybt Thermal Printer': 'Evolute thermal PrinterMobile Printer.jpeg',
  'HOP E58 Thermal Printer': 'HOP-58 Thermal Printer.png',
  'Oddy Thermal Paper Roll': 'Thermal POS.webp'
};

// Get mime type from extension
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const db = mongoose.connection.db;
  const productsCollection = db.collection('products');
  const imagesDir = path.join(__dirname, '..', 'product-images');
  
  for (const [productName, imageFile] of Object.entries(productImageMap)) {
    try {
      const imagePath = path.join(imagesDir, imageFile);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`❌ File not found: ${imageFile}`);
        continue;
      }
      
      console.log(`Processing: ${productName}`);
      
      // Read file and convert to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const mimeType = getMimeType(imageFile);
      const base64Data = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
      
      console.log(`  Size: ${Math.round(imageBuffer.length / 1024)} KB`);
      
      // Update product with base64 image
      const result = await productsCollection.updateOne(
        { name: productName },
        { $set: { images: [base64Data] } }
      );
      
      if (result.matchedCount > 0) {
        console.log('  ✅ Updated!');
      } else {
        console.log('  ⚠️ Product not found in database');
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }
  
  console.log('\n✅ Done! All images embedded in products.');
  await mongoose.disconnect();
}

main().catch(console.error);
