const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ============ EMAIL CONFIGURATION ============
// Configure email transporter (using Gmail SMTP)
// For production, use environment variables for credentials
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '', // Your Gmail address
    pass: process.env.EMAIL_PASS || ''  // App password (not regular password)
  }
});

// Email sending function
const sendOrderStatusEmail = async (userEmail, userName, orderId, status, orderDetails = {}) => {
  // Skip if email credentials not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured - skipping notification');
    return false;
  }

  const statusMessages = {
    'processing': {
      subject: '📦 Order Confirmed - Atlas & Arrow',
      heading: 'Your Order is Being Processed!',
      message: 'We\'ve received your order and it\'s now being prepared for shipment.',
      color: '#3B82F6'
    },
    'confirmed': {
      subject: '✅ Order Confirmed - Atlas & Arrow',
      heading: 'Your Order is Confirmed!',
      message: 'Your order has been confirmed and will be shipped soon.',
      color: '#10B981'
    },
    'shipped': {
      subject: '🚚 Order Shipped - Atlas & Arrow',
      heading: 'Your Order is On Its Way!',
      message: 'Great news! Your order has been shipped and is on its way to you.',
      color: '#8B5CF6'
    },
    'out_for_delivery': {
      subject: '🏃 Out for Delivery - Atlas & Arrow',
      heading: 'Your Order is Out for Delivery!',
      message: 'Exciting! Your order is out for delivery and will arrive today.',
      color: '#F59E0B'
    },
    'delivered': {
      subject: '🎉 Order Delivered - Atlas & Arrow',
      heading: 'Your Order Has Been Delivered!',
      message: 'Your order has been successfully delivered. We hope you enjoy your purchase!',
      color: '#10B981'
    },
    'cancelled': {
      subject: '❌ Order Cancelled - Atlas & Arrow',
      heading: 'Your Order Has Been Cancelled',
      message: 'Your order has been cancelled. If you have any questions, please contact our support.',
      color: '#EF4444'
    }
  };

  const statusInfo = statusMessages[status] || {
    subject: '📦 Order Update - Atlas & Arrow',
    heading: 'Order Status Update',
    message: `Your order status has been updated to: ${status}`,
    color: '#6B7280'
  };

  const trackingInfo = orderDetails.tracking ? `
    <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">Tracking Information</h3>
      ${orderDetails.tracking.carrier ? `<p style="margin: 5px 0;"><strong>Carrier:</strong> ${orderDetails.tracking.carrier}</p>` : ''}
      ${orderDetails.tracking.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${orderDetails.tracking.trackingNumber}</p>` : ''}
      ${orderDetails.tracking.estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${new Date(orderDetails.tracking.estimatedDelivery).toLocaleDateString()}</p>` : ''}
    </div>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F3F4F6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${statusInfo.color} 0%, #1E40AF 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Atlas & Arrow</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Trusted Tech Partner</p>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: ${statusInfo.color}; margin: 0 0 20px 0;">${statusInfo.heading}</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${userName || 'Customer'},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ${statusInfo.message}
          </p>
          
          <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.color};">
            <p style="margin: 0; color: #6B7280;"><strong>Order ID:</strong> #${orderId}</p>
            <p style="margin: 10px 0 0 0; color: #6B7280;"><strong>Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${status.replace('_', ' ').toUpperCase()}</span></p>
          </div>
          
          ${trackingInfo}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders" 
               style="display: inline-block; background: ${statusInfo.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Track Your Order
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
            Thank you for shopping with Atlas & Arrow!<br>
            If you have any questions, please contact our support team.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px;">
          <p>© 2024 Atlas & Arrow. All rights reserved.</p>
          <p>This email was sent regarding your order update.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await emailTransporter.sendMail({
      from: `"Atlas & Arrow" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: statusInfo.subject,
      html: htmlContent
    });
    console.log(`📧 Email sent to ${userEmail} for order ${orderId} - Status: ${status}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    return false;
  }
};

// Welcome email for new users
const sendWelcomeEmail = async (userEmail, userName) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured - skipping welcome email');
    return false;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F3F4F6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome to Atlas & Arrow!</h1>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1E40AF; margin: 0 0 20px 0;">Hello ${userName}!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.8;">
            Thank you for creating an account with <strong>Atlas & Arrow</strong>! We're thrilled to have you as part of our community.
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.8;">
            As your trusted tech partner, we offer the best selection of:
          </p>
          
          <ul style="color: #374151; font-size: 16px; line-height: 2;">
            <li>🔐 Biometric Devices</li>
            <li>📍 GPS Trackers</li>
            <li>🖨️ Thermal Printers</li>
            <li>📋 Aadhaar Enrollment Kits</li>
            <li>💼 Business Equipment</li>
          </ul>
          
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">🎁 Welcome Offer!</p>
            <p style="color: white; margin: 10px 0 0 0; font-size: 24px;">Use code <strong>WELCOME10</strong> for 10% off your first order!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" 
               style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Start Shopping →
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
            If you have any questions, feel free to reply to this email or contact our support team.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px;">
          <p>© 2024 Atlas & Arrow. All rights reserved.</p>
          <p>Your Trusted Tech Partner</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await emailTransporter.sendMail({
      from: `"Atlas & Arrow" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '🎉 Welcome to Atlas & Arrow - Your Tech Partner!',
      html: htmlContent
    });
    console.log(`📧 Welcome email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error.message);
    return false;
  }
};

// Order confirmation email
const sendOrderConfirmationEmail = async (userEmail, userName, orderId, orderDetails) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured - skipping order confirmation email');
    return false;
  }

  const itemsHtml = orderDetails.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
        <strong>${item.name}</strong><br>
        <span style="color: #6B7280; font-size: 14px;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">
        ₹${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F3F4F6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Order Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase</p>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi <strong>${userName}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Great news! Your order has been confirmed and is being prepared for shipment.
          </p>
          
          <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <p style="margin: 0; color: #374151; font-size: 18px;"><strong>Order ID:</strong> #${orderId}</p>
            <p style="margin: 10px 0 0 0; color: #6B7280;">Placed on ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <!-- Order Items -->
          <h3 style="color: #374151; margin: 30px 0 15px 0;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
            <tr>
              <td style="padding: 12px; font-weight: bold;">Subtotal</td>
              <td style="padding: 12px; text-align: right;">₹${orderDetails.subtotal?.toLocaleString() || '0'}</td>
            </tr>
            <tr>
              <td style="padding: 12px;">Shipping</td>
              <td style="padding: 12px; text-align: right;">${orderDetails.shipping === 0 ? 'FREE' : '₹' + orderDetails.shipping?.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 12px;">Tax</td>
              <td style="padding: 12px; text-align: right;">₹${orderDetails.tax?.toLocaleString() || '0'}</td>
            </tr>
            <tr style="background: #F3F4F6;">
              <td style="padding: 15px; font-size: 18px; font-weight: bold;">Total</td>
              <td style="padding: 15px; text-align: right; font-size: 18px; font-weight: bold; color: #10B981;">₹${orderDetails.total?.toLocaleString() || '0'}</td>
            </tr>
          </table>
          
          <!-- Shipping Address -->
          ${orderDetails.shippingAddress ? `
          <h3 style="color: #374151; margin: 30px 0 15px 0;">Shipping Address</h3>
          <div style="background: #F9FAFB; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #374151;">
              ${orderDetails.shippingAddress.fullName || userName}<br>
              ${orderDetails.shippingAddress.address || ''}<br>
              ${orderDetails.shippingAddress.city || ''}, ${orderDetails.shippingAddress.state || ''} ${orderDetails.shippingAddress.pincode || ''}<br>
              Phone: ${orderDetails.shippingAddress.phone || ''}
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders" 
               style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Track Your Order
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
            We'll send you another email when your order ships.<br>
            Thank you for shopping with Atlas & Arrow!
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px;">
          <p>© 2024 Atlas & Arrow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await emailTransporter.sendMail({
      from: `"Atlas & Arrow" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `✅ Order Confirmed - #${orderId} | Atlas & Arrow`,
      html: htmlContent
    });
    console.log(`📧 Order confirmation email sent to ${userEmail} for order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error.message);
    return false;
  }
};

// Helpful crash handlers so we can see why process exits immediately after startup
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err && err.stack ? err.stack : err);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
  // Do not exit here — nodemon/other tooling will restart; but printing the stack is critical.
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection (or fallback to in-memory demo mode when MONGODB_URI is missing)
// Set FORCE_DEMO_MODE to true to bypass MongoDB (useful when IP not whitelisted in Atlas)
const FORCE_DEMO_MODE = false; // IP is now whitelisted in MongoDB Atlas
const useInMemory = FORCE_DEMO_MODE || !process.env.MONGODB_URI;

if (useInMemory) {
  // Safe defaults for demo mode
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
  process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@atlasarrow.com';
  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
}

// We'll initialize DB once models are set up — track if we should call initializeDatabase
let shouldInitializeOnStart = false;
let mongoConnected = false;

if (!useInMemory) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    mongoConnected = true;
    // Initialize database with products after connection
    try {
      await initializeDatabase();
      console.log('✅ Database initialized');
    } catch (err) {
      console.error('Error initializing database:', err);
    }
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
  console.warn('⚠️ MONGODB_URI not set — starting server in IN-MEMORY demo mode');
  // We'll initialize demo data using memory stores instead of Mongo
  shouldInitializeOnStart = true; // initialize after models are created
}

// ==================== MODELS ====================

// User Model
const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  avatar: { type: String },
  googleId: { type: String },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdAt: { type: Date, default: Date.now }
});

let User;

// Product Model
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
  specifications: [{
    key: String,
    value: String
  }],
  features: [{ type: String }],
  brand: { type: String },
  warranty: { type: String },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    userEmail: { type: String },
    rating: { type: Number, required: true },
    title: { type: String },
    comment: { type: String },
    status: { type: String, default: 'approved' },
    helpful: { type: Number, default: 0 },
    reply: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  inStock: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

let Product;

// Order Model
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, required: true, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    subtotal: Number
  }],
  shippingAddress: {
    fullname: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  paymentMethod: { type: String, enum: ['COD', 'CARD', 'UPI', 'QR', 'NETBANKING'], default: 'CARD' },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  status: { 
    type: String, 
    enum: ['processing', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'processing'
  },
  // Tracking information
  tracking: {
    carrier: { type: String, default: 'Atlas Express' },
    trackingNumber: { type: String },
    currentLocation: { type: String, default: 'Atlas Arrow Warehouse' },
    estimatedDelivery: { type: Date },
    timeline: [{
      status: String,
      date: { type: Date, default: Date.now },
      location: String,
      description: String,
      completed: { type: Boolean, default: false }
    }]
  },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  couponCode: { type: String, default: null },
  couponDiscount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let Order;

// Cart Model
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1, min: 1 }
  }],
  updatedAt: { type: Date, default: Date.now }
});

let Cart;

// Contact Message Model
const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  company: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  inquiryType: { type: String, enum: ['general', 'sales', 'support', 'partnership', 'bulk_order'], default: 'general' },
  status: { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
  adminNotes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

let ContactMessage;

// Notification Model
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['order', 'promotion', 'security', 'product', 'system', 'admin'], default: 'system' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

let Notification;

// In-memory fallback stores + small model-like wrappers
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const makeModelWrapper = (storeName) => ({
  async findOne(query) {
    if (!query) return null;
    const items = global.__INMEM__[storeName];
    if (query._id || query.id) {
      const id = query._id || query.id;
      return items.find(i => i._id === id) || null;
    }
    const key = Object.keys(query)[0];
    const val = query[key];
    return items.find(i => i[key] === val) || null;
  },
  findById(id) {
    const items = global.__INMEM__[storeName];
    const item = items.find(i => i._id === id) || null;
    // Return a chainable object with select and populate methods
    return {
      then: (resolve) => resolve(item),
      select: function(fields) {
        if (!item) return Promise.resolve(null);
        // For simplicity, just return the item (excluding password if requested)
        if (fields && fields.includes('-password')) {
          const { password, ...rest } = item;
          return Promise.resolve(rest);
        }
        return Promise.resolve(item);
      },
      populate: function() {
        // In-memory mode doesn't need population, just return the item
        return Promise.resolve(item);
      }
    };
  },
  findByIdAndUpdate(id, update, options = {}) {
    const items = global.__INMEM__[storeName];
    const item = items.find(i => i._id === id);
    if (item) {
      // Deep merge for nested objects like address
      for (const key in update) {
        if (update[key] && typeof update[key] === 'object' && !Array.isArray(update[key]) && item[key] && typeof item[key] === 'object') {
          // Merge nested objects
          item[key] = { ...item[key], ...update[key] };
        } else {
          item[key] = update[key];
        }
      }
    }
    // Return a chainable object with select method
    return {
      then: (resolve) => resolve(item || null),
      select: function(fields) {
        if (!item) return Promise.resolve(null);
        // For simplicity, just return the item (excluding password if requested)
        if (fields && fields.includes('-password')) {
          const { password, ...rest } = item;
          return Promise.resolve(rest);
        }
        return Promise.resolve(item);
      }
    };
  },
  async create(obj) {
    const items = global.__INMEM__[storeName];
    const item = { _id: genId(), createdAt: new Date(), ...obj };
    items.push(item);
    // attach save/populate methods on returned object to mimic mongoose docs
    item.save = async function() { /* in-memory auto-saves */ };
    item.populate = async function() { return this; };
    return item;
  },
  async countDocuments() {
    const items = global.__INMEM__[storeName];
    return items.length;
  },
  async insertMany(arr) {
    const items = global.__INMEM__[storeName];
    arr.forEach(a => items.push({ _id: genId(), createdAt: new Date(), ...a }));
    return arr;
  },
  find(query = {}) {
    const items = global.__INMEM__[storeName];
    // very small matcher for demo purposes
    let result;
    if (!query || Object.keys(query).length === 0) {
      result = [...items];
    } else if (query.$or) {
      const re = query.$or.map(o => ({ key: Object.keys(o)[0], val: Object.values(o)[0].$regex }));
      result = items.filter(it => re.some(r => new RegExp(r.val, 'i').test(it[r.key])));
    } else {
      result = items.filter(it => {
        return Object.keys(query).every(k => {
          if (typeof query[k] === 'object' && query[k].$gte != null) {
            return it[k] >= query[k].$gte && (query[k].$lte == null || it[k] <= query[k].$lte);
          }
          return it[k] === query[k];
        });
      });
    }
    // Return a chainable object with sort and populate methods
    const chainable = {
      then: (resolve) => resolve(result),
      sort: function(sortOption) {
        if (sortOption && Object.keys(sortOption).length > 0) {
          const key = Object.keys(sortOption)[0];
          const order = sortOption[key];
          result.sort((a, b) => {
            if (order === 1) return (a[key] || 0) - (b[key] || 0);
            return (b[key] || 0) - (a[key] || 0);
          });
        }
        return chainable; // Return chainable for further chaining
      },
      populate: function() { 
        return chainable; // Return chainable for further chaining
      }
    };
    return chainable;
  },
  async distinct(field) {
    const items = global.__INMEM__[storeName];
    return [...new Set(items.map(i => i[field]).filter(Boolean))];
  },
  async findOneAndUpdate(query, update, options = {}) {
    const items = global.__INMEM__[storeName];
    const key = Object.keys(query)[0];
    const val = query[key];
    const item = items.find(i => i[key] === val || i._id === val);
    if (!item) return null;
    Object.assign(item, update);
    return item;
  }
});

// initialize in-memory stores
if (useInMemory) {
  global.__INMEM__ = {
    users: [],
    products: [],
    orders: [],
    carts: [],
    contactMessages: []
  };

  User = makeModelWrapper('users');
  Product = makeModelWrapper('products');
  Order = makeModelWrapper('orders');
  ContactMessage = makeModelWrapper('contactMessages');

  // Cart requires instances with save/populate behavior for convenience
  Cart = {
    async findOne(query) {
      const items = global.__INMEM__.carts;
      const val = query.user || query.user === 0 ? query.user : null;
      if (val == null) return null;
      const cart = items.find(c => c.user === val) || null;
      if (cart) {
        cart.save = async function() { /* noop */ };
        cart.populate = async function() { return this; };
      }
      return cart;
    },
    async create(obj) {
      const items = global.__INMEM__.carts;
      const cart = { _id: genId(), updatedAt: Date.now(), ...obj };
      cart.save = async function() { /* noop */ };
      cart.populate = async function() { return this; };
      items.push(cart);
      return cart;
    },
    async findOneAndUpdate(query, update) {
      const items = global.__INMEM__.carts;
      const cart = items.find(c => c.user === query.user);
      if (!cart) return null;
      Object.assign(cart, update);
      return cart;
    }
  };
}

// If running with a real MongoDB connection use real mongoose models
if (!useInMemory) {
  User = mongoose.model('User', userSchema);
  Product = mongoose.model('Product', productSchema);
  Order = mongoose.model('Order', orderSchema);
  Cart = mongoose.model('Cart', cartSchema);
  ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
  Notification = mongoose.model('Notification', notificationSchema);
}

// If we were waiting to initialize (either connected to mongo, or demo mode), initialize now
if (shouldInitializeOnStart) {
  try { initializeDatabase(); } catch (err) { console.error('Error during initial DB init:', err); }
}

// ==================== MIDDLEWARE ====================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    // Ensure id is a string
    req.user = {
      id: decoded.id.toString(),
      email: decoded.email,
      role: decoded.role
    };
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ==================== INITIALIZE DATABASE ====================

async function initializeDatabase() {
  try {
    // Create admin user - use env vars or fallback to defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@atlasarrow.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';
    
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        fullname: 'Admin User',
        email: adminEmail,
        phone: '9999999999',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Admin user created:', adminEmail);
    } else {
      // Ensure admin has correct password and role
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.updateOne(
        { email: adminEmail },
        { $set: { password: hashedPassword, role: 'admin' } }
      );
      console.log('✅ Admin user verified:', adminEmail);
    }

    // Sample products - Always ensure we have products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const sampleProducts = [
        {
          name: 'Mantra MFS100 Fingerprint Scanner',
          description: 'High-quality biometric fingerprint scanner with FBI certification. Perfect for Aadhaar enrollment and authentication.',
          category: 'Biometric Devices',
          price: 2499,
          originalPrice: 3499,
          discount: 29,
          stock: 50,
          images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'],
          brand: 'Mantra',
          warranty: '1 Year',
          rating: 4.5,
          features: ['FBI Certified', 'Auto Capture', 'USB 2.0', 'Windows & Linux Compatible'],
          specifications: [
            { key: 'Sensor Type', value: 'Optical' },
            { key: 'Resolution', value: '500 DPI' },
            { key: 'Interface', value: 'USB 2.0' }
          ],
          featured: true,
          inStock: true
        },
        {
          name: 'Morpho MSO 1300 E3 Fingerprint Scanner',
          description: 'Advanced biometric device for Aadhaar authentication with UIDAI certification.',
          category: 'Biometric Devices',
          price: 2799,
          originalPrice: 3799,
          discount: 26,
          stock: 40,
          images: ['https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=400&fit=crop'],
          brand: 'Morpho',
          warranty: '1 Year',
          rating: 4.7,
          features: ['UIDAI Certified', 'Fast Recognition', 'Durable Design'],
          featured: true,
          inStock: true
        },
        {
          name: 'Startek FM220U Fingerprint Reader',
          description: 'Compact and reliable fingerprint scanner for secure authentication.',
          category: 'Biometric Devices',
          price: 1999,
          originalPrice: 2799,
          discount: 29,
          stock: 60,
          images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop'],
          brand: 'Startek',
          warranty: '6 Months',
          rating: 4.3,
          inStock: true
        },
        {
          name: 'GPS-303 Vehicle Tracker',
          description: 'Real-time GPS tracking device for vehicles with mobile app support.',
          category: 'GPS Trackers',
          price: 3499,
          originalPrice: 4999,
          discount: 30,
          stock: 35,
          images: ['https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop'],
          brand: 'Coban',
          warranty: '1 Year',
          rating: 4.4,
          features: ['Real-time Tracking', 'Geofencing', 'Mobile App', 'SOS Alert'],
          featured: true,
          inStock: true
        },
        {
          name: 'Personal GPS Tracker Mini',
          description: 'Portable GPS tracker for kids, elderly, and pets with long battery life.',
          category: 'GPS Trackers',
          price: 1999,
          originalPrice: 2999,
          discount: 33,
          stock: 45,
          images: ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=400&fit=crop'],
          brand: 'TrackMe',
          warranty: '6 Months',
          rating: 4.2,
          inStock: true
        },
        {
          name: 'HP LaserJet Pro M126nw Printer',
          description: 'Multifunction laser printer with wireless connectivity.',
          category: 'Printers',
          price: 15999,
          originalPrice: 18999,
          discount: 16,
          stock: 20,
          images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop'],
          brand: 'HP',
          warranty: '1 Year',
          rating: 4.6,
          features: ['Print, Scan, Copy', 'WiFi Enabled', 'Mobile Printing'],
          featured: true,
          inStock: true
        },
        {
          name: 'Canon Pixma G3000 All-in-One Printer',
          description: 'Ink tank printer with high page yield and borderless printing.',
          category: 'Printers',
          price: 13499,
          originalPrice: 16499,
          discount: 18,
          stock: 25,
          images: ['https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=400&h=400&fit=crop'],
          brand: 'Canon',
          warranty: '1 Year',
          rating: 4.5,
          inStock: true
        },
        {
          name: 'Complete Aadhaar Enrollment Kit',
          description: 'Full kit including biometric scanner, iris scanner, and webcam for Aadhaar enrollment.',
          category: 'Aadhaar Kits',
          price: 24999,
          originalPrice: 32999,
          discount: 24,
          stock: 15,
          images: ['https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=400&fit=crop'],
          brand: 'Atlas & Arrow',
          warranty: '1 Year',
          rating: 4.8,
          features: ['Complete Solution', 'UIDAI Approved', 'All Peripherals Included'],
          featured: true,
          inStock: true
        },
        {
          name: 'Iris Scanner for Aadhaar',
          description: 'High-precision iris scanner for secure biometric authentication.',
          category: 'Aadhaar Kits',
          price: 8999,
          originalPrice: 12999,
          discount: 31,
          stock: 30,
          images: ['https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=400&fit=crop'],
          brand: 'IriTech',
          warranty: '1 Year',
          rating: 4.4,
          inStock: true
        },
        {
          name: 'Barcode Scanner Wireless',
          description: '2D barcode scanner with wireless connectivity for inventory management.',
          category: 'Business Equipment',
          price: 4999,
          originalPrice: 6999,
          discount: 29,
          stock: 40,
          images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'],
          brand: 'Honeywell',
          warranty: '1 Year',
          rating: 4.3,
          featured: true,
          inStock: true
        },
        {
          name: 'POS Thermal Printer',
          description: 'High-speed thermal printer for billing and receipts.',
          category: 'Business Equipment',
          price: 5499,
          originalPrice: 7499,
          discount: 27,
          stock: 35,
          images: ['https://images.unsplash.com/photo-1562408590-e32931084e23?w=400&h=400&fit=crop'],
          brand: 'Epson',
          warranty: '1 Year',
          rating: 4.5,
          inStock: true
        },
        {
          name: 'USB Fingerprint Scanner',
          description: 'Compact USB fingerprint reader for attendance systems.',
          category: 'Accessories',
          price: 1299,
          originalPrice: 1999,
          discount: 35,
          stock: 100,
          images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop'],
          brand: 'Generic',
          warranty: '3 Months',
          rating: 4.0,
          inStock: true
        },
        {
          name: 'Advanced GPS Fleet Tracker',
          description: 'Enterprise-grade GPS tracking solution for fleet management with real-time monitoring.',
          category: 'GPS Trackers',
          price: 12999,
          originalPrice: 17999,
          discount: 28,
          stock: 25,
          images: ['https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=400&fit=crop'],
          brand: 'Atlas & Arrow',
          warranty: '2 Years',
          rating: 4.9,
          features: ['Real-time Tracking', 'Fleet Management', 'Route Optimization', 'Fuel Monitoring'],
          featured: true,
          inStock: true
        },
        {
          name: 'Professional Biometric Time Clock',
          description: 'Advanced biometric attendance system with cloud sync and reporting.',
          category: 'Biometric Devices',
          price: 18999,
          originalPrice: 24999,
          discount: 24,
          stock: 30,
          images: ['https://images.unsplash.com/photo-1633265486501-0cf524a07213?w=400&h=400&fit=crop'],
          brand: 'ZKTeco',
          warranty: '1 Year',
          rating: 4.7,
          features: ['Face Recognition', 'Fingerprint', 'Cloud Sync', 'Mobile App'],
          featured: true,
          inStock: true
        },
        {
          name: 'High-Speed Label Printer',
          description: 'Industrial label printer for barcode and QR code printing.',
          category: 'Printers',
          price: 8999,
          originalPrice: 11999,
          discount: 25,
          stock: 40,
          images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop'],
          brand: 'Zebra',
          warranty: '1 Year',
          rating: 4.6,
          inStock: true
        },
        {
          name: 'Smart Door Access Control System',
          description: 'RFID and biometric door access control with mobile app integration.',
          category: 'Business Equipment',
          price: 21999,
          originalPrice: 28999,
          discount: 24,
          stock: 18,
          images: ['https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=400&fit=crop'],
          brand: 'HID Global',
          warranty: '1 Year',
          rating: 4.8,
          features: ['RFID Cards', 'Mobile Access', 'Cloud Management', 'Multi-door Support'],
          featured: true,
          inStock: true
        },
        {
          name: 'Portable Document Scanner',
          description: 'High-speed document scanner with OCR capabilities.',
          category: 'Business Equipment',
          price: 12499,
          originalPrice: 16999,
          discount: 26,
          stock: 35,
          images: ['https://images.unsplash.com/photo-1606857521015-7f9fcf423571?w=400&h=400&fit=crop'],
          brand: 'Fujitsu',
          warranty: '1 Year',
          rating: 4.5,
          inStock: true
        },
        {
          name: 'Premium Aadhaar Enrollment Station',
          description: 'Complete Aadhaar enrollment solution with all required peripherals.',
          category: 'Aadhaar Kits',
          price: 34999,
          originalPrice: 44999,
          discount: 22,
          stock: 12,
          images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop'],
          brand: 'Atlas & Arrow',
          warranty: '2 Years',
          rating: 4.9,
          features: ['Complete Kit', 'UIDAI Certified', 'Training Included', 'Support'],
          featured: true,
          inStock: true
        },
        {
          name: 'Wireless Barcode Scanner',
          description: '2.4GHz wireless barcode scanner with long battery life.',
          category: 'Accessories',
          price: 3499,
          originalPrice: 4999,
          discount: 30,
          stock: 60,
          images: ['https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=400&h=400&fit=crop'],
          brand: 'Symbol',
          warranty: '1 Year',
          rating: 4.4,
          inStock: true
        },
        {
          name: 'Enterprise GPS Tracker with Camera',
          description: 'Advanced GPS tracker with built-in camera for vehicle monitoring.',
          category: 'GPS Trackers',
          price: 15999,
          originalPrice: 21999,
          discount: 27,
          stock: 20,
          images: ['https://images.unsplash.com/photo-1580974852861-c381510bc98a?w=400&h=400&fit=crop'],
          brand: 'Queclink',
          warranty: '1 Year',
          rating: 4.6,
          features: ['GPS + Camera', 'Real-time Video', 'Geofencing', 'SOS Button'],
          featured: true,
          inStock: true
        },
        {
          name: 'Multi-function Office Printer',
          description: 'All-in-one printer with print, scan, copy, and fax capabilities.',
          category: 'Printers',
          price: 22999,
          originalPrice: 29999,
          discount: 23,
          stock: 15,
          images: ['https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=400&h=400&fit=crop'],
          brand: 'Brother',
          warranty: '1 Year',
          rating: 4.7,
          features: ['Print, Scan, Copy, Fax', 'Network Ready', 'Duplex Printing'],
          featured: true,
          inStock: true
        }
      ];

      await Product.insertMany(sampleProducts);
      console.log('✅ Sample products created');
    } else {
      // Add more products if we have less than 40
      const currentCount = await Product.countDocuments();
      if (currentCount < 40) {
        const additionalProducts = [
          {
            name: 'Smart Biometric Door Lock',
            description: 'Keyless entry system with fingerprint and PIN access. Perfect for homes and offices.',
            category: 'Biometric Devices',
            price: 14999,
            originalPrice: 19999,
            discount: 25,
            stock: 20,
            images: ['https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=400&fit=crop'],
            brand: 'Yale',
            warranty: '2 Years',
            rating: 4.8,
            features: ['Fingerprint Access', 'PIN Code', 'Mobile App', 'Auto Lock'],
            featured: true,
            inStock: true
          },
          {
            name: 'GPS Tracker with 4G LTE',
            description: 'Advanced GPS tracker with 4G connectivity for real-time tracking and monitoring.',
            category: 'GPS Trackers',
            price: 8999,
            originalPrice: 12999,
            discount: 31,
            stock: 30,
            images: ['https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop'],
            brand: 'Queclink',
            warranty: '1 Year',
            rating: 4.6,
            features: ['4G LTE', 'Real-time Tracking', 'Geofencing', 'SOS Button'],
            featured: true,
            inStock: true
          },
          {
            name: 'Industrial Barcode Printer',
            description: 'Heavy-duty barcode printer for warehouse and inventory management.',
            category: 'Printers',
            price: 27999,
            originalPrice: 34999,
            discount: 20,
            stock: 15,
            images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop'],
            brand: 'Zebra',
            warranty: '1 Year',
            rating: 4.7,
            features: ['Industrial Grade', 'High Speed', 'Network Ready', 'Label Printing'],
            featured: true,
            inStock: true
          },
          {
            name: 'Complete Aadhaar Enrollment Solution',
            description: 'Professional Aadhaar enrollment kit with all required hardware and software.',
            category: 'Aadhaar Kits',
            price: 44999,
            originalPrice: 59999,
            discount: 25,
            stock: 10,
            images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop'],
            brand: 'Atlas & Arrow',
            warranty: '2 Years',
            rating: 4.9,
            features: ['Complete Kit', 'UIDAI Approved', 'Training Included', '24/7 Support'],
            featured: true,
            inStock: true
          },
          {
            name: 'RFID Access Control System',
            description: 'Multi-door RFID access control system with card and mobile access.',
            category: 'Business Equipment',
            price: 32999,
            originalPrice: 42999,
            discount: 23,
            stock: 12,
            images: ['https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=400&fit=crop'],
            brand: 'HID Global',
            warranty: '1 Year',
            rating: 4.8,
            features: ['Multi-door', 'RFID Cards', 'Mobile Access', 'Cloud Management'],
            featured: true,
            inStock: true
          },
          {
            name: 'Wireless Fingerprint Scanner',
            description: 'Portable wireless fingerprint scanner with Bluetooth connectivity.',
            category: 'Accessories',
            price: 4499,
            originalPrice: 6499,
            discount: 31,
            stock: 50,
            images: ['https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=400&fit=crop'],
            brand: 'SecuGen',
            warranty: '1 Year',
            rating: 4.5,
            inStock: true
          },
          {
            name: 'Vehicle GPS Tracker with Camera',
            description: 'Dual camera GPS tracker for vehicles with live video streaming.',
            category: 'GPS Trackers',
            price: 18999,
            originalPrice: 24999,
            discount: 24,
            stock: 18,
            images: ['https://images.unsplash.com/photo-1580974852861-c381510bc98a?w=400&h=400&fit=crop'],
            brand: 'Queclink',
            warranty: '1 Year',
            rating: 4.7,
            features: ['Dual Camera', 'Live Streaming', 'GPS Tracking', '4G Connectivity'],
            featured: true,
            inStock: true
          },
          {
            name: 'Professional Document Scanner',
            description: 'High-speed document scanner with OCR and cloud integration.',
            category: 'Business Equipment',
            price: 17999,
            originalPrice: 23999,
            discount: 25,
            stock: 25,
            images: ['https://images.unsplash.com/photo-1606857521015-7f9fcf423571?w=400&h=400&fit=crop'],
            brand: 'Fujitsu',
            warranty: '1 Year',
            rating: 4.6,
            inStock: true
          },
          {
            name: 'Biometric Attendance Terminal',
            description: 'Standalone biometric attendance terminal with cloud sync.',
            category: 'Biometric Devices',
            price: 21999,
            originalPrice: 28999,
            discount: 24,
            stock: 15,
            images: ['https://images.unsplash.com/photo-1633265486501-0cf524a07213?w=400&h=400&fit=crop'],
            brand: 'ZKTeco',
            warranty: '1 Year',
            rating: 4.8,
            features: ['Standalone', 'Cloud Sync', 'Face + Fingerprint', 'Reports'],
            featured: true,
            inStock: true
          }
        ];
        await Product.insertMany(additionalProducts);
        console.log('✅ Additional products added');
      }
    }
    
    // Always ensure we have at least 40 products
    const finalCount = await Product.countDocuments();
    if (finalCount < 40) {
      const moreProducts = [
        {
          name: 'Portable Thermal Printer',
          description: 'Compact thermal printer for receipts and labels. Perfect for mobile businesses.',
          category: 'Printers',
          price: 6999,
          originalPrice: 9999,
          discount: 30,
          stock: 40,
          images: ['https://images.unsplash.com/photo-1562408590-e32931084e23?w=400&h=400&fit=crop'],
          brand: 'Epson',
          warranty: '1 Year',
          rating: 4.4,
          inStock: true
        },
        {
          name: 'Biometric Safe Box',
          description: 'Secure biometric safe with fingerprint access for valuables and documents.',
          category: 'Business Equipment',
          price: 24999,
          originalPrice: 32999,
          discount: 24,
          stock: 12,
          images: ['https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop'],
          brand: 'Godrej',
          warranty: '2 Years',
          rating: 4.7,
          featured: true,
          inStock: true
        },
        {
          name: 'GPS Pet Tracker',
          description: 'Lightweight GPS tracker for pets with activity monitoring and geofencing.',
          category: 'GPS Trackers',
          price: 3499,
          originalPrice: 4999,
          discount: 30,
          stock: 50,
          images: ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=400&fit=crop'],
          brand: 'Tractive',
          warranty: '6 Months',
          rating: 4.5,
          inStock: true
        },
        {
          name: '3-in-1 Biometric Scanner',
          description: 'Fingerprint, face, and iris recognition in one device for maximum security.',
          category: 'Biometric Devices',
          price: 39999,
          originalPrice: 54999,
          discount: 27,
          stock: 8,
          images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop'],
          brand: 'Suprema',
          warranty: '2 Years',
          rating: 4.9,
          features: ['Triple Biometric', 'High Security', 'Cloud Integration'],
          featured: true,
          inStock: true
        },
        {
          name: 'Mobile POS Terminal',
          description: 'Portable point-of-sale terminal with card reader and receipt printer.',
          category: 'Business Equipment',
          price: 18999,
          originalPrice: 24999,
          discount: 24,
          stock: 25,
          images: ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop'],
          brand: 'Ingenico',
          warranty: '1 Year',
          rating: 4.6,
          featured: true,
          inStock: true
        },
        {
          name: 'Aadhaar Iris Scanner',
          description: 'UIDAI approved iris scanner for Aadhaar enrollment and authentication.',
          category: 'Aadhaar Kits',
          price: 14999,
          originalPrice: 19999,
          discount: 25,
          stock: 20,
          images: ['https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=400&fit=crop'],
          brand: 'IriTech',
          warranty: '1 Year',
          rating: 4.6,
          inStock: true
        },
        {
          name: 'Wireless Card Reader',
          description: 'Contactless card reader for payments and access control.',
          category: 'Accessories',
          price: 2999,
          originalPrice: 4499,
          discount: 33,
          stock: 60,
          images: ['https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=400&h=400&fit=crop'],
          brand: 'Square',
          warranty: '1 Year',
          rating: 4.3,
          inStock: true
        },
        {
          name: 'Fleet Management GPS',
          description: 'Enterprise GPS solution for fleet management with driver behavior monitoring.',
          category: 'GPS Trackers',
          price: 24999,
          originalPrice: 32999,
          discount: 24,
          stock: 15,
          images: ['https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=400&fit=crop'],
          brand: 'Calamp',
          warranty: '1 Year',
          rating: 4.8,
          features: ['Fleet Management', 'Driver Monitoring', 'Fuel Tracking', 'Reports'],
          featured: true,
          inStock: true
        },
        {
          name: 'High-Speed Passbook Printer',
          description: 'Bank-grade passbook printer with high print quality and durability.',
          category: 'Printers',
          price: 19999,
          originalPrice: 26999,
          discount: 26,
          stock: 18,
          images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop'],
          brand: 'Epson',
          warranty: '1 Year',
          rating: 4.7,
          featured: true,
          inStock: true
        },
        {
          name: 'Multi-Biometric Access Control',
          description: 'Advanced access control system supporting fingerprint, face, and card access.',
          category: 'Biometric Devices',
          price: 34999,
          originalPrice: 45999,
          discount: 24,
          stock: 10,
          images: ['https://images.unsplash.com/photo-1633265486501-0cf524a07213?w=400&h=400&fit=crop'],
          brand: 'ZKTeco',
          warranty: '2 Years',
          rating: 4.9,
          features: ['Multi-Modal', 'Cloud Sync', 'Mobile App', 'Advanced Reports'],
          featured: true,
          inStock: true
        }
      ];
      await Product.insertMany(moreProducts);
      console.log('✅ More products added - Total products:', await Product.countDocuments());
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', [
  body('fullname')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Name must be 3-50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  body('email')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .isLength({ min: 10, max: 15 }).withMessage('Enter a valid 10-digit phone number'),
  body('password')
    .isLength({ min: 8, max: 50 }).withMessage('Password must be 8-50 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return first error message in a user-friendly format
    const firstError = errors.array()[0];
    return res.status(400).json({ 
      message: firstError.msg,
      field: firstError.path,
      errors: errors.array() 
    });
  }

  try {
    const { fullname, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already registered. Please login or use a different email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullname,
      email,
      phone,
      password: hashedPassword
    });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email
    sendWelcomeEmail(user.email, user.fullname).catch(err => 
      console.log('Welcome email failed:', err.message)
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id.toString(),
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({ 
      message: firstError.msg,
      field: firstError.path 
    });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email address' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google OAuth Login/Register
app.post('/api/auth/google', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Access token is required' });
    }

    // Fetch user info from Google using the access token
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!googleResponse.ok) {
      return res.status(401).json({ message: 'Invalid Google access token' });
    }

    const googleUser = await googleResponse.json();
    const { email, name, picture, sub: googleId } = googleUser;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        user.provider = 'google';
        await user.save();
      }
    } else {
      // Create new user with Google info
      user = await User.create({
        fullname: name,
        email,
        googleId,
        avatar: picture,
        provider: 'google',
        phone: '', // Google doesn't provide phone
        password: await bcrypt.hash(googleId + process.env.JWT_SECRET, 10) // Create a secure password
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id.toString(),
        fullname: user.fullname,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar,
        role: user.role,
        provider: 'google'
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== PRODUCT ROUTES ====================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, featured, minPrice, maxPrice, sort } = req.query;
    let query = {};

    if (category) query.category = category;
    if (featured) query.featured = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    if (sort === 'price-low') sortOption.price = 1;
    else if (sort === 'price-high') sortOption.price = -1;
    else if (sort === 'rating') sortOption.rating = -1;
    else sortOption.createdAt = -1;

    const products = await Product.find(query).sort(sortOption);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'fullname');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== CART ROUTES ====================

// Get user cart
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    
    // Populate products manually for both in-memory and MongoDB modes
    if (cart.items && cart.items.length > 0) {
      const populatedItems = await Promise.all(
        cart.items.map(async (item) => {
          const productId = item.product?._id || item.product || item.productId;
          if (!productId) return null;
          const product = await Product.findById(productId);
          if (!product) return null;
          return {
            product: product,
            quantity: item.quantity || 1
          };
        })
      );
      cart.items = populatedItems.filter(item => item && item.product); // Filter out null products
    } else {
      cart.items = [];
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to cart
app.post('/api/cart/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(item => {
      const itemProductId = item.product?._id?.toString() || item.product?.toString() || item.product;
      return itemProductId === productId;
    });
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    cart.updatedAt = Date.now();
    await cart.save();
    
    // Populate products manually
    if (cart.items && cart.items.length > 0) {
      const populatedItems = await Promise.all(
        cart.items.map(async (item) => {
          const productId = item.product?._id || item.product || item.productId;
          const product = await Product.findById(productId);
          return {
            product: product,
            quantity: item.quantity || 1
          };
        })
      );
      cart.items = populatedItems.filter(item => item.product);
    }

    res.json({ message: 'Product added to cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update cart item
app.put('/api/cart/update/:productId', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => {
      const itemProductId = item.product?._id?.toString() || item.product?.toString() || item.product;
      return itemProductId === req.params.productId;
    });
    if (item) {
      item.quantity = quantity;
      cart.updatedAt = Date.now();
      await cart.save();
      
      // Populate products manually
      if (cart.items && cart.items.length > 0) {
        const populatedItems = await Promise.all(
          cart.items.map(async (item) => {
            const productId = item.product?._id || item.product || item.productId;
            const product = await Product.findById(productId);
            return {
              product: product,
              quantity: item.quantity || 1
            };
          })
        );
        cart.items = populatedItems.filter(item => item.product);
      }
    }

    res.json({ message: 'Cart updated', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from cart
app.delete('/api/cart/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => {
      const itemProductId = item.product?._id?.toString() || item.product?.toString() || item.product;
      return itemProductId !== req.params.productId;
    });
    cart.updatedAt = Date.now();
    await cart.save();
    
    // Populate products manually
    if (cart.items && cart.items.length > 0) {
      const populatedItems = await Promise.all(
        cart.items.map(async (item) => {
          const productId = item.product?._id || item.product || item.productId;
          const product = await Product.findById(productId);
          return {
            product: product,
            quantity: item.quantity || 1
          };
        })
      );
      cart.items = populatedItems.filter(item => item.product);
    }

    res.json({ message: 'Item removed from cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear cart
app.delete('/api/cart/clear', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      cart.updatedAt = Date.now();
      await cart.save();
    }
    res.json({ message: 'Cart cleared', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ORDER ROUTES ====================

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes, couponCode, couponDiscount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }
      
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }

    const tax = Math.round(subtotal * 0.18); // 18% GST
    const shipping = subtotal > 10000 ? 0 : 100;
    const discount = couponDiscount || 0;
    const total = subtotal + tax + shipping - discount;

    const orderNumber = 'AA' + Date.now() + Math.floor(Math.random() * 1000);

    const order = await Order.create({
      user: req.user.id,
      orderNumber,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'CARD',
      paymentStatus: 'completed',
      status: 'confirmed',
      subtotal,
      tax,
      shipping,
      couponCode: couponCode || null,
      couponDiscount: discount,
      total,
      notes
    });

    // Clear cart after successful order
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], updatedAt: Date.now() }
    );

    // Send detailed order confirmation email
    sendOrderConfirmationEmail(
      req.user.email, 
      req.user.fullname || 'Customer', 
      order._id.toString().slice(-8).toUpperCase(), 
      {
        items: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress
      }
    ).catch(err => console.log('Order confirmation email failed:', err.message));

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single order
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('user', 'fullname email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user (unless admin)
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel order (user)
app.put('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Can only cancel if processing or confirmed
    const status = order.status?.toLowerCase();
    if (status !== 'processing' && status !== 'confirmed') {
      return res.status(400).json({ message: 'Cannot cancel order that has already been shipped' });
    }
    
    order.status = 'cancelled';
    await order.save();
    
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request return (user)
app.put('/api/orders/:id/return', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Can only return if shipped or delivered
    const status = order.status?.toLowerCase();
    if (status !== 'shipped' && status !== 'delivered') {
      return res.status(400).json({ message: 'Can only return shipped or delivered orders' });
    }
    
    order.status = 'return requested';
    await order.save();
    
    res.json({ message: 'Return request submitted successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Track order by order number (public - no auth required)
app.get('/api/orders/track/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.product')
      .select('-user');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all orders
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    let orders = [];
    let total = 0;

    if (useInMemory) {
      // In-memory mode
      let allOrders = global.__INMEM__.orders || [];
      
      // Filter by status if provided
      if (status && status !== 'all') {
        allOrders = allOrders.filter(o => o.status === status);
      }
      
      // Sort by createdAt descending
      allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      total = allOrders.length;
      
      // Paginate
      const skip = (parseInt(page) - 1) * parseInt(limit);
      orders = allOrders.slice(skip, skip + parseInt(limit));
      
      // Populate user info from in-memory users
      orders = orders.map(order => {
        const orderObj = { ...order };
        if (order.user) {
          const user = global.__INMEM__.users.find(u => u._id === order.user || u._id?.toString() === order.user?.toString());
          if (user) {
            orderObj.user = { _id: user._id, fullname: user.fullname, email: user.email, phone: user.phone };
          }
        }
        return orderObj;
      });
    } else {
      // MongoDB mode
      let query = {};
      if (status && status !== 'all') {
        query.status = status;
      }

      orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .populate('user', 'fullname email phone')
        .populate('items.product');

      total = await Order.countDocuments(query);
    }

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Update order status and tracking
app.put('/api/admin/orders/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, tracking, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'email fullname');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;

    // Update status
    if (status) {
      order.status = status;
      
      // Auto-add timeline entry
      const timelineEntry = {
        status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        date: new Date(),
        location: tracking?.currentLocation || order.tracking?.currentLocation || 'Atlas Arrow Warehouse',
        description: getStatusDescription(status),
        completed: true
      };
      
      if (!order.tracking) {
        order.tracking = { timeline: [] };
      }
      if (!order.tracking.timeline) {
        order.tracking.timeline = [];
      }
      order.tracking.timeline.push(timelineEntry);
    }

    // Update tracking info
    if (tracking) {
      if (tracking.carrier) order.tracking.carrier = tracking.carrier;
      if (tracking.trackingNumber) order.tracking.trackingNumber = tracking.trackingNumber;
      if (tracking.currentLocation) order.tracking.currentLocation = tracking.currentLocation;
      if (tracking.estimatedDelivery) order.tracking.estimatedDelivery = tracking.estimatedDelivery;
    }

    // Update payment status
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    order.updatedAt = new Date();
    await order.save();

    // Send email notification if status changed
    if (status && status !== previousStatus && order.user) {
      const userEmail = order.user.email || order.user;
      const userName = order.user.fullname || 'Customer';
      
      // Get user email if order.user is just an ID
      let emailToSend = userEmail;
      let nameToSend = userName;
      
      if (typeof order.user === 'string' || !order.user.email) {
        try {
          const userDoc = await User.findById(order.user);
          if (userDoc) {
            emailToSend = userDoc.email;
            nameToSend = userDoc.fullname;
          }
        } catch (e) {
          console.log('Could not fetch user for email');
        }
      }
      
      // Send email notification asynchronously
      sendOrderStatusEmail(emailToSend, nameToSend, order._id.toString().slice(-8).toUpperCase(), status, {
        tracking: order.tracking
      }).catch(err => console.log('Email send failed:', err.message));
    }

    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function for status descriptions
function getStatusDescription(status) {
  const descriptions = {
    'processing': 'Your order is being prepared',
    'confirmed': 'Your order has been confirmed',
    'shipped': 'Your order has been shipped and is on the way',
    'out_for_delivery': 'Your order is out for delivery',
    'delivered': 'Your order has been delivered',
    'cancelled': 'Your order has been cancelled'
  };
  return descriptions[status] || 'Order status updated';
}

// ==================== USER PROFILE ====================

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { fullname, phone, address } = req.body;
    const updateData = {};
    
    if (fullname) updateData.fullname = fullname;
    if (phone) updateData.phone = phone;
    if (address) {
      // Handle address as object or string
      if (typeof address === 'string') {
        updateData.address = { street: address };
      } else {
        updateData.address = address;
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload avatar
app.post('/api/profile/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Use full URL for avatar
    // Use relative path that works with the static middleware
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Avatar uploaded successfully', avatar: avatarUrl, user });
  } catch (error) {
    console.error('Avatar upload error:', error);
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== REVIEWS ENDPOINTS ====================

// Get all reviews (for admin)
app.get('/api/reviews', async (req, res) => {
  try {
    // Check if we have a Review model
    if (typeof Review !== 'undefined') {
      const reviews = await Review.find()
        .populate('user', 'fullname email')
        .populate('product', 'name images')
        .sort({ createdAt: -1 });
      return res.json(reviews);
    }
    
    // If no Review model, return empty array (reviews stored in products)
    const products = await Product.find({ 'reviews.0': { $exists: true } });
    const allReviews = [];
    
    products.forEach(product => {
      (product.reviews || []).forEach(review => {
        allReviews.push({
          _id: review._id,
          productId: product._id,
          productName: product.name,
          productImage: product.images?.[0],
          userName: review.userName || 'Anonymous',
          userEmail: review.userEmail || '',
          rating: review.rating,
          title: review.title || '',
          comment: review.comment || review.text,
          createdAt: review.createdAt || product.createdAt,
          status: review.status || 'approved',
          helpful: review.helpful || 0,
          reply: review.reply || null
        });
      });
    });
    
    res.json(allReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.json([]); // Return empty array on error
  }
});

// Get reviews for a specific product
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const reviews = product.reviews || [];
    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// ============ WISHLIST ROUTES ============

// Get user wishlist
app.get('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.wishlist || []);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
});

// Add to wishlist
app.post('/api/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Initialize wishlist if not exists
    if (!user.wishlist) {
      user.wishlist = [];
    }
    
    // Check if already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }
    
    user.wishlist.push(productId);
    await user.save();
    
    res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Error adding to wishlist' });
  }
});

// Remove from wishlist
app.delete('/api/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.wishlist = (user.wishlist || []).filter(id => id.toString() !== productId);
    await user.save();
    
    res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Error removing from wishlist' });
  }
});

// Clear entire wishlist
app.delete('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.wishlist = [];
    await user.save();
    
    res.json({ message: 'Wishlist cleared' });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({ message: 'Error clearing wishlist' });
  }
});

// Toggle wishlist (add if not present, remove if present)
app.post('/api/wishlist/toggle/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (!user.wishlist) {
      user.wishlist = [];
    }
    
    const index = user.wishlist.findIndex(id => id.toString() === productId);
    let added = false;
    
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
      added = true;
    }
    
    await user.save();
    
    res.json({ 
      message: added ? 'Added to wishlist' : 'Removed from wishlist',
      added,
      wishlist: user.wishlist 
    });
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ message: 'Error updating wishlist' });
  }
});

// Add a review to a product
app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Get user details for the review
    const user = await User.findById(req.user.id);
    const userName = user?.fullname || 'Customer';
    const userEmail = user?.email || req.user.email;
    
    const review = {
      user: req.user.id,
      userName: userName,
      userEmail: userEmail,
      rating: parseInt(rating),
      title: title || '',
      comment,
      createdAt: new Date(),
      status: 'approved',
      helpful: 0
    };
    
    if (!product.reviews) {
      product.reviews = [];
    }
    
    product.reviews.push(review);
    
    // Update product rating
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = (totalRating / product.reviews.length).toFixed(1);
    
    await product.save();
    
    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Failed to add review' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Atlas & Arrow API is running' });
});

// Admin routes
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get all users with essential information
    const users = await User.find({}, {
      password: 0 // Exclude password from results
    }).sort({ createdAt: -1 });

    // Get order stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject ? user.toObject() : user;
      
      // Get order count and total spent
      let orderCount = 0;
      let totalSpent = 0;
      
      try {
        if (useInMemory) {
          const userOrders = (global.__INMEM__.orders || []).filter(o => o.user?.toString() === userObj._id?.toString());
          orderCount = userOrders.length;
          totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        } else {
          const orders = await Order.find({ user: userObj._id });
          orderCount = orders.length;
          totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        }
      } catch (err) {
        console.error('Error getting user orders:', err);
      }
      
      return {
        ...userObj,
        orderCount,
        totalSpent
      };
    }));

    res.json({
      success: true,
      users: usersWithStats,
      total: usersWithStats.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ==================== ADMIN PRODUCT ENDPOINTS ====================

// Get all products (admin)
app.get('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products, total: products.length });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// Create product (admin)
app.post('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, category, price, originalPrice, stock, brand, warranty, featured, specifications, features, images } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const product = await Product.create({
      name,
      description: description || '',
      category: category || 'Uncategorized',
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      stock: parseInt(stock) || 0,
      brand: brand || '',
      warranty: warranty || '',
      featured: featured || false,
      specifications: specifications || [],
      features: features || [],
      images: images || [],
      rating: 0,
      reviews: [],
      sold: 0,
      status: 'active'
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// Update product (admin)
app.put('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// Delete product (admin)
app.delete('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// Demo endpoint for admin (no auth required for testing)
app.get('/api/admin/users-demo', async (req, res) => {
  try {
    // Get all users with essential information
    const users = await User.find({}, {
      password: 0 // Exclude password from results
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      users: users,
      total: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ==================== CONTACT MESSAGE ENDPOINTS ====================

// Submit a contact message (public - no auth required)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, subject, message, inquiry_type } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, subject, and message are required' });
    }

    // Create contact message
    let contactMessage;
    if (useInMemory) {
      contactMessage = {
        _id: genId(),
        name,
        email,
        phone: phone || '',
        company: company || '',
        subject,
        message,
        inquiryType: inquiry_type || 'general',
        status: 'new',
        createdAt: new Date()
      };
      global.__INMEM__.contactMessages.push(contactMessage);
    } else {
      contactMessage = new ContactMessage({
        name,
        email,
        phone,
        company,
        subject,
        message,
        inquiryType: inquiry_type || 'general'
      });
      await contactMessage.save();
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you within 24 hours.',
      data: contactMessage
    });
  } catch (error) {
    console.error('Error submitting contact message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
});

// Get all contact messages (admin only)
app.get('/api/admin/messages', async (req, res) => {
  try {
    let messages;
    if (useInMemory) {
      messages = global.__INMEM__.contactMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      messages = await ContactMessage.find().sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      messages,
      total: messages.length,
      unread: messages.filter(m => m.status === 'new').length
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Update message status (admin only)
app.put('/api/admin/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    let updatedMessage;
    if (useInMemory) {
      const messages = global.__INMEM__.contactMessages;
      const message = messages.find(m => m._id === id);
      if (!message) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }
      if (status) message.status = status;
      if (adminNotes !== undefined) message.adminNotes = adminNotes;
      updatedMessage = message;
    } else {
      updatedMessage = await ContactMessage.findByIdAndUpdate(
        id,
        { status, adminNotes },
        { new: true }
      );
      if (!updatedMessage) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }
    }

    res.json({ success: true, message: updatedMessage });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ success: false, message: 'Failed to update message' });
  }
});

// Delete message (admin only)
app.delete('/api/admin/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (useInMemory) {
      const messages = global.__INMEM__.contactMessages;
      const index = messages.findIndex(m => m._id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }
      messages.splice(index, 1);
    } else {
      const deleted = await ContactMessage.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }
    }

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
});

// Force seed products endpoint
app.post('/api/seed-products', async (req, res) => {
  try {
    // Clear existing products and re-seed
    await Product.deleteMany({});
    await initializeDatabase();
    const count = await Product.countDocuments();
    res.json({ success: true, message: `Database seeded with ${count} products` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin settings endpoints
app.put('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    // Settings are stored on client-side (localStorage) for now
    // This endpoint acknowledges the save request
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send notification to users (admin only)
app.post('/api/admin/notifications/send', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { subject, message, recipients } = req.body;
    
    // Create notifications for each recipient
    if (recipients && recipients.length > 0) {
      const notifications = recipients.map(userId => ({
        user: userId,
        type: 'admin',
        title: subject,
        message: message,
        read: false
      }));
      
      await Notification.insertMany(notifications);
      console.log(`📧 Notification sent: "${subject}" to ${recipients.length} recipients`);
    }
    
    res.json({ 
      success: true, 
      message: `Notification sent to ${recipients?.length || 0} users`,
      queued: recipients?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all notifications
app.delete('/api/notifications', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user endpoint for admin
app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user endpoint for admin
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
const serverInstance = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    const addr = serverInstance.address();
    console.log('Server address info:', addr);
  } catch (err) {
    console.error('Could not read server.address():', err && err.stack ? err.stack : err);
  }
});

// Opportunites endpoint (some front-end expectations / legacy routes)
app.get('/api/opportunities', async (req, res) => {
  try {
    // Return some sample opportunities — compatible with both DB and in-memory modes
    const opportunities = [
      { 
        id: 1, 
        title: 'Become a Distributor', 
        description: 'Open channels in your city and earn commissions.',
        required_skills: 'Sales & Marketing',
        location: 'Pan India',
        date_start: new Date().toISOString()
      },
      { 
        id: 2, 
        title: 'Sales Partnership', 
        description: 'Work with our sales team on enterprise deployments.',
        required_skills: 'Business Development',
        location: 'Mumbai, Delhi, Bangalore',
        date_start: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Technical Support Specialist',
        description: 'Provide technical support for our biometric devices and GPS trackers.',
        required_skills: 'Technical Support, Customer Service',
        location: 'Remote',
        date_start: new Date().toISOString()
      }
    ];

    if (!useInMemory) {
      // If we had a proper Opportunities model in Mongo this is where we'd fetch from DB.
      // For now return the sample list so older front-end routes don't fail.
      return res.json(opportunities);
    }

    // in-memory demo — same sample set
    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Apply for opportunity endpoint
app.post('/api/apply', authenticateToken, async (req, res) => {
  try {
    const { opportunity_id } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In a real application, you would save the application to a database
    // For now, just return a success message
    res.json({ 
      message: 'Application submitted successfully! We will contact you soon.',
      opportunity_id,
      user: {
        id: user._id,
        name: user.fullname,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
