const https = require('https');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = 'mongodb+srv://ayushpandey23_db_user:ayush123@cluster0.kanyaon.mongodb.net/atlasarrow?retryWrites=true&w=majority&appName=Cluster0';

// Product images from atlasandarrow.in
const productImages = {
  'MANTRA MFS110 L1 Fingerprint Scanner': 'https://atlasandarrow.in/wp-content/uploads/2025/11/1-12.jpg',
  'Morpho MSO1300 E2/E3 Fingerprint Scanner': 'https://atlasandarrow.in/wp-content/uploads/2025/11/1-5.jpg',
  'Startek FM220U Fingerprint Scanner': 'https://atlasandarrow.in/wp-content/uploads/2025/11/1-6.jpg',
  'Evolute Libra L1 GPS Device': 'https://atlasandarrow.in/wp-content/uploads/2025/11/1-3.jpg',
  'Raivens Navic L1 GPS Device': 'https://atlasandarrow.in/wp-content/uploads/2025/11/2-4.jpg',
  'Raivens GNSS100 GPS Device': 'https://atlasandarrow.in/wp-content/uploads/2025/11/1-4.jpg',
  'TATVIK TMF20 GNSS100 GPS Device': 'https://atlasandarrow.in/wp-content/uploads/2025/11/TMF20-3.png',
  'Evolute Essybt Thermal Printer': 'https://atlasandarrow.in/wp-content/uploads/2025/11/1-1.jpg',
  'HOP E58 Thermal Printer': 'https://atlasandarrow.in/wp-content/uploads/2025/11/1.jpg',
  'Oddy Thermal Paper Roll': 'https://atlasandarrow.in/wp-content/uploads/2025/11/1-2.jpg'
};

// Download image and convert to base64
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = response.headers['content-type'] || 'image/jpeg';
        const base64 = 'data:' + contentType + ';base64,' + buffer.toString('base64');
        resolve(base64);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const db = mongoose.connection.db;
  const productsCollection = db.collection('products');
  
  for (const [productName, imageUrl] of Object.entries(productImages)) {
    try {
      console.log('Downloading:', productName);
      const base64Data = await downloadImage(imageUrl);
      
      // Update product with base64 image
      const result = await productsCollection.updateOne(
        { name: productName },
        { $set: { images: [base64Data] } }
      );
      
      if (result.matchedCount > 0) {
        console.log('  ✅ Updated!');
      } else {
        console.log('  ⚠️ Product not found');
      }
    } catch (err) {
      console.log('  ❌ Error:', err.message);
    }
  }
  
  console.log('\nDone! All images embedded in products.');
  await mongoose.disconnect();
}

main().catch(console.error);
