const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testEmail() {
  console.log('=== Email Configuration Test ===\n');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '(not set)');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `Set (${process.env.EMAIL_PASS.length} chars)` : '(not set)');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials not configured in .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  console.log('Testing connection...');
  
  try {
    await transporter.verify();
    console.log('✅ Email server connection successful!\n');

    // Send a test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Atlas & Arrow" <${process.env.EMAIL_USER}>`,
      to: 'ayushpandeyaa22@gmail.com', // Send to your email
      subject: '🎉 Test Email - Atlas & Arrow',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #3B82F6;">Test Email Successful!</h1>
          <p>If you're seeing this, your email configuration is working correctly.</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 The App Password might be incorrect or expired.');
      console.log('   Generate a new one at: https://myaccount.google.com/apppasswords');
    }
  }
}

testEmail();
