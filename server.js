import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, error: 'Missing required form fields.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.EMAIL_TO || 'bshuaibsalim787@gmail.com';
  const fromEmail = process.env.EMAIL_FROM || 'Shuaib Bandeally <onboarding@resend.dev>';

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Missing RESEND_API_KEY. Add it to your .env file.'
    });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `Website inquiry: ${subject}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.message || 'Failed to send email through Resend.'
      });
    }

    return res.json({ success: true, id: data.id });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while sending email.'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
