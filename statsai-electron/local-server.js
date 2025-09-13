#!/usr/bin/env node

/**
 * Local Development Server - Emulates IoNOS Deployment
 * Serves the same files that are deployed to IoNOS hosting
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

class LocalDeploymentServer {
    constructor() {
        this.app = express();
        this.port = 3000;
        this.deploymentPath = './local-deployment';
        
        console.log('🚀 Local Deployment Server');
        console.log('==========================');
        console.log('📁 Serving from:', this.deploymentPath);
        console.log('🌐 Emulating IoNOS deployment structure');
    }

    setupMiddleware() {
        // Enable CORS for all requests
        this.app.use(cors());
        
        // Serve static files from local-deployment directory
        this.app.use(express.static(this.deploymentPath, {
            extensions: ['html'], // Allow accessing .html files without extension
            index: ['index.html']
        }));
        
        // Handle SPA routing - redirect unknown routes to index.html
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, this.deploymentPath, 'index.html'));
        });
    }

    start() {
        this.setupMiddleware();
        
        this.app.listen(this.port, () => {
            console.log('✅ Local deployment server started successfully!');
            console.log('');
            console.log('📋 Available Pages:');
            console.log(`  • Homepage: http://localhost:${this.port}/`);
            console.log(`  • Email Assistant: http://localhost:${this.port}/email-assistant.html`);
            console.log(`  • Dashboard: http://localhost:${this.port}/dashboard.html`);
            console.log(`  • Pricing: http://localhost:${this.port}/pricing.html`);
            console.log(`  • Specialized Search: http://localhost:${this.port}/specialized-search.html`);
            console.log(`  • Functional Search: http://localhost:${this.port}/functional-search.html`);
            console.log('');
            console.log('✨ Features Available:');
            console.log('  • Exact same files as IoNOS deployment');
            console.log('  • Microsoft OAuth integration (via GCP backend)');
            console.log('  • Aura design with glass-morphism effects');
            console.log('  • Real-time email assistant functionality');
            console.log('');
            console.log('🔄 Development Notes:');
            console.log('  • Files served from local-deployment/ directory');
            console.log('  • OAuth backend still runs on Google Cloud Functions');
            console.log('  • Hot reload: restart server after file changes');
            console.log('  • CORS enabled for local development');
            console.log('');
            console.log('⚡ Press Ctrl+C to stop server');
        });
    }
}

// Start server if run directly
if (require.main === module) {
    const server = new LocalDeploymentServer();
    server.start();
}

module.exports = LocalDeploymentServer;