// e2e/guide.spec.ts
// E2E tests for the public /guide section (no authentication required)

import { test, expect } from "@playwright/test";

test.describe("Public Guide (/guide)", () => {
  test("Guide index page loads", async ({ page }) => {
    await page.goto("/guide");
    await expect(page).toHaveTitle(/guide|learn/i);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Guide sidebar navigation is visible", async ({ page }) => {
    await page.goto("/guide");
    // Sidebar links
    await expect(page.getByRole("link", { name: /scanner/i })).toBeVisible();
  });

  test("Scanners page loads without login", async ({ page }) => {
    await page.goto("/guide/scanners");
    await expect(page.getByRole("main")).toBeVisible();
    // Should not redirect to login
    await expect(page).not.toHaveURL(/login/);
  });

  test("Architecture page loads without login", async ({ page }) => {
    await page.goto("/guide/architecture");
    await expect(page.getByRole("main")).toBeVisible();
  });
});
