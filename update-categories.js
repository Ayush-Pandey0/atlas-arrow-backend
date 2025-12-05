const mongoose = require('mongoose');
require('dotenv').config();

const categoryUpdates = [
  // Biometric Devices
  { name: 'Biometric Fingerprint Scanner MANTRA MFS110 L1 Capture', category: 'Biometric Devices' },
  { name: 'Morpho L1 Idemia MSO1300 E3 RD Fingerprint Device', category: 'Biometric Devices' },
  { name: 'Startek FM220U L1 Biometric Device', category: 'Biometric Devices' },
  
  // GPS Devices
  { name: 'Raivens Navic L1 GPS Device', category: 'GPS Devices' },
  { name: 'Evolute Geosync-B1 GNSS GPS Receiver L1 L5', category: 'GPS Devices' },
  { name: 'Raivens GPS 8.0 USB Receiver with Antenna', category: 'GPS Devices' },
  { name: 'Raivens USB GPS Receiver GPS 8.0 without Antenna', category: 'GPS Devices' },
  { name: 'TATVIK GNSS100 (2025) GPS Receiver', category: 'GPS Devices' },
  
  // Printers
  { name: 'Evolute Essybt Thermal Printer', category: 'Printers' },
  { name: 'Evolute Thermal Printer / Mobile Printer', category: 'Printers' },
  { name: 'HOP-58 Thermal Printer', category: 'Printers' },
  { name: 'Passbook Printer Epson PLQ 35', category: 'Printers' },
  
  // Smartwatches
  { name: 'boAt Storm Call 3 Smartwatch (Active Black)', category: 'Smartwatches' },
  { name: 'Fire-Boltt Talk 35.3mm Bluetooth Calling Smartwatch (Deep Blue)', category: 'Smartwatches' },
  
  // Cables & Accessories
  { name: 'boAt A325 USB A to Type C Cable (Black)', category: 'Cables & Accessories' },
  { name: 'Zebronics JUDWAA 750 Wired Keyboard And Mouse Combo', category: 'Cables & Accessories' },
  
  // Printer Supplies
  { name: 'Oddy Thermal Paper Roll', category: 'Printer Supplies' },
  { name: 'Thermal POS Roll 57mm X 25m FX5725 (Pack of 25)', category: 'Printer Supplies' },
  
  // Business Equipment
  { name: 'Pax D180C Mini ATM Machine', category: 'Business Equipment' }
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const col = mongoose.connection.db.collection('products');
  
  console.log('Updating categories...\n');
  
  for (const u of categoryUpdates) {
    const result = await col.updateOne({ name: u.name }, { $set: { category: u.category } });
    if (result.matchedCount > 0) {
      console.log(`✓ ${u.name.substring(0, 45).padEnd(45)} -> ${u.category}`);
    }
  }
  
  // Show updated categories summary
  const categories = await col.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, products: { $push: '$name' } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  
  console.log('\n\n=== PRODUCT CATEGORIES ===\n');
  categories.forEach(c => {
    console.log(`📦 ${c._id} (${c.count} products)`);
    c.products.forEach(p => console.log(`   - ${p.substring(0, 55)}`));
    console.log('');
  });
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
