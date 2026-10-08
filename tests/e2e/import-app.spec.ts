import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { importAppPorts, type ImportAppVariant } from "../../playwright.config.ts";

const csv = await readFile(new URL("../fixtures/import-app/sample-contacts.csv", import.meta.url), "utf8");

const baseFor = (variant: ImportAppVariant): string => `http://127.0.0.1:${importAppPorts[variant]}`;

async function reset(request: APIRequestContext, variant: ImportAppVariant): Promise<void> {
  await request.post(`${baseFor(variant)}/__reset`);
}

async function consumeImportFault(page: Page, variant: ImportAppVariant): Promise<void> {
  await page.request.post(`${baseFor(variant)}/api/import`, { data: JSON.stringify({}) });
}

async function openMapping(page: Page, variant: ImportAppVariant): Promise<void> {
  await page.goto(baseFor(variant));
  await page.getByLabel("Paste CSV").fill(csv);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Map columns" })).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await Promise.all((Object.keys(importAppPorts) as ImportAppVariant[]).map((variant) => reset(request, variant)));
});

test("correct keeps mapping after a temporary import failure and retries", async ({ page }) => {
  await openMapping(page, "correct");
  await page.getByLabel("Name").selectOption("team");
  await page.getByLabel("Team").selectOption("name");
  await page.getByRole("button", { name: "Import", exact: true }).click();

  await expect(page.getByRole("alert")).toContainText("temporarily unavailable");
  await expect(page.locator("#status")).toHaveText("");
  await expect(page.getByLabel("Name")).toHaveValue("team");
  await expect(page.getByLabel("Team")).toHaveValue("name");
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { name: "11 contacts imported, 1 skipped (invalid email)" })).toBeVisible({ timeout: 10_000 });
});

test("lost-input returns to upload and drops the mapping after a temporary failure", async ({ page }) => {
  await openMapping(page, "lost-input");
  await page.getByRole("button", { name: "Import", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Upload contacts" })).toBeVisible();
  await expect(page.locator("#status")).toHaveText("");
  await expect(page.getByRole("heading", { name: "Map columns" })).toBeHidden();
});

for (const variant of ["correct", "double-action"] as const) {
  test(`${variant} handles a rapid double action`, async ({ page }) => {
    await consumeImportFault(page, variant);
    await openMapping(page, variant);
    await page.getByRole("button", { name: "Import", exact: true }).dblclick();

    const expected = variant === "correct" ? "11 contacts imported, 1 skipped (invalid email)" : "22 contacts imported, 2 skipped (invalid email)";
    await expect(page.getByRole("heading", { name: expected })).toBeVisible({ timeout: 10_000 });
  });
}

test("correct keeps Import disabled after the job request returns", async ({ page }) => {
  await consumeImportFault(page, "correct");
  await openMapping(page, "correct");
  const button = page.getByRole("button", { name: "Import", exact: true });
  const importResponse = page.waitForResponse((response) => response.url().endsWith("/api/import") && response.request().method() === "POST");
  await button.click();
  await importResponse;
  await expect(button).toBeDisabled();
  await button.evaluate((element) => (element as HTMLButtonElement).click());
  await expect(page.getByRole("heading", { name: "11 contacts imported, 1 skipped (invalid email)" })).toBeVisible({ timeout: 10_000 });
});

test("correct previews every row and labels invalid email textually", async ({ page }) => {
  await openMapping(page, "correct");
  await expect(page.locator("#preview-body tr")).toHaveCount(12);
  await expect(page.getByText("Invalid email — will be skipped", { exact: true })).toBeVisible();
});

test("correct shows imported contacts on the result step", async ({ page }) => {
  await consumeImportFault(page, "correct");
  await openMapping(page, "correct");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByRole("heading", { name: "11 contacts imported, 1 skipped (invalid email)" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "View imported contacts" })).toBeVisible();
  await expect(page.locator("#imported-contacts li")).toHaveCount(11);
  await expect(page.locator("#imported-contacts")).toContainText("Ada Example — ada@example.com");
});

for (const variant of ["correct", "confusing-status"] as const) {
  test(`${variant} exposes its processing status behavior`, async ({ page }) => {
    await consumeImportFault(page, variant);
    await openMapping(page, variant);
    await page.getByRole("button", { name: "Import", exact: true }).click();

    if (variant === "correct") {
      await expect(page.locator("body")).not.toContainText(/complete/i);
    } else {
      await expect(page.getByText("Import complete", { exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: /Importing/ })).toBeVisible();
  });
}

test("correct keeps Import visible and usable at tablet width", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await openMapping(page, "correct");
  const button = page.getByRole("button", { name: "Import", exact: true });
  await expect(button).toBeInViewport();
  await button.click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("tablet-layout clips Import only at tablet width", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await openMapping(page, "tablet-layout");
  const container = page.locator("#mapping-container");
  const button = page.getByRole("button", { name: "Import", exact: true });
  const containerBox = await container.boundingBox();
  const buttonBox = await button.boundingBox();
  expect(containerBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(buttonBox!.y).toBeGreaterThan(containerBox!.y + containerBox!.height);
  const buttonCanBeHit = await button.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return hit === element || element.contains(hit);
  });
  expect(buttonCanBeHit).toBe(false);
});

test("correct completes the happy path at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await consumeImportFault(page, "correct");
  await openMapping(page, "correct");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByRole("heading", { name: "11 contacts imported, 1 skipped (invalid email)" })).toBeVisible({ timeout: 10_000 });
});

const inDialog = (page: Page) => page.evaluate(() => Boolean(document.activeElement?.closest("#discard-dialog")));
// A modal may let Tab leave to the browser UI (body), but never to the page behind it.
const onPage = (page: Page) => page.evaluate(() => Boolean(document.activeElement?.closest("main")));

test("correct opens a real modal dialog with keyboard support and a labelled Team select", async ({ page }) => {
  await openMapping(page, "correct");
  await expect(page.getByLabel("Team")).toHaveAccessibleName("Team");
  const cancel = page.getByRole("button", { name: "Cancel import" });
  await cancel.click();
  const dialog = page.getByRole("dialog", { name: "Discard this import?" });
  await expect(dialog).toBeVisible();
  expect(await inDialog(page)).toBe(true);
  for (let index = 0; index < 4; index++) {
    await page.keyboard.press("Tab");
    expect(await onPage(page)).toBe(false);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(cancel).toBeFocused();
  await cancel.click();
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Upload contacts" })).toBeVisible();
});

test("a11y-dialog leaves focus behind the dialog, ignores Escape and leaves Team unnamed", async ({ page }) => {
  await openMapping(page, "a11y-dialog");
  await expect(page.locator("#mapping-team")).toHaveAccessibleName("");
  const cancel = page.getByRole("button", { name: "Cancel import" });
  await cancel.click();
  const dialog = page.locator("#discard-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Discard this import?");
  await expect(cancel).toBeFocused();
  expect(await inDialog(page)).toBe(false);
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Import", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => inDialog(page)).toBe(false);
});
