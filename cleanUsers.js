const mongoose = require('mongoose');
require('dotenv').config();

async function cleanUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Delete all non-admin users
    const result = await mongoose.connection.db.collection('users').deleteMany({ 
      role: { $ne: 'admin' } 
    });
    
    console.log(`Deleted ${result.deletedCount} non-admin users`);
    
    // Show remaining users
    const remaining = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Remaining users:', remaining.map(u => ({ email: u.email, role: u.role })));
    
    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanUsers();
