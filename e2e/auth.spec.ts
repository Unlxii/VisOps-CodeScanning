// e2e/auth.spec.ts
// E2E tests for authentication flow

import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("Landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Vis Scan/i);
    await expect(page.getByRole("link", { name: /guide/i })).toBeVisible();
  });

  test("Login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading")).toBeVisible();
    // CMU login button or provider
    await expect(page.getByRole("button")).toBeVisible();
  });

  test("Unauthenticated user redirects from dashboard", async ({ page }) => {
    const response = await page.goto("/dashboard");
    // Should redirect to /login or /
    await expect(page).toHaveURL(/login|\/$/);
  });
});
