const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables from server root or project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pledgetrack';

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for admin seeding...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pledgetrack.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`Admin user already exists with email: ${adminEmail}`);
      admin.role = 'admin';
      admin.name = adminName;
      admin.password = adminPassword; // Pre-save hook will hash this
      await admin.save();
      console.log(`Admin user updated successfully.`);
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      console.log(`Admin user created successfully with email: ${adminEmail}`);
    }

    console.log('--- Admin Account Details ---');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role:     admin`);
    console.log('-----------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
