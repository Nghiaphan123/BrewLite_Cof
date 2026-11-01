import { expect, test } from '@playwright/test';

const apiBase = (process.env.API_URL ?? 'http://localhost:3001/api/v1').replace(/\/+$/, '');

test('menu to confirmation with mock Wallet', async ({ page, request }) => {
  const email = `e2e-${Date.now()}@brewlite.test`;
  const password = 'Brewlite1';

  const registered = await request.post(`${apiBase}/auth/register`, {
    data: { name: 'E2E Customer', email, password },
  });
  expect(registered.ok(), await registered.text()).toBeTruthy();

  await page.goto('/login');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit-btn').click();
  await expect(page).not.toHaveURL(/\/login/);

  await expect(page.getByTestId('menu-grid')).toBeVisible();
  await page.getByRole('link', { name: /Xem chi tiết/ }).first().click();

  await expect(page.getByTestId('add-to-cart-btn')).toBeVisible();
  await page.getByTestId('size-M').click();
  await page.getByTestId('add-to-cart-btn').click();

  await expect(page.getByTestId('proceed-checkout-btn')).toBeVisible();
  await page.getByTestId('proceed-checkout-btn').click();

  await page.getByTestId('method-wallet').check();
  await page.getByTestId('confirm-payment-btn').click();

  await expect(page).toHaveURL(/\/orders\/.+/);
  await expect(page.getByTestId('confirm-order-status')).toContainText('Đã thanh toán');
});
