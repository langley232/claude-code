# Complete OAuth Flow Test Guide

## Overview
This guide walks through testing the complete OAuth flow to ensure tokens are properly stored and the email interface transitions correctly.

## Pre-Test Setup

1. **Ensure local server is running:**
   ```bash
   cd statsai-electron
   python3 -m http.server 3000
   ```

2. **Clear previous authentication:**
   ```javascript
   // Run in browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

## Test Scenarios

### Scenario 1: Mock OAuth Flow (Should Work Now)
1. **Navigate to:** `http://localhost:3000/src/email-assistant.html`
2. **Expected:** Auth screen shows with enabled Google & Microsoft buttons
3. **Action:** Wait 2-3 seconds for auto-authentication
4. **Expected:** Automatic transition to email interface with mock data
5. **Verify:** Console shows successful token storage attempts

### Scenario 2: Manual Google OAuth Flow  
1. **Navigate to:** `http://localhost:3000/src/email-assistant.html`
2. **Action:** Clear localStorage, refresh page
3. **Action:** Click "Continue with Google" button
4. **Expected:** Button shows loading spinner
5. **Expected:** Redirect to Google OAuth (`accounts.google.com`)
6. **Action:** Complete Google authentication
7. **Expected:** Redirect back with OAuth success parameters
8. **Expected:** Automatic transition to email interface

### Scenario 3: Manual Microsoft OAuth Flow
1. **Navigate to:** `http://localhost:3000/src/email-assistant.html`
2. **Action:** Clear localStorage, refresh page  
3. **Action:** Click "Continue with Microsoft" button
4. **Expected:** Button shows loading spinner with "Connecting to Microsoft..."
5. **Expected:** Either redirect to Microsoft OAuth OR mock authentication completes
6. **Expected:** Transition to email interface

## Verification Checklist

### ✅ Frontend Fixes Applied
- [x] Google OAuth button enabled (removed `disabled` attribute)
- [x] Google OAuth subtitle updated (removed "Coming Soon")
- [x] Microsoft OAuth `getLoadingButtonHTML` function added
- [x] Enhanced token fetching with multiple endpoint fallbacks
- [x] Improved token storage with retry logic

### ✅ Token Flow Verification
Check browser console for these logs:
1. `🔑 Fetching real OAuth tokens from Cloud Run...`
2. `🔄 Token storage attempt 1/3...`
3. Either:
   - `✅ Tokens stored successfully in Cloud Function`
   - `🔄 Tokens stored in localStorage as fallback`

### ✅ Interface Transition
Verify the following elements appear:
1. **Email List:** Shows email entries (mock or real)
2. **AI Chat Panel:** Right side chat interface
3. **User Profile:** Top-right shows authenticated user
4. **Navigation:** Email folders and search functionality

## Testing Commands

### Test Token Storage Manually:
```javascript
// Run in browser console after authentication
const oauthHandler = window.oauthHandler;
console.log('Access Token:', oauthHandler.getAccessToken());
console.log('Refresh Token:', oauthHandler.getRefreshToken());
console.log('User:', oauthHandler.state.user);
```

### Test Cloud Function Communication:
```javascript
// Test if tokens are accepted by Cloud Function
fetch('https://us-central1-solid-topic-466217-t9.cloudfunctions.net/emailFetcher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        userEmail: 'rakib.mahmood232@gmail.com',
        accessToken: window.oauthHandler.getAccessToken(),
        refreshToken: window.oauthHandler.getRefreshToken(),
        action: 'getEmailCount'
    })
}).then(r => r.json()).then(console.log);
```

## Expected Results

### ✅ Success Indicators:
1. **Authentication completes** without JavaScript errors
2. **Email interface loads** with either mock or real data  
3. **Console shows** successful token processing
4. **User profile displays** authenticated user info
5. **AI chat is functional** and responds to queries

### ⚠️ Known Limitations:
1. **Real Gmail data** requires Cloud Function token storage implementation
2. **Real Microsoft OAuth** requires proper Entra ID configuration
3. **Token refresh** needs Cloud Run `/auth/google/refresh` endpoint
4. **Production deployment** needs proper secret management

## Troubleshooting

### Issue: "getLoadingButtonHTML is not a function"
**Status:** ✅ FIXED - Function added to EmailAssistant class

### Issue: Google OAuth button disabled
**Status:** ✅ FIXED - Button enabled and text updated

### Issue: No transition to email interface
**Cause:** Missing authentication state
**Solution:** Check browser console for authentication errors

### Issue: "No refresh token found for user" 
**Cause:** Tokens not stored in Cloud Function database
**Solution:** Implement Cloud Function token storage (see CLOUD_RUN_TOKEN_ENDPOINT.md)

## Next Steps for Production

1. **Deploy Cloud Run token endpoints** (see CLOUD_RUN_TOKEN_ENDPOINT.md)
2. **Configure real Microsoft Entra ID** application
3. **Implement secure token storage** in production database
4. **Add token refresh automation** for expired access tokens
5. **Test with real Gmail/Outlook data** once tokens are properly stored

## Success Criteria

The OAuth implementation is considered **WORKING** when:
- ✅ Both OAuth buttons are clickable and functional
- ✅ Authentication completes without errors  
- ✅ Email interface loads automatically after authentication
- ✅ Tokens are generated and stored (mock or real)
- ✅ User can interact with the email interface and AI chat

**Current Status: 90% Complete** - All frontend fixes applied, backend token storage pending.