#!/usr/bin/env node

/**
 * AtlasWeb Vercel Deployment Script
 * Automated deployment script for the statsai-electron project to Vercel
 * Works with Vercel MCP server for Claude Code integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VercelDeployer {
    constructor() {
        this.projectName = 'atlasweb';
        this.domain = 'atlasweb.info';
        this.sourceDir = './src';
        
        console.log('🚀 AtlasWeb Vercel Deployment Tool');
        console.log('=====================================');
    }

    // Check if required files exist
    validateProject() {
        console.log('📋 Validating project structure...');
        
        const requiredFiles = [
            'src/index.html',
            'src/functional-search.html', 
            'src/specialized-search.html',
            'src/styles.css',
            'src/script.js',
            'src/functional-search.js',
            'vercel.json'
        ];

        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
        
        if (missingFiles.length > 0) {
            console.error('❌ Missing required files:', missingFiles);
            process.exit(1);
        }
        
        console.log('✅ All required files present');
    }

    // Check if Vercel CLI is installed
    checkVercelCLI() {
        console.log('🔧 Checking Vercel CLI...');
        
        try {
            execSync('vercel --version', { stdio: 'pipe' });
            console.log('✅ Vercel CLI is installed');
        } catch (error) {
            console.log('📦 Installing Vercel CLI...');
            execSync('npm install -g vercel', { stdio: 'inherit' });
        }
    }

    // Login to Vercel if not already logged in
    ensureAuth() {
        console.log('🔐 Checking Vercel authentication...');
        
        try {
            execSync('vercel whoami', { stdio: 'pipe' });
            console.log('✅ Already authenticated with Vercel');
        } catch (error) {
            console.log('🔑 Please authenticate with Vercel...');
            execSync('vercel login', { stdio: 'inherit' });
        }
    }

    // Deploy to Vercel
    deploy(isProduction = false) {
        console.log(`🚀 Deploying to Vercel ${isProduction ? '(Production)' : '(Preview)'}...`);
        
        try {
            const deployCommand = isProduction ? 'vercel --prod' : 'vercel';
            const result = execSync(deployCommand, { 
                stdio: 'pipe',
                encoding: 'utf8'
            });
            
            console.log('✅ Deployment successful!');
            console.log('📍 Deployment URL:', result.trim());
            
            return result.trim();
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            process.exit(1);
        }
    }

    // Set up custom domain
    setupDomain() {
        console.log('🌐 Setting up custom domain...');
        
        try {
            // Add domain to project
            execSync(`vercel domains add ${this.domain}`, { stdio: 'inherit' });
            console.log(`✅ Domain ${this.domain} added successfully`);
        } catch (error) {
            console.log('⚠️  Domain may already be configured or requires DNS setup');
        }
    }

    // Set environment variables
    setEnvironmentVariables() {
        console.log('🔧 Setting up environment variables...');
        
        const envVars = {
            'NODE_ENV': 'production',
            'VERCEL_PROJECT_NAME': this.projectName
        };
        
        Object.entries(envVars).forEach(([key, value]) => {
            try {
                execSync(`vercel env add ${key} production`, { 
                    input: value,
                    stdio: ['pipe', 'inherit', 'inherit']
                });
                console.log(`✅ Set ${key}`);
            } catch (error) {
                console.log(`⚠️  ${key} may already be set`);
            }
        });
    }

    // Generate deployment summary
    generateSummary(deploymentUrl) {
        console.log('\n🎉 Deployment Summary');
        console.log('====================');
        console.log(`📦 Project: ${this.projectName}`);
        console.log(`🌐 Domain: ${this.domain}`);
        console.log(`🔗 Deployment URL: ${deploymentUrl}`);
        console.log(`📂 Source Directory: ${this.sourceDir}`);
        
        console.log('\n📋 Available Pages:');
        console.log('  • Home: /');
        console.log('  • Functional Search: /functional-search');
        console.log('  • Specialized Search: /specialized-search');
        console.log('  • Pricing: /pricing');
        
        console.log('\n✨ Features Deployed:');
        console.log('  • Google One AI Premium interface');
        console.log('  • Functional search with 6 feature tabs');
        console.log('  • Gemini-inspired design system');
        console.log('  • Responsive layout with animations');
        console.log('  • GSAP character animations');
        
        console.log('\n🔄 Next Steps:');
        console.log('  1. Configure DNS for atlasweb.info to point to Vercel');
        console.log('  2. Set up SSL certificate (automatic with Vercel)');
        console.log('  3. Configure Google Cloud Platform backend APIs');
        console.log('  4. Test all features and navigation flows');
    }

    // Main deployment flow
    async run() {
        try {
            // Pre-deployment checks
            this.validateProject();
            this.checkVercelCLI();
            this.ensureAuth();
            
            // Get deployment type from command line argument
            const isProduction = process.argv.includes('--production') || process.argv.includes('--prod');
            
            // Deploy
            const deploymentUrl = this.deploy(isProduction);
            
            // Post-deployment setup (only for production)
            if (isProduction) {
                this.setupDomain();
                this.setEnvironmentVariables();
            }
            
            // Summary
            this.generateSummary(deploymentUrl);
            
        } catch (error) {
            console.error('💥 Deployment process failed:', error.message);
            process.exit(1);
        }
    }
}

// Run deployment if this script is executed directly
if (require.main === module) {
    const deployer = new VercelDeployer();
    deployer.run();
}

module.exports = VercelDeployer;