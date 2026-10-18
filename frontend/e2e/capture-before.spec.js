import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

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

test('Capture before screenshots', async ({ page }) => {
  const dir = path.resolve(process.cwd(), 'screenshots/before');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Home
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(dir, 'home.png'), fullPage: true });

  // 2. Login
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(dir, 'login.png') });

  // 3. Admin login for Donor / NGO / Volunteer / Admin / Error captures
  const { adminEmail, adminPassword } = getEnvCredentials();
  await page.fill('input[placeholder="you@domain.com"]', adminEmail);
  await page.fill('input[placeholder="••••••••"]', adminPassword);
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.ok()),
    page.click('form button[type="submit"]'),
  ]);
  await page.waitForTimeout(1000);

  // Admin Dashboard
  await page.screenshot({ path: path.join(dir, 'admin-dashboard.png'), fullPage: true });

  // Donor Dashboard (admin can access)
  await page.click('nav button:has-text("Donor Dashboard")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'donor-dashboard.png'), fullPage: true });

  // NGO Dashboard (admin can access)
  await page.click('nav button:has-text("NGO Dashboard")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'ngo-dashboard.png'), fullPage: true });

  // Volunteer Dashboard (admin can access)
  await page.click('nav button:has-text("Volunteer")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'volunteer-dashboard.png'), fullPage: true });

  // Logout
  await page.click('button[title="Sign Out"]');
  await page.waitForTimeout(500);

  // Error State: navigate to /admin while logged out (shows permission/auth error state)
  await page.goto('http://localhost:5173/admin');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dir, 'error-state.png') });
});
