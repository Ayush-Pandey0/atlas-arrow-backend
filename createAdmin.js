const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb+srv://ayushpandey23_db_user:ayush123@cluster0.kanyaon.mongodb.net/atlas_arrow?retryWrites=true&w=majority');

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  avatar: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createOrUpdateAdmin() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    
    // Try to find existing admin
    let admin = await User.findOne({ email: 'admin@atlasarrow.com' });
    
    if (admin) {
      // Update existing admin
      admin.password = hashedPassword;
      admin.role = 'admin';
      await admin.save();
      console.log('✅ Admin password updated successfully!');
    } else {
      // Create new admin
      admin = new User({
        name: 'Admin',
        email: 'admin@atlasarrow.com',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('📧 Email: admin@atlasarrow.com');
    console.log('🔑 Password: admin@123');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

createOrUpdateAdmin();
