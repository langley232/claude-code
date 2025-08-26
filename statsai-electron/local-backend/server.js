const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080']
}));
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Local backend is working!' });
});

// Test email endpoint
app.post('/test-email', async (req, res) => {
  try {
    console.log('📧 Attempting to send test email...');
    
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 2525,
      secure: false,
      auth: {
        user: 'test@atlasweb.info',
        pass: 'testpassword'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: '"AtlasWeb AI" <test@atlasweb.info>',
      to: req.body.email,
      subject: 'Test Email',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify SMTP is working!</p>
        <p>Email: ${req.body.email}</p>
        <p>Time: ${new Date().toISOString()}</p>
      `
    });

    console.log('✅ Email sent successfully:', info.messageId);
    res.json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('❌ Email send failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Local backend running on http://localhost:${PORT}`);
  console.log('📧 Test email: POST http://localhost:3000/test-email');
});