## Security Review Checklist

### Authentication & Authorization
- [ ] SQL Injection vulnerabilities
- [ ] XSS vulnerabilities (Cross-Site Scripting)
- [ ] Authentication/Authorization issues
- [ ] Session management security
- [ ] Password security and hashing
- [ ] JWT token validation and security

### Data Protection
- [ ] Sensitive data exposure
- [ ] Data encryption at rest and in transit
- [ ] PII (Personal Identifiable Information) handling
- [ ] GDPR compliance considerations
- [ ] Data validation and sanitization

### Security Controls
- [ ] CSRF protection
- [ ] Input validation and sanitization
- [ ] Output encoding
- [ ] Rate limiting implementation
- [ ] CORS configuration
- [ ] Security headers implementation

### Dependencies & Environment
- [ ] Dependency vulnerabilities (npm audit, snyk)
- [ ] Environment variable security
- [ ] Secret management
- [ ] Docker/container security
- [ ] Third-party service security

### Infrastructure Security
- [ ] HTTPS enforcement
- [ ] Database security
- [ ] API security
- [ ] Logging and monitoring for security events
- [ ] Error handling (no sensitive data leakage)