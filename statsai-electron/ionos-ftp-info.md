# IONOS Web Space Deployment Information

## 🌐 AtlasWeb Production Deployment to IONOS

This document contains the deployment information for deploying AtlasWeb to IONOS web hosting with the custom domain `atlasweb.info`.

## 📋 SFTP Connection Details

| Field | Value |
|-------|--------|
| **Server/Host** | `access-5018455313.webspace-host.com` |
| **Port** | `22` |
| **Protocol** | `SFTP` |
| **Username** | `a1994279` |
| **Password** | `${IONOS_FTP_PASSWORD}` (stored in .env) |
| **Directory** | `/` (root directory) |
| **Usage** | 1 of 200 users used |

## 🚀 Deployment Strategy

### Option 1: Manual SFTP Upload
```bash
# Connect via SFTP
sftp -P 22 a1994279@access-5018455313.webspace-host.com

# Upload files
put -r src/* /
```

### Option 2: Automated Deployment Script
```bash
# Run deployment script
npm run deploy:ionos
```

### Option 3: FTP Client (Recommended)
- **Client**: FileZilla, WinSCP, or Cyberduck
- **Host**: `access-5018455313.webspace-host.com`
- **Port**: `22`
- **Protocol**: `SFTP`
- **Username**: `a1994279`
- **Password**: See `.env` file

## 📁 File Structure for Upload

Upload contents of `/src/` directory to IONOS root:
```
/ (IONOS root)
├── index.html
├── styles.css
├── script.js
├── functional-search.html
├── functional-search.js
├── specialized-search.html
├── pricing.html
├── pricing.js
├── email-assistant.html
├── email-assistant.css
├── email-assistant.js
├── registration.html
├── registration.js
└── data/
    └── mock-emails.json
```

## 🔧 Environment Configuration

**Environment Variables Required:**
```bash
IONOS_FTP_HOST=access-5018455313.webspace-host.com
IONOS_FTP_PORT=22
IONOS_FTP_USER=a1994279
IONOS_FTP_PASSWORD=Mabus23224676@
```

## 📝 Post-Deployment Checklist

After uploading to IONOS:

### ✅ **Testing Checklist**
- [ ] Visit `https://atlasweb.info` (main domain)
- [ ] Test navigation: Home, Features, Pricing
- [ ] Verify all pages load correctly
- [ ] Test button functionality
- [ ] Check responsive design
- [ ] Validate forms and interactivity

### ✅ **URL Structure Verification**
- [ ] `https://atlasweb.info/` (homepage)
- [ ] `https://atlasweb.info/pricing` (pricing page)
- [ ] `https://atlasweb.info/specialized-search` (premium features)
- [ ] `https://atlasweb.info/functional-search` (search interface)
- [ ] `https://atlasweb.info/email-assistant` (email tools)

### ✅ **DNS Configuration**
- [ ] Domain points to IONOS servers
- [ ] SSL certificate active
- [ ] WWW redirect configured
- [ ] CDN/caching optimized

## 🔒 Security Notes

- **FTP Credentials**: Never commit passwords to git
- **SFTP Only**: Use secure SFTP (port 22) instead of plain FTP
- **File Permissions**: Ensure proper file permissions after upload
- **SSL Certificate**: Verify HTTPS is working on atlasweb.info

## 📞 IONOS Support

If deployment issues occur:
- **Support**: IONOS customer support
- **Account**: Check IONOS control panel
- **DNS**: Verify domain settings in IONOS dashboard
- **Troubleshooting**: Check IONOS documentation

## 📈 Performance Optimization

Post-deployment optimizations:
- Enable GZIP compression
- Configure browser caching
- Optimize images and assets
- Set up CDN if available
- Monitor loading times

---

**Note**: This deployment replaces the Vercel hosting for production use with the custom domain `atlasweb.info`.