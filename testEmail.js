require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

console.log('Testing email with:', process.env.EMAIL_USER);

transporter.verify((err, success) => {
  if (err) {
    console.log('Email config error:', err.message);
  } else {
    console.log('Email server is ready!');
    
    // Send a test email
    transporter.sendMail({
      from: `"Atlas & Arrow" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'Test Email - Atlas & Arrow',
      text: 'This is a test email. If you received this, email is working!'
    }, (error, info) => {
      if (error) {
        console.log('Failed to send test email:', error.message);
      } else {
        console.log('Test email sent successfully!');
      }
      process.exit();
    });
  }
});
