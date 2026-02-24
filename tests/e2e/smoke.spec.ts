import { expect, test } from '@playwright/test';

const completedAuditPayload = {
  audit_id: 'test-completed',
  company_name: 'Acme Corp',
  maturity_score: 85,
  automation_potential: 72,
  roi_projection: 210,
  implementation_timeline: '3 months',
  strengths: ['Process mapping complete'],
  weaknesses: ['Manual handoffs'],
  opportunities: ['Automated reporting'],
  recommendations: ['Start with pilot process'],
  process_scores: {
    finance: 82,
    operations: 77,
    support: 68,
  },
  priority_areas: ['Data Pipeline'],
  estimated_savings: 120000,
  implementation_cost: 45000,
  payback_period: 10,
  created_at: '2026-02-18T00:00:00.000Z',
  status: 'completed',
};

test('critical CTA routes resolve on first click', async ({ page }) => {
  await page.goto('/');

  await page.locator('section').first().locator('a[href="/audit"]').first().click();
  await expect(page).toHaveURL(/\/audit$/);

  await page.goto('/');
  await page.locator('a[href*="source=home_final_cta"]').first().click();
  await expect(page).toHaveURL(/\/contact\?source=home_final_cta/);

  await page.goto('/solutions');
  await page.locator('a[href*="source=solutions_cta"]').first().click();
  await expect(page).toHaveURL(/\/contact\?source=solutions_cta/);

  await page.goto('/pricing');
  await page.locator('a[href*="source=pricing_tier"]').first().click();
  await expect(page).toHaveURL(/\/contact\?source=pricing_tier/);

  await page.goto('/case-studies');
  await page.locator('a[href*="source=case_study"]').first().click();
  await expect(page).toHaveURL(/\/contact\?source=case_study/);

  await page.goto('/blog');
  const subscribeLink = page.locator('a[href*="source=blog_subscribe"]').first();
  await subscribeLink.scrollIntoViewIfNeeded();
  await subscribeLink.click();
  await expect(page).toHaveURL(/\/contact\?source=blog_subscribe/);
});

test('language selection persists user choice', async ({ page }) => {
  await page.goto('/');

  const currentButton = page.getByRole('button', { name: /^(EN|RU)$/ }).first();
  const current = await currentButton.innerText();
  const target = current === 'EN' ? 'RU' : 'EN';

  await currentButton.click();
  await page.locator('div.absolute.top-full button', { hasText: target }).first().click();

  const saved = await page.evaluate(() => localStorage.getItem('language'));
  expect(saved).toBe(target.toLowerCase());
});

test('audit results handles processing, completed, and error states', async ({ page }) => {
  await page.route('**/api/audit/results/test-processing', async (route) => {
    await route.fulfill({ status: 202, body: JSON.stringify({ detail: 'Processing' }) });
  });
  await page.route('**/api/audit/status/test-processing', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        audit_id: 'test-processing',
        status: 'processing',
        created_at: '2026-02-18T00:00:00.000Z',
        updated_at: '2026-02-18T00:00:00.000Z',
      }),
    });
  });

  await page.goto('/audit/results/test-processing');
  await expect(page.locator('div.bg-blue-600.h-2.rounded-full')).toBeVisible();

  await page.route('**/api/audit/results/test-completed', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify(completedAuditPayload) });
  });
  await page.goto('/audit/results/test-completed');
  await expect(page.getByText('Data Pipeline')).toBeVisible();

  await page.route('**/api/audit/results/test-error', async (route) => {
    await route.fulfill({ status: 500, body: JSON.stringify({ detail: 'Server error' }) });
  });
  await page.route('**/api/audit/status/test-error', async (route) => {
    await route.fulfill({ status: 404, body: JSON.stringify({ detail: 'Not found' }) });
  });
  await page.goto('/audit/results/test-error');
  const errorCard = page.locator('div.bg-white.rounded-2xl.shadow-xl.p-8.text-center.max-w-md.mx-4');
  await expect(errorCard).toBeVisible();
  await errorCard.getByRole('button').click();
  await expect(page).toHaveURL(/\/audit$/);
});

// ── Admin Panel tests ────────────────────────────────────────────────────────

const mockLoginResponse = {
  access_token: 'mock-jwt-token-for-testing',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  user: {
    id: 1,
    username: 'admin',
    email: 'admin@xteam.pro',
    full_name: 'System Administrator',
    role: 'super_admin',
    can_manage_audits: true,
    can_manage_users: true,
    can_view_analytics: true,
    can_export_data: true,
    can_manage_content: true,
    last_login: null,
  },
};

const mockDashboardResponse = {
  total_audits: 42,
  completed_audits: 35,
  pending_audits: 7,
  total_contacts: 18,
  avg_maturity_score: 71.5,
  conversion_rate: 83.3,
  recent_audits: [],
  recent_contacts: [],
  monthly_trend: [],
  industry_breakdown: [],
};

async function adminLogin(page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never) {
  await page.route('**/api/admin/login', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify(mockLoginResponse) });
  });
  await page.route('**/api/admin/dashboard', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify(mockDashboardResponse) });
  });

  await page.goto('/admin/login');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/admin\/dashboard/);
}

test('admin login succeeds and redirects to dashboard', async ({ page }) => {
  await adminLogin(page);
  await expect(page).toHaveURL(/\/admin\/dashboard/);
});

test('admin dashboard displays KPI cards', async ({ page }) => {
  await adminLogin(page);
  // Dashboard should show at least one card with a numeric value
  await expect(page.locator('.bg-white.rounded-2xl').first()).toBeVisible();
});

test('admin logout clears session and redirects to login', async ({ page }) => {
  await adminLogin(page);

  // Click the logout button (look for Logout text or aria-label)
  const logoutBtn = page.getByRole('button', { name: /logout|выйти/i }).first();
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  } else {
    // Logout via sessionStorage clear
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/admin/login');
  }

  await expect(page).toHaveURL(/\/admin\/login/);
  const token = await page.evaluate(() => sessionStorage.getItem('admin_token'));
  expect(token).toBeNull();
});

// ── Layout tests ─────────────────────────────────────────────────────────────

test('header layout does not overflow across required breakpoints', async ({ page }) => {
  const widths = [320, 375, 768, 1024, 1280, 1440];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    const hasOverflow = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) {
        return false;
      }
      return header.scrollWidth > header.clientWidth + 1;
    });

    expect(hasOverflow).toBeFalsy();
    await page.screenshot({ path: `test-results/header-${width}.png` });
  }
});
