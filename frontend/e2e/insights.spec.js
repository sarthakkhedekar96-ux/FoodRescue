import { test, expect, request as playwrightRequest } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Read credentials from .env without printing them
function getEnvCredentials() {
  const envPath = path.resolve(process.cwd(), '../.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  }
  return {
    adminEmail: env['ADMIN_EMAIL'],
    adminPassword: env['ADMIN_PASSWORD'],
  };
}

test('Database Insights is ADMIN-only: donor hidden & redirected, admin sees real data', async ({ page }) => {
  const { adminEmail, adminPassword } = getEnvCredentials();
  const testId = Date.now().toString().slice(-6);

  const apiContext = await playwrightRequest.newContext();
  const createdUserIds = [];

  // Track created users
  page.on('response', async (res) => {
    if (res.url().includes('/api/auth/register') && res.ok()) {
      try {
        const json = await res.json();
        if (json.user?.id && !createdUserIds.includes(json.user.id)) {
          createdUserIds.push(json.user.id);
        }
      } catch (e) {}
    }
  });

  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  try {
    // 1. Register a Donor
    console.log('[Insights E2E] Registering test Donor...');
    await page.goto('http://localhost:5173/register');
    await page.waitForLoadState('networkidle');

    const donorEmail = `donor_ins_${testId}@foodrescuetest.org`;
    const donorPass = 'DonorPass123!';

    await page.click('button:has-text("Food Donor")');
    await page.fill('input[placeholder="e.g. Rahul Sharma"]', 'Insights Test Donor');
    await page.fill('input[placeholder="name@organization.com"]', donorEmail);
    await page.fill('input[placeholder="••••••••"]', donorPass);
    await page.fill('input[placeholder="+91 9823000000"]', '+91 9823999999');

    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/register') && res.request().method() === 'POST' && res.ok()),
      page.click('button:has-text("Complete Registration")'),
    ]);

    await page.waitForURL('**/donor', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Donor Portal');
    console.log('[Insights E2E] Donor registered and viewing Donor Portal.');

    // 2. Donor never sees Database Insights link in Navbar
    console.log('[Insights E2E] Verifying Database Insights link is hidden for Donor...');
    const insightsLinkForDonor = page.locator('nav button:has-text("Database Insights")');
    await expect(insightsLinkForDonor).toHaveCount(0);
    console.log('[Insights E2E] Verified: Donor navbar does NOT contain Database Insights link.');

    // 3. Typing /insights redirects away (to /donor)
    console.log('[Insights E2E] Testing route guard redirection when Donor navigates to /insights...');
    await page.goto('http://localhost:5173/insights');
    await page.waitForURL('**/donor', { timeout: 10000 });
    expect(page.url()).toContain('/donor');
    console.log('[Insights E2E] Verified: Navigating to /insights successfully redirected Donor away to /donor.');

    // 4. Logout Donor
    await page.click('button[title="Sign Out"]');
    await page.waitForTimeout(500);

    // 5. Log in as ADMIN using values from .env
    console.log('[Insights E2E] Logging in as Admin using credentials from .env...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder="you@domain.com"]', adminEmail);
    await page.fill('input[placeholder="••••••••"]', adminPassword);

    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/login') && res.request().method() === 'POST' && res.ok()),
      page.click('form button[type="submit"]'),
    ]);

    await expect(page.getByText('ADMIN', { exact: true })).toBeVisible();
    console.log('[Insights E2E] Admin logged in.');

    // 6. Admin sees Database Insights link in Navbar
    console.log('[Insights E2E] Verifying Database Insights link is visible for Admin...');
    const insightsLinkForAdmin = page.locator('nav button:has-text("Database Insights")');
    await expect(insightsLinkForAdmin).toBeVisible();
    console.log('[Insights E2E] Verified: Database Insights link is visible in Admin navbar.');

    // 7. Click Database Insights and verify page loads real data
    console.log('[Insights E2E] Navigating to Database Insights page...');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/donations') && res.ok()),
      insightsLinkForAdmin.click(),
    ]);

    await page.waitForSelector('h1:has-text("MongoDB Database Insights")');
    await expect(page.locator('h1')).toContainText('MongoDB Database Insights');

    // Verify real collections data loaded
    await expect(page.getByText('users', { exact: true })).toBeVisible();
    await expect(page.getByText('donations', { exact: true })).toBeVisible();
    await expect(page.getByText('ngos', { exact: true })).toBeVisible();
    await expect(page.getByText('volunteers', { exact: true })).toBeVisible();
    await expect(page.getByText('pickups', { exact: true })).toBeVisible();
    await expect(page.getByText('feedback', { exact: true })).toBeVisible();

    // Verify real document sample cards exist
    await expect(page.locator('text=Main Document: donations Collection')).toBeVisible();
    await expect(page.locator('text=Referenced Document: pickups Collection')).toBeVisible();
    console.log('[Insights E2E] Verified: Database Insights loaded real data across all collections for Admin.');

  } finally {
    // Teardown: clean up created test donor
    console.log('[Insights E2E Teardown] Cleaning up test entities...');
    const adminLoginRes = await apiContext.post('http://localhost:8080/api/auth/login', {
      data: { email: adminEmail, password: adminPassword },
    });
    if (adminLoginRes.status() === 200) {
      const adminAuth = await adminLoginRes.json();
      const adminToken = adminAuth.token;
      for (const uid of createdUserIds) {
        await apiContext.delete(`http://localhost:8080/api/users/${uid}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        console.log(`[Cleaned Up Test User] ${uid}`);
      }
    }
    await apiContext.dispose();
  }
});
