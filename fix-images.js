const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}));
  
  // Products with base64 or broken paths need real URLs
  const updates = [
    { match: 'MANTRA MFS110 L1 Fingerprint Scanner', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
    { match: 'Morpho MSO1300 E2/E3', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
    { match: 'Startek FM220U Fingerprint Scanner', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
    { match: 'Evolute Libra L1 GPS', image: 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop' },
    { match: 'Raivens Navic L1 GPS', image: 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop' },
    { match: 'Raivens GNSS100 GPS', image: 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop' },
    { match: 'TATVIK TMF20 GNSS100', image: 'https://images.unsplash.com/photo-1551817958-c5b51e7b4a33?w=400&h=400&fit=crop' },
    { match: 'Evolute Essybt Thermal', image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop' },
    { match: 'HOP E58 Thermal', image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop' },
    { match: 'Oddy Thermal Paper', image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=400&fit=crop' },
    { match: 'boAt A325 USB', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
    { match: 'Passbook Printer Epson', image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop' },
    { match: 'Pax D180C Mini ATM', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop' }
  ];
  
  for (const u of updates) {
    const result = await Product.updateOne(
      { name: { $regex: u.match, $options: 'i' } },
      { $set: { images: [u.image] } }
    );
    console.log(u.match.substring(0, 35).padEnd(35), result.modifiedCount > 0 ? '✓ Updated' : '- Not found');
  }
  
  console.log('\nDone!');
  mongoose.disconnect();
});
