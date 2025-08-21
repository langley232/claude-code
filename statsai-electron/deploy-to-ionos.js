#!/usr/bin/env node

/**
 * IONOS SFTP Deployment Script for AtlasWeb
 * Deploys the AtlasWeb project to IONOS hosting via SFTP
 */

const Client = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

class IONOSDeployer {
    constructor() {
        this.sftp = new Client();
        this.config = {
            host: process.env.IONOS_FTP_HOST || 'access-5018455313.webspace-host.com',
            port: process.env.IONOS_FTP_PORT || 22,
            username: process.env.IONOS_FTP_USER || 'a1994279',
            password: process.env.IONOS_FTP_PASSWORD
        };
        this.localPath = './src';
        this.remotePath = '/';
        
        console.log('🚀 AtlasWeb IONOS Deployment Tool');
        console.log('==================================');
    }

    // Validate configuration
    validateConfig() {
        console.log('🔧 Validating configuration...');
        
        if (!this.config.password) {
            console.error('❌ IONOS_FTP_PASSWORD not found in environment variables');
            process.exit(1);
        }
        
        if (!fs.existsSync(this.localPath)) {
            console.error('❌ Source directory ./src not found');
            process.exit(1);
        }
        
        console.log('✅ Configuration validated');
        console.log(`📡 Host: ${this.config.host}`);
        console.log(`👤 User: ${this.config.username}`);
        console.log(`📁 Local: ${this.localPath}`);
        console.log(`📂 Remote: ${this.remotePath}`);
    }

    // Connect to IONOS SFTP
    async connect() {
        console.log('🔌 Connecting to IONOS SFTP...');
        
        try {
            await this.sftp.connect(this.config);
            console.log('✅ Connected to IONOS successfully');
        } catch (error) {
            console.error('❌ SFTP connection failed:', error.message);
            throw error;
        }
    }

    // Get list of files to upload
    getFilesToUpload() {
        console.log('📋 Scanning files to upload...');
        
        const files = [];
        const scanDir = (dir, baseDir = '') => {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relativePath = path.join(baseDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDir(fullPath, relativePath);
                } else {
                    files.push({
                        local: fullPath,
                        remote: '/' + relativePath.replace(/\\/g, '/'),
                        size: stat.size
                    });
                }
            }
        };
        
        scanDir(this.localPath);
        
        console.log(`📊 Found ${files.length} files to upload`);
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        console.log(`💾 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
        
        return files;
    }

    // Upload files to IONOS
    async uploadFiles(files) {
        console.log('📤 Starting file upload...');
        
        let uploaded = 0;
        const total = files.length;
        
        for (const file of files) {
            try {
                // Create directory if it doesn't exist
                const remoteDir = path.dirname(file.remote);
                if (remoteDir !== '/' && remoteDir !== '.') {
                    try {
                        await this.sftp.mkdir(remoteDir, true);
                    } catch (error) {
                        // Directory might already exist, ignore
                    }
                }
                
                // Upload file
                await this.sftp.put(file.local, file.remote);
                uploaded++;
                
                const progress = Math.round((uploaded / total) * 100);
                console.log(`✅ [${progress}%] ${file.remote} (${(file.size / 1024).toFixed(2)} KB)`);
                
            } catch (error) {
                console.error(`❌ Failed to upload ${file.remote}:`, error.message);
            }
        }
        
        console.log(`🎉 Upload complete! ${uploaded}/${total} files uploaded`);
    }

    // Verify deployment
    async verifyDeployment() {
        console.log('🔍 Verifying deployment...');
        
        try {
            // Check if index.html exists
            const indexExists = await this.sftp.exists('/index.html');
            if (indexExists) {
                console.log('✅ index.html found on server');
            } else {
                console.log('⚠️  index.html not found on server');
            }
            
            // List files in root directory
            const files = await this.sftp.list('/');
            console.log(`📁 Files in root directory: ${files.length}`);
            
            // Show key files
            const keyFiles = ['index.html', 'styles.css', 'script.js', 'pricing.html'];
            for (const file of keyFiles) {
                const exists = files.some(f => f.name === file);
                console.log(`${exists ? '✅' : '❌'} ${file}`);
            }
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
        }
    }

    // Disconnect from SFTP
    async disconnect() {
        console.log('🔌 Disconnecting from SFTP...');
        await this.sftp.end();
        console.log('✅ Disconnected');
    }

    // Generate deployment summary
    generateSummary() {
        console.log('\\n🎉 Deployment Summary');
        console.log('===================');
        console.log('📦 Project: AtlasWeb');
        console.log('🌐 Domain: atlasweb.info (configure DNS)');
        console.log('📡 Host: IONOS Web Hosting');
        console.log('📂 Deployment: SFTP Upload Complete');
        
        console.log('\\n📋 Available Pages:');
        console.log('  • Home: https://atlasweb.info/');
        console.log('  • Pricing: https://atlasweb.info/pricing.html');
        console.log('  • Specialized Search: https://atlasweb.info/specialized-search.html');
        console.log('  • Functional Search: https://atlasweb.info/functional-search.html');
        console.log('  • Email Assistant: https://atlasweb.info/email-assistant.html');
        
        console.log('\\n✨ Features Deployed:');
        console.log('  • Aura design theme with glass-morphism');
        console.log('  • Responsive navigation and layouts');
        console.log('  • Professional investor-ready interface');
        console.log('  • Google One AI Premium features showcase');
        console.log('  • Multi-tier pricing display');
        
        console.log('\\n🔄 Next Steps:');
        console.log('  1. Configure DNS to point atlasweb.info to IONOS');
        console.log('  2. Verify SSL certificate is active');
        console.log('  3. Test all pages and functionality');
        console.log('  4. Set up domain redirects (www to non-www)');
        console.log('  5. Configure caching and performance optimization');
    }

    // Main deployment process
    async deploy() {
        try {
            this.validateConfig();
            await this.connect();
            
            const files = this.getFilesToUpload();
            await this.uploadFiles(files);
            await this.verifyDeployment();
            
            this.generateSummary();
            
        } catch (error) {
            console.error('💥 Deployment failed:', error.message);
            process.exit(1);
        } finally {
            await this.disconnect();
        }
    }
}

// Run deployment if script is executed directly
if (require.main === module) {
    const deployer = new IONOSDeployer();
    deployer.deploy();
}

module.exports = IONOSDeployer;