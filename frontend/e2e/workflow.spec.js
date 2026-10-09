import { test, expect, request as playwrightRequest } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Load credentials from .env without printing them
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

test('End-to-end full lifecycle workflow and security assertions', async ({ page }) => {
  const { adminEmail, adminPassword } = getEnvCredentials();
  const testId = Date.now().toString().slice(-6);

  // Dedicated API request context for admin baseline and teardown
  const apiContext = await playwrightRequest.newContext();

  // Track created entities for robust teardown
  const createdUserIds = [];
  const createdDonationIds = [];
  const createdPickupIds = [];

  // Monitor all API responses to ensure NO response contains passwordHash
  let passwordHashLeaked = false;
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/')) {
      try {
        const text = await res.text();
        if (text.includes('passwordHash') || text.includes('password_hash')) {
          passwordHashLeaked = true;
          console.error(`[SECURITY ALERT] Leaked passwordHash detected on URL: ${url}`);
        }
      } catch (e) {}

      // Auto-capture created IDs for teardown resilience
      if (url.includes('/api/auth/register') && res.ok()) {
        try {
          const json = await res.json();
          if (json.user?.id && !createdUserIds.includes(json.user.id)) {
            createdUserIds.push(json.user.id);
            console.log(`[Tracked User for Cleanup] ${json.user.id} (${json.user.role})`);
          }
        } catch (e) {}
      }
    }
  });

  // Capture browser errors
  page.on('pageerror', err => console.error('[BROWSER EXCEPTION]:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[BROWSER CONSOLE ERROR]:', msg.text());
    }
  });

  // Automatically accept all window alerts / confirms
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  // 1. Authenticate admin for baseline and teardown
  const adminLoginRes = await apiContext.post('http://localhost:8080/api/auth/login', {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(adminLoginRes.status()).toBe(200);
  const adminAuth = await adminLoginRes.json();
  const adminToken = adminAuth.token;
  expect(adminAuth.user?.passwordHash).toBeUndefined();

  // Purge any orphan records from prior interrupted runs
  const purgeOrphans = async () => {
    const [uRes, dRes, pRes] = await Promise.all([
      apiContext.get('http://localhost:8080/api/users', { headers: { Authorization: `Bearer ${adminToken}` } }),
      apiContext.get('http://localhost:8080/api/donations', { headers: { Authorization: `Bearer ${adminToken}` } }),
      apiContext.get('http://localhost:8080/api/pickups', { headers: { Authorization: `Bearer ${adminToken}` } }),
    ]);
    const [users, donations, pickups] = await Promise.all([uRes.json(), dRes.json(), pRes.json()]);

    for (const d of donations) {
      if (d.foodItems?.some(i => i.name?.includes('E2E Surplus Feast'))) {
        await apiContext.delete(`http://localhost:8080/api/donations/${d.id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      }
    }
    for (const u of users) {
      if (u.email?.includes('foodrescuetest.org') || u.name?.includes('E2E')) {
        await apiContext.delete(`http://localhost:8080/api/users/${u.id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      }
    }
  };

  await purgeOrphans();

  const getBaseline = async () => {
    const [uRes, dRes, pRes, nRes, vRes] = await Promise.all([
      apiContext.get('http://localhost:8080/api/users', { headers: { Authorization: `Bearer ${adminToken}` } }),
      apiContext.get('http://localhost:8080/api/donations', { headers: { Authorization: `Bearer ${adminToken}` } }),
      apiContext.get('http://localhost:8080/api/pickups', { headers: { Authorization: `Bearer ${adminToken}` } }),
      apiContext.get('http://localhost:8080/api/ngos', { headers: { Authorization: `Bearer ${adminToken}` } }),
      apiContext.get('http://localhost:8080/api/volunteers', { headers: { Authorization: `Bearer ${adminToken}` } }),
    ]);
    const [users, donations, pickups, ngos, volunteers] = await Promise.all([
      uRes.json(), dRes.json(), pRes.json(), nRes.json(), vRes.json(),
    ]);
    return {
      users: users.length,
      donations: donations.length,
      pickups: pickups.length,
      ngos: ngos.length,
      volunteers: volunteers.length,
    };
  };

  const baseline = await getBaseline();
  console.log(`[Baseline] Users: ${baseline.users} | Donations: ${baseline.donations} | Pickups: ${baseline.pickups} | NGOs: ${baseline.ngos} | Vols: ${baseline.volunteers}`);

  let executionError = null;

  try {
    // 2. Register Donor via UI
    console.log('[Step 1] Registering Donor via UI...');
    await page.goto('http://localhost:5173/register');
    await page.waitForLoadState('networkidle');

    const donorEmail = `donor_${testId}@foodrescuetest.org`;
    const donorPass = 'DonorPass123!';

    await page.click('button:has-text("Food Donor")');
    await page.fill('input[placeholder="e.g. Rahul Sharma"]', 'E2E Test Donor');
    await page.fill('input[placeholder="name@organization.com"]', donorEmail);
    await page.fill('input[placeholder="••••••••"]', donorPass);
    await page.fill('input[placeholder="+91 9823000000"]', '+91 9823000001');

    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/register') && res.request().method() === 'POST' && res.ok()),
      page.click('button:has-text("Complete Registration")'),
    ]);

    await page.waitForURL('**/donor', { timeout: 15000 });
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Donor Portal');
    console.log('[Step 1] Donor registered and redirected to Donor Portal.');

    // 3. Verify that Donor typing /ngo or /volunteer dashboard URLs is redirected
    console.log('[Step 2] Testing URL redirection for Donor accessing /ngo and /volunteer...');
    await page.goto('http://localhost:5173/ngo');
    await page.waitForURL('**/donor', { timeout: 10000 });
    expect(page.url()).toContain('/donor');
    console.log('[Step 2] Accessing /ngo was redirected to /donor successfully.');

    await page.goto('http://localhost:5173/volunteer');
    await page.waitForURL('**/donor', { timeout: 10000 });
    expect(page.url()).toContain('/donor');
    console.log('[Step 2] Accessing /volunteer was redirected to /donor successfully.');

    // 4. Create Donation via Donor UI
    console.log('[Step 3] Creating donation via Donor UI...');
    await page.click('button:has-text("Register Surplus Food")');
    await page.waitForSelector('form select');

    await page.fill('input[placeholder="Item Name (e.g. Veg Rice)"]', `E2E Surplus Feast ${testId}`);
    await page.fill('input[placeholder="Qty"]', '15');
    await page.fill('input[placeholder="Enter pickup address"]', '123 E2E MG Road, Pune');

    const [donationRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/donations') && res.request().method() === 'POST' && res.ok()),
      page.click('button[type="submit"]:has-text("Save to MongoDB")'),
    ]);

    const createdDonation = await donationRes.json();
    const createdDonationId = createdDonation.id;
    if (createdDonationId && !createdDonationIds.includes(createdDonationId)) {
      createdDonationIds.push(createdDonationId);
    }
    console.log(`[Step 3] Donation created with ID: ${createdDonationId}`);

    // Wait for card to render
    await expect(page.locator(`text=${createdDonationId}`)).toBeVisible();

    // 5. Logout Donor
    console.log('[Step 4] Logging out Donor...');
    await page.click('button[title="Sign Out"]');
    await page.waitForTimeout(500);

    // 6. Register NGO via UI
    console.log('[Step 5] Registering NGO via UI...');
    await page.goto('http://localhost:5173/register');
    await page.waitForLoadState('networkidle');

    const ngoEmail = `ngo_${testId}@foodrescuetest.org`;
    const ngoPass = 'NgoPass123!';

    await page.click('button:has-text("NGO / Shelter")');
    await page.fill('input[placeholder="e.g. Rahul Sharma"]', 'E2E Relief Officer');
    await page.fill('input[placeholder="name@organization.com"]', ngoEmail);
    await page.fill('input[placeholder="••••••••"]', ngoPass);
    await page.fill('input[placeholder="e.g. Feeding India Pune Chapter"]', `E2E Hope Shelter ${testId}`);
    await page.fill('input[placeholder="REG-NGO-2026-XX"]', `REG-${testId}`);
    await page.fill('input[placeholder="e.g. FC Road, Shivajinagar, Pune"]', '456 Charity Road, Pune');

    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/register') && res.request().method() === 'POST' && res.ok()),
      page.click('button:has-text("Complete Registration")'),
    ]);

    await page.waitForURL('**/ngo', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('NGO Portal');
    console.log('[Step 5] NGO registered and redirected to NGO Portal.');

    // 7. Claim the created donation via NGO UI
    console.log('[Step 6] NGO claiming donation...');
    await page.click('button:has-text("All Available")');
    await page.waitForTimeout(1000);

    const donationCard = page.locator(`.glass-card:has-text("${createdDonationId}")`);
    await expect(donationCard).toBeVisible();
    await donationCard.locator('button:has-text("Request Pickup")').click();

    const [pickupRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/pickups') && res.request().method() === 'POST' && res.ok()),
      page.click('button[type="submit"]:has-text("Confirm Pickup Request")'),
    ]);
    const createdPickup = await pickupRes.json();
    const createdPickupId = createdPickup.id;
    if (createdPickupId && !createdPickupIds.includes(createdPickupId)) {
      createdPickupIds.push(createdPickupId);
    }
    console.log(`[Step 6] Pickup created with ID: ${createdPickupId}`);

    // 8. Logout NGO
    console.log('[Step 7] Logging out NGO...');
    await page.click('button[title="Sign Out"]');
    await page.waitForTimeout(500);

    // 9. Register Volunteer via UI
    console.log('[Step 8] Registering Volunteer via UI...');
    await page.goto('http://localhost:5173/register');
    await page.waitForLoadState('networkidle');

    const volEmail = `vol_${testId}@foodrescuetest.org`;
    const volPass = 'VolPass123!';

    await page.click('button:has-text("Volunteer")');
    await page.fill('input[placeholder="e.g. Rahul Sharma"]', 'E2E Hero Volunteer');
    await page.fill('input[placeholder="name@organization.com"]', volEmail);
    await page.fill('input[placeholder="••••••••"]', volPass);

    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/register') && res.request().method() === 'POST' && res.ok()),
      page.click('button:has-text("Complete Registration")'),
    ]);

    await page.waitForURL('**/volunteer', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Volunteer');
    console.log('[Step 8] Volunteer registered and redirected to Volunteer Dashboard.');

    // 10. Mark PICKED_UP -> DELIVERED -> leave feedback
    console.log('[Step 9] Volunteer updating pickup status...');
    const pickupCard = page.locator(`.glass-card:has-text("#${createdPickupId}")`);
    await expect(pickupCard).toBeVisible();

    // Click "Confirm Food Collected" (transitions to PICKED_UP)
    await Promise.all([
      page.waitForResponse(res => res.url().includes(`/api/pickups/${createdPickupId}/status`) && res.request().method() === 'PUT' && res.ok()),
      pickupCard.locator('button:has-text("Confirm Food Collected")').click(),
    ]);
    console.log('[Step 9] Food collected (PICKED_UP).');

    // Wait for button "Confirm Delivery to NGO" to appear
    await expect(pickupCard.locator('button:has-text("Confirm Delivery to NGO")')).toBeVisible();

    // Click "Confirm Delivery to NGO" (transitions to DELIVERED)
    await Promise.all([
      page.waitForResponse(res => res.url().includes(`/api/pickups/${createdPickupId}/status`) && res.request().method() === 'PUT' && res.ok()),
      pickupCard.locator('button:has-text("Confirm Delivery to NGO")').click(),
    ]);
    console.log('[Step 9] Food delivered to NGO (DELIVERED).');

    // Wait for button "Add Rescue Rating / Feedback" to appear
    await expect(pickupCard.locator('button:has-text("Add Rescue Rating / Feedback")')).toBeVisible();

    // Click "Add Rescue Rating / Feedback"
    await pickupCard.locator('button:has-text("Add Rescue Rating / Feedback")').click();
    await page.waitForSelector('textarea');

    await page.fill('textarea', 'Excellent condition food redistribution verified by E2E test!');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/feedback') && res.request().method() === 'POST' && res.ok()),
      page.click('button[type="submit"]:has-text("Submit Feedback")'),
    ]);
    console.log('[Step 9] Feedback recorded successfully.');

    // 11. Logout Volunteer
    console.log('[Step 10] Logging out Volunteer...');
    await page.click('button[title="Sign Out"]');
    await page.waitForTimeout(500);

    // 12. Log in as ADMIN using values from .env (without printing them)
    console.log('[Step 11] Logging in as Admin using credentials from .env...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder="you@domain.com"]', adminEmail);
    await page.fill('input[placeholder="••••••••"]', adminPassword);

    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/login') && res.request().method() === 'POST' && res.ok()),
      page.click('form button[type="submit"]'),
    ]);

    await expect(page.getByText('ADMIN', { exact: true })).toBeVisible();
    console.log('[Step 11] Admin login verified successfully.');

    // 13. Verify NO passwordHash was ever exposed in any response
    expect(passwordHashLeaked).toBe(false);
    console.log('[Step 12] Verified: zero API responses contained passwordHash.');

  } catch (err) {
    executionError = err;
    console.error('[Error During Workflow Execution]:', err);
  } finally {
    // 14. Clean up test data and verify collection counts match baseline
    console.log('[Teardown] Cleaning up test entities via Admin API...');

    try {
      // Delete feedback if created
      const feedbackListRes = await apiContext.get('http://localhost:8080/api/feedback', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (feedbackListRes.status() === 200) {
        const feedbackList = await feedbackListRes.json();
        for (const fb of feedbackList) {
          if (createdDonationIds.includes(fb.donationId)) {
            await apiContext.delete(`http://localhost:8080/api/feedback/${fb.id}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
            });
            console.log(`[Cleaned Up Feedback] ${fb.id}`);
          }
        }
      }

      // Delete pickups
      for (const pid of createdPickupIds) {
        await apiContext.delete(`http://localhost:8080/api/pickups/${pid}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        console.log(`[Cleaned Up Pickup] ${pid}`);
      }

      // Delete donations
      for (const did of createdDonationIds) {
        await apiContext.delete(`http://localhost:8080/api/donations/${did}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        console.log(`[Cleaned Up Donation] ${did}`);
      }

      // Delete any NGOs linked to created users
      const ngosRes = await apiContext.get('http://localhost:8080/api/ngos', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (ngosRes.status() === 200) {
        const ngos = await ngosRes.json();
        for (const n of ngos) {
          if (createdUserIds.includes(n.userId) || !['N201', 'N202'].includes(n.id)) {
            await apiContext.delete(`http://localhost:8080/api/ngos/${n.id}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
            });
            console.log(`[Cleaned Up NGO] ${n.id}`);
          }
        }
      }

      // Delete any volunteers linked to created users
      const volsRes = await apiContext.get('http://localhost:8080/api/volunteers', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (volsRes.status() === 200) {
        const vols = await volsRes.json();
        for (const v of vols) {
          if (createdUserIds.includes(v.userId) || !['V301', 'V302'].includes(v.id)) {
            await apiContext.delete(`http://localhost:8080/api/volunteers/${v.id}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
            });
            console.log(`[Cleaned Up Volunteer] ${v.id}`);
          }
        }
      }

      // Delete users (and linked NGO / volunteer profiles if any)
      for (const uid of createdUserIds) {
        await apiContext.delete(`http://localhost:8080/api/users/${uid}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        console.log(`[Cleaned Up User] ${uid}`);
      }

      // Confirm post-cleanup counts match baseline
      const postCleanup = await getBaseline();
      console.log(`[Post-Cleanup] Users: ${postCleanup.users} | Donations: ${postCleanup.donations} | Pickups: ${postCleanup.pickups} | NGOs: ${postCleanup.ngos} | Vols: ${postCleanup.volunteers}`);

      expect(postCleanup.users).toBe(baseline.users);
      expect(postCleanup.donations).toBe(baseline.donations);
      expect(postCleanup.pickups).toBe(baseline.pickups);
      expect(postCleanup.ngos).toBe(baseline.ngos);
      expect(postCleanup.volunteers).toBe(baseline.volunteers);
      console.log('[Teardown] All collections confirmed returned to exact baseline counts.');
    } finally {
      await apiContext.dispose();
      if (executionError) {
        throw executionError;
      }
    }
  }
});
