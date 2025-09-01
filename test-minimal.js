const functions = require('@google-cloud/functions-framework');
const cors = require('cors')({origin: true});

// Simple test function to verify CORS and basic deployment
functions.http('emailFetcher', (req, res) => {
    // Set CORS headers manually as backup
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    
    console.log('📧 Email Fetcher test triggered:', { method: req.method, body: req.body });
    
    // Simple response for now
    res.status(200).json({
        message: 'Email Fetcher is working',
        timestamp: new Date().toISOString(),
        method: req.method,
        hasBody: !!req.body
    });
});