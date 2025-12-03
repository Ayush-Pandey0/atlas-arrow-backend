const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect('mongodb+srv://ayushpandey23_db_user:ayush123@cluster0.kanyaon.mongodb.net/atlas_arrow?retryWrites=true&w=majority');

// Product Schema (matching server)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Biometric Devices', 'GPS Trackers', 'Printers', 'Aadhaar Kits', 'Business Equipment', 'Accessories']
  },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discount: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  images: [{ type: String }],
  image: { type: String },
  specifications: [{
    key: String,
    value: String
  }],
  features: [{ type: String }],
  brand: { type: String },
  warranty: { type: String },
  rating: { type: Number, default: 0 },
  reviews: { type: Array, default: [] },
  featured: { type: Boolean, default: false },
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// New products from atlasandarrow.in
const newProducts = [
  // Fingerprint Scanners
  {
    name: 'Biometric Fingerprint Scanner MANTRA MFS110 L1 Capture',
    description: 'MANTRA MFS110 L1 Capture is a high-quality biometric fingerprint scanner with L1 certification. Perfect for Aadhaar enrollment and authentication. USB interface with optical sensor technology for accurate and fast fingerprint capture.',
    category: 'Biometric Devices',
    price: 2799,
    originalPrice: 2799,
    discount: 0,
    stock: 50,
    image: 'Biometric Fingerprint Scanner MANTRA MFS110 L1 Capture.png',
    specifications: [
      { key: 'Certification', value: 'L1 Certified' },
      { key: 'Sensor', value: 'Optical' },
      { key: 'Interface', value: 'USB 2.0' },
      { key: 'Resolution', value: '500 DPI' }
    ],
    features: ['L1 Certified', 'Aadhaar Compatible', 'Fast Capture', 'USB Powered'],
    brand: 'Mantra',
    warranty: '1 Year',
    featured: true,
    inStock: true
  },
  {
    name: 'Morpho L1 Idemia MSO1300 E3 RD Fingerprint Device',
    description: 'Morpho L1 Idemia MSO1300 E3 RD is an advanced biometric fingerprint device with STQC and UIDAI certification. Features optical sensor with excellent image quality for reliable Aadhaar-based authentication and enrollment.',
    category: 'Biometric Devices',
    price: 3599,
    originalPrice: 3599,
    discount: 0,
    stock: 40,
    image: 'Morpho L1 Idemia MSO1300 E3 RD Fingerprint Device.jpg',
    specifications: [
      { key: 'Certification', value: 'L1 STQC & UIDAI' },
      { key: 'Sensor', value: 'Optical' },
      { key: 'Interface', value: 'USB 2.0' },
      { key: 'Resolution', value: '500 DPI' }
    ],
    features: ['STQC Certified', 'UIDAI Approved', 'RD Service', 'High Quality Sensor'],
    brand: 'Morpho Idemia',
    warranty: '1 Year',
    featured: true,
    inStock: true
  },
  {
    name: 'Startek FM220U L1 Biometric Device',
    description: 'Startek FM220U L1 is a compact and reliable biometric fingerprint scanner. UIDAI approved with L1 certification for Aadhaar authentication. Features PIV compliant sensor with excellent fingerprint capture quality.',
    category: 'Biometric Devices',
    price: 3150,
    originalPrice: 3150,
    discount: 0,
    stock: 35,
    image: 'Startek FM220U L1 Biometric Device.jpg',
    specifications: [
      { key: 'Certification', value: 'L1 UIDAI Approved' },
      { key: 'Sensor', value: 'Optical PIV' },
      { key: 'Interface', value: 'USB 2.0' },
      { key: 'Resolution', value: '500 DPI' }
    ],
    features: ['L1 Certified', 'PIV Compliant', 'Compact Design', 'UIDAI Approved'],
    brand: 'Startek',
    warranty: '1 Year',
    featured: true,
    inStock: true
  },

  // GPS Devices
  {
    name: 'Evolute Geosync-B1 GNSS GPS Receiver L1 L5',
    description: 'Evolute Geosync-B1 is a high-precision GNSS GPS receiver supporting L1 and L5 bands. Ideal for Aadhaar enrollment centers and location-based applications. Features fast satellite acquisition and accurate positioning.',
    category: 'GPS Trackers',
    price: 3399,
    originalPrice: 3599,
    discount: 6,
    stock: 25,
    image: 'Evolute Geosync-B1 GNSS GPS Receiver L1 L5.png',
    specifications: [
      { key: 'Bands', value: 'L1, L5' },
      { key: 'Type', value: 'GNSS Receiver' },
      { key: 'Interface', value: 'USB' },
      { key: 'Accuracy', value: '2.5m CEP' }
    ],
    features: ['L1 L5 Support', 'Fast Acquisition', 'High Accuracy', 'Aadhaar Compatible'],
    brand: 'Evolute',
    warranty: '1 Year',
    featured: true,
    inStock: true
  },
  {
    name: 'Raivens GPS 8.0 USB Receiver with Antenna',
    description: 'Raivens GPS 8.0 is a professional USB GPS receiver with external antenna for enhanced signal reception. Perfect for Aadhaar enrollment and applications requiring accurate location data. Features high sensitivity and fast TTFF.',
    category: 'GPS Trackers',
    price: 4425,
    originalPrice: 8999,
    discount: 51,
    stock: 20,
    image: 'Raivens GPS 8.0 USB Receiver with antenna.jpeg',
    specifications: [
      { key: 'Type', value: 'USB GPS Receiver' },
      { key: 'Antenna', value: 'External Included' },
      { key: 'Interface', value: 'USB 2.0' },
      { key: 'Channels', value: '66 Channels' }
    ],
    features: ['External Antenna', 'High Sensitivity', 'Fast TTFF', 'Wide Compatibility'],
    brand: 'Raivens',
    warranty: '1 Year',
    featured: true,
    inStock: true
  },
  {
    name: 'Raivens USB GPS Receiver GPS 8.0 without Antenna',
    description: 'Raivens GPS 8.0 compact USB GPS receiver without external antenna. Built-in high-sensitivity antenna for reliable GPS reception. Ideal for laptop and desktop applications requiring location services.',
    category: 'GPS Trackers',
    price: 3225,
    originalPrice: 3800,
    discount: 15,
    stock: 30,
    image: 'Raivens USB GPS Receiver GPS 8.0 without Antenna.webp',
    specifications: [
      { key: 'Type', value: 'USB GPS Receiver' },
      { key: 'Antenna', value: 'Built-in' },
      { key: 'Interface', value: 'USB 2.0' },
      { key: 'Channels', value: '66 Channels' }
    ],
    features: ['Compact Design', 'Built-in Antenna', 'Plug & Play', 'Low Power'],
    brand: 'Raivens',
    warranty: '1 Year',
    featured: false,
    inStock: true
  },
  {
    name: 'TATVIK GNSS100 (2025) GPS Receiver',
    description: 'TATVIK GNSS100 is a latest 2025 model GPS receiver with advanced GNSS technology. Supports multiple satellite constellations for accurate positioning. UIDAI approved for Aadhaar enrollment applications.',
    category: 'GPS Trackers',
    price: 2599,
    originalPrice: 3250,
    discount: 20,
    stock: 40,
    image: 'TATVIK GNSS100 (2025) GPS Receiver.png',
    specifications: [
      { key: 'Model', value: '2025 Edition' },
      { key: 'Type', value: 'GNSS Receiver' },
      { key: 'Interface', value: 'USB' },
      { key: 'Certification', value: 'UIDAI Approved' }
    ],
    features: ['2025 Model', 'Multi-Constellation', 'UIDAI Approved', 'High Accuracy'],
    brand: 'TATVIK',
    warranty: '1 Year',
    featured: true,
    inStock: true
  },

  // Thermal Printers
  {
    name: 'Evolute Thermal Printer / Mobile Printer',
    description: 'Evolute portable thermal printer perfect for mobile printing applications. Bluetooth connectivity with Android and iOS support. Compact design ideal for field work, delivery, and on-the-go receipt printing.',
    category: 'Printers',
    price: 2450,
    originalPrice: 2800,
    discount: 13,
    stock: 25,
    image: 'Evolute thermal PrinterMobile Printer.jpeg',
    specifications: [
      { key: 'Type', value: 'Thermal Mobile Printer' },
      { key: 'Connectivity', value: 'Bluetooth, USB' },
      { key: 'Paper Width', value: '58mm' },
      { key: 'Battery', value: 'Rechargeable' }
    ],
    features: ['Portable', 'Bluetooth', 'Rechargeable Battery', 'Mobile App Support'],
    brand: 'Evolute',
    warranty: '6 Months',
    featured: true,
    inStock: true
  },
  {
    name: 'HOP-58 Thermal Printer',
    description: 'HOP-58 is a reliable desktop thermal printer for POS applications. 58mm paper width with high-speed printing. USB connectivity with Windows and Linux support. Perfect for retail, restaurants, and billing counters.',
    category: 'Printers',
    price: 2499,
    originalPrice: 2499,
    discount: 0,
    stock: 30,
    image: 'HOP-58 Thermal Printer.png',
    specifications: [
      { key: 'Type', value: 'Desktop Thermal Printer' },
      { key: 'Paper Width', value: '58mm' },
      { key: 'Interface', value: 'USB' },
      { key: 'Speed', value: '90mm/s' }
    ],
    features: ['High Speed', 'Easy Paper Loading', 'Compact Design', 'Low Noise'],
    brand: 'HOP',
    warranty: '6 Months',
    featured: false,
    inStock: true
  },

  // Accessories
  {
    name: 'Oddy Thermal POS Roll 57 mm X 25 m, FX5725',
    description: 'The Oddy Thermal POS Roll 57 mm × 25 m, FX5725 is a compact and reliable thermal paper roll tailored for point-of-sale (POS) applications. Delivers crisp, clear, and smudge-resistant printouts—perfect for receipts, tickets, or invoices in retail, hospitality, or transportation environments. Pack of 25 rolls.',
    category: 'Accessories',
    price: 599,
    originalPrice: 699,
    discount: 14,
    stock: 100,
    image: 'Thermal POS.webp',
    specifications: [
      { key: 'Paper Width', value: '57 mm' },
      { key: 'Length', value: '25 m' },
      { key: 'Model No', value: 'FX5725' },
      { key: 'Pack', value: '25 Rolls' },
      { key: 'Color', value: 'White' },
      { key: 'Finish', value: 'Coated' }
    ],
    features: ['Smudge Resistant', 'High Quality', 'Compatible with 57mm printers', 'Pack of 25'],
    brand: 'Oddy',
    warranty: 'N/A',
    featured: false,
    inStock: true
  }
];

async function updateProducts() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connection.asPromise();
    console.log('✅ Connected to MongoDB');

    // Delete all existing products
    console.log('🗑️ Removing old products...');
    const deleteResult = await Product.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} old products`);

    // Add new products with placeholder images (will use uploaded images from server)
    console.log('📦 Adding new products...');
    
    for (const product of newProducts) {
      // Use placeholder image URLs - these will be replaced when images are uploaded
      const imageUrl = `https://atlasandarrow.in/wp-content/uploads/2025/11/${encodeURIComponent(product.image)}`;
      
      const newProduct = new Product({
        ...product,
        image: imageUrl,
        images: [imageUrl],
        rating: Math.floor(Math.random() * 10 + 40) / 10 // Random rating 4.0-5.0
      });
      
      await newProduct.save();
      console.log(`  ✅ Added: ${product.name}`);
    }

    console.log(`\n🎉 Successfully added ${newProducts.length} products!`);
    
    // List all products
    const allProducts = await Product.find({}).select('name category price');
    console.log('\n📋 Current products in database:');
    allProducts.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.name} - ₹${p.price} (${p.category})`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

updateProducts();
