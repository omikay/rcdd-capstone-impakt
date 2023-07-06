// utils/email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.MAILER_SERVICE_USER,
    pass: process.env.MAILER_SERVICE_PASS,
  },
});

// Function to send an email
const sendEmail = async (recepient, sub, msgBody) => {
  try {
    // Define the email options
    const mailOptions = {
      from: process.env.MAILER_SERVICE_USER,
      to: recepient,
      subject: sub,
      text: msgBody,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
