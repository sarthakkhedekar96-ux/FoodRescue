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

test('Capture after screenshots at desktop and phone widths', async ({ page }) => {
  const dir = path.resolve(process.cwd(), 'screenshots/after');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const desktopViewport = { width: 1280, height: 720 };
  const tabletViewport = { width: 768, height: 1024 };
  const phoneViewport = { width: 390, height: 844 };

  // ===================== DESKTOP CAPTURES =====================
  await page.setViewportSize(desktopViewport);

  // 1. Home (With Data) - Desktop
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(dir, 'home.png'), fullPage: true });
  await page.screenshot({ path: path.join(dir, 'home-desktop.png'), fullPage: true });

  // 1b. Home (With Data) - Tablet
  await page.setViewportSize(tabletViewport);
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(dir, 'home-tablet.png'), fullPage: true });

  await page.setViewportSize(desktopViewport);

  // 2. Home (Empty State) - Desktop (via mocked zero metrics response without altering DB)
  await page.route('**/api/stats', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      totalDonations: 0,
      totalFoodQuantity: 0,
      averageRating: 0,
      statusDistribution: { AVAILABLE: 0, COMPLETED: 0 },
      categoryDistribution: [],
      topDonors: []
    })
  }));
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(dir, 'home-empty-desktop.png'), fullPage: true });
  await page.unroute('**/api/stats');

  // 3. Login - Desktop
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(dir, 'login.png') });
  await page.screenshot({ path: path.join(dir, 'login-desktop.png') });

  // 4. Authenticate as Admin for Dashboard captures
  const { adminEmail, adminPassword } = getEnvCredentials();
  await page.fill('input[placeholder="you@domain.com"]', adminEmail);
  await page.fill('input[placeholder="••••••••"]', adminPassword);
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.ok()),
    page.click('form button[type="submit"]'),
  ]);
  await page.waitForTimeout(1000);

  // Admin Dashboard - Desktop
  await page.screenshot({ path: path.join(dir, 'admin-dashboard.png'), fullPage: true });
  await page.screenshot({ path: path.join(dir, 'admin-dashboard-desktop.png'), fullPage: true });

  // Donor Dashboard - Desktop
  await page.click('nav button:has-text("Donor Dashboard")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'donor-dashboard.png'), fullPage: true });
  await page.screenshot({ path: path.join(dir, 'donor-dashboard-desktop.png'), fullPage: true });

  // NGO Dashboard - Desktop
  await page.click('nav button:has-text("NGO Dashboard")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'ngo-dashboard.png'), fullPage: true });
  await page.screenshot({ path: path.join(dir, 'ngo-dashboard-desktop.png'), fullPage: true });

  // Volunteer Dashboard - Desktop
  await page.click('nav button:has-text("Volunteer")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'volunteer-dashboard.png'), fullPage: true });
  await page.screenshot({ path: path.join(dir, 'volunteer-dashboard-desktop.png'), fullPage: true });

  // Logout
  await page.click('button[title="Sign Out"]');
  await page.waitForTimeout(500);

  // Error State - Desktop
  await page.goto('http://localhost:5173/admin');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dir, 'error-state.png') });
  await page.screenshot({ path: path.join(dir, 'error-state-desktop.png') });

  // ===================== PHONE / MOBILE CAPTURES =====================
  await page.setViewportSize(phoneViewport);

  // 1. Home (With Data) - Phone
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(dir, 'home-mobile.png'), fullPage: true });

  // 2. Home (Empty State) - Phone
  await page.route('**/api/stats', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      totalDonations: 0,
      totalFoodQuantity: 0,
      averageRating: 0,
      statusDistribution: { AVAILABLE: 0, COMPLETED: 0 },
      categoryDistribution: [],
      topDonors: []
    })
  }));
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(dir, 'home-empty-mobile.png'), fullPage: true });
  await page.unroute('**/api/stats');

  // 3. Login - Phone
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(dir, 'login-mobile.png') });

  // 4. Authenticate as Admin on Phone
  await page.fill('input[placeholder="you@domain.com"]', adminEmail);
  await page.fill('input[placeholder="••••••••"]', adminPassword);
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.ok()),
    page.click('form button[type="submit"]'),
  ]);
  await page.waitForTimeout(1000);

  // Admin Dashboard - Phone
  await page.screenshot({ path: path.join(dir, 'admin-dashboard-mobile.png'), fullPage: true });

  // Donor Dashboard - Phone
  await page.click('nav button:has-text("Donor Dashboard")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'donor-dashboard-mobile.png'), fullPage: true });

  // NGO Dashboard - Phone
  await page.click('nav button:has-text("NGO Dashboard")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'ngo-dashboard-mobile.png'), fullPage: true });

  // Volunteer Dashboard - Phone
  await page.click('nav button:has-text("Volunteer")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'volunteer-dashboard-mobile.png'), fullPage: true });

  // Logout
  await page.click('button[title="Sign Out"]');
  await page.waitForTimeout(500);

  // Error State - Phone
  await page.goto('http://localhost:5173/admin');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dir, 'error-state-mobile.png') });
});
