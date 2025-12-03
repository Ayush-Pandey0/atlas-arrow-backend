const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://ayushpandey23_db_user:ayush123@cluster0.kanyaon.mongodb.net/atlasarrow?appName=Cluster0';

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  originalPrice: Number,
  category: String,
  image: String,
  images: [String],
  stock: Number,
  rating: Number,
  reviews: Array,
  featured: Boolean,
  specifications: Object,
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

const demoProducts = [
  {
    name: "Mantra MFS100 V54 Fingerprint Scanner",
    description: "STQC certified fingerprint scanner for Aadhaar authentication. USB 2.0 interface with optical sensor. Works with all Aadhaar enabled applications. 500 DPI resolution with fake finger detection.",
    price: 2499,
    originalPrice: 2999,
    category: "Biometric Devices",
    image: "https://m.media-amazon.com/images/I/51Ky2D+mNJL._SL1100_.jpg",
    images: ["https://m.media-amazon.com/images/I/51Ky2D+mNJL._SL1100_.jpg"],
    stock: 50,
    rating: 4.5,
    featured: true,
    specifications: { "Sensor": "Optical", "Resolution": "500 DPI", "Interface": "USB 2.0", "Certification": "STQC" }
  },
  {
    name: "Startek FM220U Fingerprint Scanner",
    description: "UIDAI approved fingerprint scanner with PIV compliant sensor. Compact design with high-quality optical sensor. Ideal for Aadhaar enrollment and authentication.",
    price: 2299,
    originalPrice: 2799,
    category: "Biometric Devices",
    image: "https://m.media-amazon.com/images/I/41ehwYC3SQL._SL1000_.jpg",
    images: ["https://m.media-amazon.com/images/I/41ehwYC3SQL._SL1000_.jpg"],
    stock: 35,
    rating: 4.3,
    featured: true,
    specifications: { "Sensor": "Optical", "Resolution": "500 DPI", "Interface": "USB 2.0", "Certification": "UIDAI Approved" }
  },
  {
    name: "Morpho MSO 1300 E3 Fingerprint Scanner",
    description: "High-performance biometric fingerprint scanner with advanced fake finger detection. Perfect for Aadhaar based authentication and KYC verification.",
    price: 2799,
    originalPrice: 3299,
    category: "Biometric Devices",
    image: "https://m.media-amazon.com/images/I/413YNhugF8L._SL1100_.jpg",
    images: ["https://m.media-amazon.com/images/I/413YNhugF8L._SL1100_.jpg"],
    stock: 40,
    rating: 4.6,
    featured: true,
    specifications: { "Sensor": "Optical", "Resolution": "500 DPI", "Interface": "USB 2.0", "Certification": "STQC & UIDAI" }
  },
  {
    name: "GPS Tracker for Car - Waterproof",
    description: "Real-time GPS tracking device with mobile app. Waterproof design, geo-fencing alerts, and 90-day standby battery. Perfect for vehicle tracking and fleet management.",
    price: 3999,
    originalPrice: 4999,
    category: "GPS Trackers",
    image: "https://m.media-amazon.com/images/I/61BRCV7TA0L._SL1500_.jpg",
    images: ["https://m.media-amazon.com/images/I/61BRCV7TA0L._SL1500_.jpg"],
    stock: 25,
    rating: 4.2,
    featured: true,
    specifications: { "Battery": "5000mAh", "Standby": "90 Days", "Waterproof": "IP67", "Tracking": "Real-time" }
  },
  {
    name: "Mini GPS Tracker with Voice Monitoring",
    description: "Compact GPS tracker with SOS button and voice monitoring. Real-time location tracking via mobile app. Ideal for kids, elderly, and pets.",
    price: 2499,
    originalPrice: 2999,
    category: "GPS Trackers",
    image: "https://m.media-amazon.com/images/I/51RLZI4KWKL._SL1000_.jpg",
    images: ["https://m.media-amazon.com/images/I/51RLZI4KWKL._SL1000_.jpg"],
    stock: 30,
    rating: 4.0,
    featured: false,
    specifications: { "Battery": "1000mAh", "Features": "SOS, Voice Monitor", "Size": "Compact", "App": "iOS & Android" }
  },
  {
    name: "Thermal Receipt Printer 80mm",
    description: "High-speed thermal printer for POS systems. 80mm paper width with auto-cutter. USB and Ethernet connectivity. 250mm/s print speed.",
    price: 5999,
    originalPrice: 6999,
    category: "Printers",
    image: "https://m.media-amazon.com/images/I/61XtK+HU3hL._SL1500_.jpg",
    images: ["https://m.media-amazon.com/images/I/61XtK+HU3hL._SL1500_.jpg"],
    stock: 20,
    rating: 4.4,
    featured: true,
    specifications: { "Paper Width": "80mm", "Speed": "250mm/s", "Connectivity": "USB, Ethernet", "Cutter": "Auto" }
  },
  {
    name: "Portable Bluetooth Thermal Printer",
    description: "Compact wireless thermal printer for mobile printing. Bluetooth connectivity with Android and iOS support. Perfect for delivery and field work.",
    price: 4499,
    originalPrice: 5299,
    category: "Printers",
    image: "https://m.media-amazon.com/images/I/61Ah7LQ8URL._SL1500_.jpg",
    images: ["https://m.media-amazon.com/images/I/61Ah7LQ8URL._SL1500_.jpg"],
    stock: 15,
    rating: 4.1,
    featured: false,
    specifications: { "Paper Width": "58mm", "Connectivity": "Bluetooth", "Battery": "Rechargeable", "Portable": "Yes" }
  },
  {
    name: "Complete Aadhaar Enrollment Kit",
    description: "Full Aadhaar enrollment kit with iris scanner, fingerprint scanner, camera, and all accessories. UIDAI certified for permanent Aadhaar centers.",
    price: 89999,
    originalPrice: 99999,
    category: "Aadhaar Kits",
    image: "https://m.media-amazon.com/images/I/71e-cqf7QqL._SL1500_.jpg",
    images: ["https://m.media-amazon.com/images/I/71e-cqf7QqL._SL1500_.jpg"],
    stock: 5,
    rating: 4.7,
    featured: true,
    specifications: { "Contents": "Iris Scanner, Fingerprint, Camera, GPS", "Certification": "UIDAI", "Type": "Complete Kit" }
  },
  {
    name: "Iris Scanner - Mantra MIS100 V2",
    description: "STQC certified iris scanner for Aadhaar authentication. High-quality dual iris capture with auto-focus. USB connectivity.",
    price: 12999,
    originalPrice: 14999,
    category: "Biometric Devices",
    image: "https://m.media-amazon.com/images/I/41q4-F91LDL._SL1200_.jpg",
    images: ["https://m.media-amazon.com/images/I/41q4-F91LDL._SL1200_.jpg"],
    stock: 10,
    rating: 4.5,
    featured: true,
    specifications: { "Type": "Dual Iris", "Interface": "USB 2.0", "Certification": "STQC", "Auto-focus": "Yes" }
  },
  {
    name: "Barcode Scanner - Wireless 2D",
    description: "High-performance 2D barcode scanner with wireless connectivity. Reads QR codes, barcodes, and all 1D/2D codes. 100m wireless range.",
    price: 3499,
    originalPrice: 3999,
    category: "Business Equipment",
    image: "https://m.media-amazon.com/images/I/61x6w8OPdqL._SL1500_.jpg",
    images: ["https://m.media-amazon.com/images/I/61x6w8OPdqL._SL1500_.jpg"],
    stock: 45,
    rating: 4.3,
    featured: false,
    specifications: { "Type": "2D/QR", "Connectivity": "Wireless 2.4G", "Range": "100m", "Battery": "Rechargeable" }
  }
];

async function addDemoProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products (optional)
    // await Product.deleteMany({});
    // console.log('Cleared existing products');

    // Check if products already exist
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing products. Adding more...`);
    }

    // Add demo products
    const result = await Product.insertMany(demoProducts);
    console.log(`✅ Added ${result.length} demo products`);

    // Show all products
    const allProducts = await Product.find();
    console.log(`\nTotal products in database: ${allProducts.length}`);
    allProducts.forEach(p => console.log(`- ${p.name}: ₹${p.price}`));

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addDemoProducts();
