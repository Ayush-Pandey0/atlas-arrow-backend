const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'https://atlasarrow.me/products/';

// Map product names to actual image files
const productImages = {
  // Products with actual images
  'MANTRA MFS110 L1 Fingerprint Scanner': 'mantra-mfs110-l1.png',
  'Biometric Fingerprint Scanner MANTRA MFS110 L1 Capture': 'mantra-mfs110-l1.png',
  
  'Morpho MSO1300 E2/E3 Fingerprint Scanner': 'morpho-mso1300-e3.jpg',
  'Morpho L1 Idemia MSO1300 E3 RD Fingerprint Device': 'morpho-mso1300-e3.jpg',
  
  'Startek FM220U Fingerprint Scanner': 'startek-fm220u.jpg',
  'Startek FM220U L1 Biometric Device': 'startek-fm220u.jpg',
  
  'Evolute Libra L1 GPS Device': 'evolute-geosync-b1.webp',
  'Evolute Geosync-B1 GNSS GPS Receiver L1 L5': 'evolute-geosync-b1.webp',
  
  'Raivens Navic L1 GPS Device': 'raivens-gps-with-antenna.jpeg',
  'Raivens GNSS100 GPS Device': 'raivens-gps-with-antenna.jpeg',
  'Raivens GPS 8.0 USB Receiver with Antenna': 'raivens-gps-with-antenna.jpeg',
  'Raivens USB GPS Receiver GPS 8.0 without Antenna': 'raivens-gps-without-antenna.webp',
  
  'TATVIK TMF20 GNSS100 GPS Device': 'tatvik-gnss100.png',
  'TATVIK GNSS100 (2025) GPS Receiver': 'tatvik-gnss100.png',
  
  'Evolute Essybt Thermal Printer': 'evolute-thermal-printer.jpeg',
  'Evolute Thermal Printer / Mobile Printer': 'evolute-thermal-printer.jpeg',
  
  'HOP E58 Thermal Printer': 'hop-58-thermal-printer.png',
  'HOP-58 Thermal Printer': 'hop-58-thermal-printer.png',
  
  'Oddy Thermal Paper Roll': 'thermal-pos-roll.webp',
  'Thermal POS Roll 57mm X 25m FX5725 (Pack of 25)': 'thermal-pos-roll.webp',
  
  'boAt A325 USB A to Type C Cable (Black)': 'boat-storm-call-3.webp',
  'boAt Storm Call 3 Smartwatch (Active Black)': 'boat-storm-call-3.webp',
  
  'Fire-Boltt Talk 35.3mm Bluetooth Calling Smartwatch (Deep Blue)': 'fire-boltt-talk.png',
  
  'Zebronics JUDWAA 750 Wired Keyboard And Mouse Combo': 'zebronics-judwaa-750.webp',
  
  'Passbook Printer Epson PLQ 35': 'evolute-thermal-printer.jpeg',
  
  'Pax D180C Mini ATM Machine': 'startek-fm220u.jpg',
};

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const products = await Product.find({});
  console.log(`Found ${products.length} products\n`);

  let updated = 0;
  for (const product of products) {
    const imageName = productImages[product.name];
    
    if (imageName) {
      const imageUrl = BASE_URL + imageName;
      await Product.updateOne(
        { _id: product._id },
        { $set: { image: imageUrl, images: [imageUrl] } }
      );
      console.log(`✓ ${product.name.substring(0, 50).padEnd(50)} -> ${imageName}`);
      updated++;
    } else {
      console.log(`✗ ${product.name.substring(0, 50).padEnd(50)} -> NO MATCH`);
    }
  }

  console.log(`\nDone! Updated ${updated} products`);
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
