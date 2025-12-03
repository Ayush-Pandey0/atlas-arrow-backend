const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://ayushpandey23_db_user:ayush123@cluster0.kanyaon.mongodb.net/atlasarrow?retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({
  fullname: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role: { type: String, default: 'customer' }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({ role: 'admin' });
    console.log('Deleted old admin accounts');

    const hashedPassword = await bcrypt.hash('arrow123', 10);
    const admin = await User.create({
      fullname: 'Admin User',
      email: 'admin@atlas.com',
      phone: '9999999999',
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('Admin created:', admin.email);
    
    const found = await User.findOne({ email: 'admin@atlas.com' });
    console.log('Verified:', found ? 'YES' : 'NO', 'Role:', found?.role);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
createAdmin();
