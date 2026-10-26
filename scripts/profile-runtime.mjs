import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const output = process.argv[2] || "docs/audit/performance/runtime.json";
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
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window),
      cancel = window.cancelAnimationFrame.bind(window),
      pending = new Map();
    const measure = (window.__runtime = {
      maxPending: 0,
      callbacks: 0,
      longTasks: [],
      draws: 0,
      bufferBytes: 0,
      programs: 0,
    });
    window.requestAnimationFrame = (callback) => {
      const engine = new Error().stack.includes("/assets/engine-");
      let id = request((time) => {
        pending.delete(id);
        if (engine) measure.callbacks++;
        callback(time);
      });
      pending.set(id, engine);
      measure.maxPending = Math.max(
        measure.maxPending,
        [...pending.values()].filter(Boolean).length,
      );
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      cancel(id);
    };
    new PerformanceObserver((list) =>
      measure.longTasks.push(
        ...list.getEntries().map((e) => ({
          start: Math.round(e.startTime),
          duration: Math.round(e.duration),
        })),
      ),
    ).observe({ type: "longtask", buffered: true });
    const proto = WebGL2RenderingContext.prototype;
    for (const name of [
      "drawElements",
      "drawArrays",
      "drawElementsInstanced",
      "drawArraysInstanced",
      "bufferData",
      "createProgram",
    ]) {
      const original = proto[name];
      proto[name] = function (...args) {
        if (name.startsWith("draw")) measure.draws++;
        if (name === "createProgram") measure.programs++;
        if (name === "bufferData")
          measure.bufferBytes +=
            typeof args[1] === "number" ? args[1] : args[1]?.byteLength || 0;
        return original.apply(this, args);
      };
    }
  });
  await page.goto("http://127.0.0.1:4173/");
  await page.getByText("Preparando el diorama…").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Configuración gráfica" }).click();
  await page.getByRole("button", { name: /Alta calidad/ }).click();
  const renderer = await page.locator(".renderer-name").textContent();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Animar mecanismos", exact: true })
    .click();
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.55, {
    steps: 4,
  });
  await page.mouse.up();
  await page.waitForTimeout(600);
  await page
    .getByRole("button", { name: "Pausar mecanismos", exact: true })
    .click();
  await page.waitForTimeout(800);
  const rows = [];
  for (const id of ["bigboy", "deltic", "velaro"]) {
    const start = await page.evaluate(() => performance.now());
    await page.getByTestId("train-" + id).click();
    await page.getByTestId("part-drive").click();
    await page.getByRole("button", { name: "Abrir detalle 3D" }).click();
    await page.getByRole("button", { name: "Desmontado", exact: true }).click();
    await page.getByRole("button", { name: "Abrir detalle 3D" }).click();
    await page.waitForTimeout(200);
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="viewer"]')
          ?.getAttribute("aria-busy") !== "true",
    );
    rows.push({
      train: id,
      interactionMs: Math.round(
        (await page.evaluate(() => performance.now())) - start,
      ),
    });
  }
  const measured = await page.evaluate(() => window.__runtime);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        browser: browser.version(),
        renderer,
        profile: "high",
        viewport: { width: 1440, height: 1000 },
        note: "Instrumented SwiftShader run; software timings do not represent the RTX 3060. RAF count tracks engine callbacks only.",
        ...measured,
        rows,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      output,
      maxPending: measured.maxPending,
      callbacks: measured.callbacks,
      longTasks: measured.longTasks.length,
      bufferBytes: measured.bufferBytes,
      errors,
    }),
  );
} finally {
  await browser.close();
}
