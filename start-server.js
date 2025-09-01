const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from statsai-electron/src directory
app.use(express.static(path.join(__dirname, 'statsai-electron', 'src')));

// Specific route for email-assistant.html
app.get('/email-assistant.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'statsai-electron', 'src', 'email-assistant.html'));
});

// Root route redirects to email assistant
app.get('/', (req, res) => {
    res.redirect('/email-assistant.html');
});

app.listen(port, () => {
    console.log(`🚀 Email Assistant server running at http://localhost:${port}`);
    console.log(`📧 Email Assistant: http://localhost:${port}/email-assistant.html`);
});