import { test, expect } from '@playwright/test';

test.describe('StatsAI Authentication Flow', () => {
  test('should show auth modal when Join Up button is clicked', async ({ page }) => {
    // Navigate to the Electron app (assuming it's served on localhost)
    await page.goto('file:///home/rakib232/github/claude-code/statsai-electron/src/index.html');
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Look for the Join Up button
    const joinUpButton = page.locator('#signupBtn', { hasText: 'Join up' });
    await expect(joinUpButton).toBeVisible();
    
    // Click the Join Up button
    await joinUpButton.click();
    
    // Check if auth modal is visible
    const authModal = page.locator('.auth-modal-overlay');
    await expect(authModal).toBeVisible();
    
    // Check if modal title shows signup mode
    const modalTitle = page.locator('#authModalTitle');
    await expect(modalTitle).toHaveText('Join AtlasWeb');
    
    // Check if signup form fields are visible
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    
    // Check if submit button has correct text
    const submitButton = page.locator('#authSubmitBtn');
    await expect(submitButton).toHaveText('Create Account');
  });

  test('should switch between login and signup modes', async ({ page }) => {
    await page.goto('file:///home/rakib232/github/claude-code/statsai-electron/src/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Click Join Up to open signup modal
    await page.locator('#signupBtn').click();
    
    // Verify we're in signup mode
    await expect(page.locator('#authModalTitle')).toHaveText('Join AtlasWeb');
    
    // Click switch to login
    await page.locator('#authSwitchBtn').click();
    
    // Verify we switched to login mode
    await expect(page.locator('#authModalTitle')).toHaveText('Welcome Back');
    await expect(page.locator('#authSubmitBtn')).toHaveText('Sign In');
    
    // Check that name fields are hidden
    await expect(page.locator('#nameFields')).toBeHidden();
  });

  test('should close modal when close button is clicked', async ({ page }) => {
    await page.goto('file:///home/rakib232/github/claude-code/statsai-electron/src/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Open the modal
    await page.locator('#signupBtn').click();
    await expect(page.locator('.auth-modal-overlay')).toBeVisible();
    
    // Click close button
    await page.locator('#authModalClose').click();
    
    // Verify modal is closed
    await expect(page.locator('.auth-modal-overlay')).toBeHidden();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('file:///home/rakib232/github/claude-code/statsai-electron/src/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Open signup modal
    await page.locator('#signupBtn').click();
    
    // Try to submit empty form
    await page.locator('#authSubmitBtn').click();
    
    // Check HTML5 validation (first required field should be focused)
    const firstNameField = page.locator('#firstName');
    await expect(firstNameField).toBeFocused();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('file:///home/rakib232/github/claude-code/statsai-electron/src/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Open signup modal
    await page.locator('#signupBtn').click();
    
    // Fill in form with invalid email
    await page.locator('#firstName').fill('John');
    await page.locator('#lastName').fill('Doe');
    await page.locator('#email').fill('invalid-email');
    await page.locator('#password').fill('password123');
    
    // Try to submit
    await page.locator('#authSubmitBtn').click();
    
    // Check that email field shows validation error
    const emailField = page.locator('#email');
    const isInvalid = await emailField.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should handle login button click', async ({ page }) => {
    await page.goto('file:///home/rakib232/github/claude-code/statsai-electron/src/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Click Login button
    const loginButton = page.locator('#loginBtn');
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    // Check if auth modal is visible in login mode
    const authModal = page.locator('.auth-modal-overlay');
    await expect(authModal).toBeVisible();
    
    // Check if modal title shows login mode
    const modalTitle = page.locator('#authModalTitle');
    await expect(modalTitle).toHaveText('Welcome Back');
    
    // Check that name fields are hidden in login mode
    await expect(page.locator('#nameFields')).toBeHidden();
    
    // Check if submit button has correct text
    const submitButton = page.locator('#authSubmitBtn');
    await expect(submitButton).toHaveText('Sign In');
  });
});

test.describe('Visual Tests', () => {
  test('should have proper styling applied', async ({ page }) => {
    await page.goto('file:///home/rakib232/github/claude-code/statsai-electron/src/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Open the modal to test styling
    await page.locator('#signupBtn').click();
    
    // Take a screenshot for visual comparison
    await expect(page.locator('.auth-modal')).toHaveScreenshot('auth-modal.png');
    
    // Test button styling
    const joinUpButton = page.locator('#signupBtn');
    const buttonStyles = await joinUpButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        borderRadius: styles.borderRadius,
        color: styles.color
      };
    });
    
    // Verify Aura-style gradient background is applied
    expect(buttonStyles.background).toContain('linear-gradient');
  });
});