import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

// Run against a production preview: npm run preview -- --port 4173
// This measures software WebGL in Linux CI, not the user's NVIDIA hardware.
const output = process.argv[2] || "docs/audit/performance/visual";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: [
    "--disable-dev-shm-usage",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1100 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [],
  warnings = [],
  rows = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
  if (message.type() === "warning") warnings.push(message.text());
});
async function record(train, part = null) {
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="viewer"]')
        ?.getAttribute("aria-busy") !== "true",
  );
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `${output}/${train}${part ? "-" + part : ""}.png`,
  });
  await page.getByRole("button", { name: "Configuración gráfica" }).click();
  const stats = await page
    .locator(".performance-card dl > div")
    .evaluateAll((items) =>
      Object.fromEntries(
        items.map((item) => [
          item.querySelector("dt").textContent,
          item.querySelector("dd").textContent,
        ]),
      ),
    );
  rows.push({
    train,
    part,
    ...stats,
    renderer: await page.locator(".renderer-name").textContent(),
  });
  await page.keyboard.press("Escape");
  console.log(`Captured ${train}${part ? "/" + part : ""}`);
}
try {
  await page.goto("http://127.0.0.1:4173/");
  await page.locator("canvas").waitFor();
  await page.getByText("Preparando el diorama…").waitFor({ state: "hidden" });
  for (const id of [
    "rocket",
    "garratt",
    "bigboy",
    "deltic",
    "shinkansen",
    "tgv",
    "velaro",
    "maglev",
  ]) {
    await page.getByTestId("train-" + id).click();
    await record(id);
  }
  for (const [id, part] of [
    ["rocket", "power"],
    ["rocket", "drive"],
    ["deltic", "power"],
    ["deltic", "drive"],
    ["deltic", "running"],
    ["shinkansen", "supply"],
    ["tgv", "running"],
    ["velaro", "drive"],
    ["velaro", "power"],
    ["velaro", "supply"],
    ["velaro", "running"],
    ["maglev", "power"],
  ]) {
    await page.getByTestId("train-" + id).click();
    await page.getByTestId("part-" + part).click();
    await page.getByRole("button", { name: "Abrir detalle 3D" }).click();
    await record(id, part);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId("train-rocket").click();
  await page.getByTestId("part-drive").click();
  await page.getByRole("button", { name: "Abrir detalle 3D" }).click();
  await page.getByTestId("viewer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${output}/mobile-viewer.png` });
  await page.locator(".phase-control").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/mobile-controls.png` });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  if (overflow) errors.push("Horizontal overflow at 390px");
  await writeFile(
    `${output}/render-metrics.json`,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        browser: browser.version(),
        viewport: { width: 1600, height: 1100 },
        quality: "balanced",
        sample:
          "Paused production scenes. Render counters include shadow passes. FPS and VRAM are not benchmarked. SwiftShader software rendering, not RTX 3060.",
        rows,
        mobile: { width: 390, height: 844, horizontalOverflow: overflow },
        errors,
        warnings,
      },
      null,
      2,
    ) + "\n",
  );
  if (errors.length || warnings.length)
    throw new Error(JSON.stringify({ errors, warnings }));
} finally {
  await browser.close();
}
