const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

// Create emails directory if it doesn't exist
const emailsDir = path.join(__dirname, 'emails');
if (!fs.existsSync(emailsDir)) {
    fs.mkdirSync(emailsDir);
}

const server = new SMTPServer({
    // Allow all connections
    secure: false,
    authOptional: true,
    
    onConnect(session, callback) {
        console.log(`📧 New connection from ${session.remoteAddress}`);
        return callback();
    },
    
    onAuth(auth, session, callback) {
        console.log(`🔑 Auth attempt: ${auth.username}`);
        // Accept any authentication for testing
        return callback(null, { user: auth.username });
    },
    
    onData(stream, session, callback) {
        console.log('📨 Receiving email...');
        
        let rawEmail = '';
        stream.on('data', chunk => {
            rawEmail += chunk;
        });
        
        stream.on('end', async () => {
            try {
                // Parse the email
                const parsed = await simpleParser(rawEmail);
                
                console.log('📧 Email received:');
                console.log(`From: ${parsed.from?.text}`);
                console.log(`To: ${parsed.to?.text}`);
                console.log(`Subject: ${parsed.subject}`);
                console.log(`Text: ${parsed.text}`);
                console.log(`HTML: ${parsed.html ? 'Has HTML content' : 'No HTML'}`);
                console.log('---');
                
                // Save email to file
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `email-${timestamp}.json`;
                const emailData = {
                    timestamp: new Date().toISOString(),
                    from: parsed.from?.text,
                    to: parsed.to?.text,
                    subject: parsed.subject,
                    text: parsed.text,
                    html: parsed.html,
                    raw: rawEmail
                };
                
                fs.writeFileSync(
                    path.join(emailsDir, filename), 
                    JSON.stringify(emailData, null, 2)
                );
                
                console.log(`💾 Email saved to ${filename}`);
                
                callback();
            } catch (error) {
                console.error('❌ Error parsing email:', error);
                callback(error);
            }
        });
    }
});

server.on('error', err => {
    console.error('❌ SMTP Server error:', err);
});

const PORT = 2525;
server.listen(PORT, () => {
    console.log(`🚀 SMTP Server running on port ${PORT}`);
    console.log(`📧 Emails will be saved to: ${emailsDir}`);
    console.log('');
    console.log('📋 SMTP Settings for your app:');
    console.log(`   Host: localhost`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Security: None (no TLS/SSL)`);
    console.log(`   Auth: Any username/password accepted`);
});