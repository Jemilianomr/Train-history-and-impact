import { test, expect } from "@playwright/test";
import { buildInspection } from "../src/scene/inspection";
import { disposeObject } from "../src/scene/model";
import {
  rollingAngle,
  timeAtPhase,
  opposedSliders,
} from "../src/scene/mechanics";
import { trains } from "../src/data/trains";

test("volver a elegir el tren activo conserva sus métricas gráficas", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Configuración gráfica" }).click();
  const calls = page
    .locator(".performance-card dl > div")
    .filter({ hasText: "Llamadas de dibujo" })
    .locator("dd");
  await expect(calls).not.toHaveText("—");
  const before = await calls.textContent();
  await page.keyboard.press("Escape");
  await page.getByTestId("train-rocket").click();
  await page.getByRole("button", { name: "Configuración gráfica" }).click();
  await expect(calls).toHaveText(before!);
});

test("ruedas de distintos radios recorren la misma distancia sin deslizamiento", () => {
  for (const radius of [0.37, 0.46, 0.62, 0.8636])
    for (const time of [0, 1, 3.7]) {
      expect(rollingAngle(time, radius, 0.8636) * radius).toBeCloseTo(
        rollingAngle(time, 0.8636, 0.8636) * 0.8636,
        10,
      );
    }
});

test("el detalle 3D conserva las bielas y el pistón permanece dentro del cilindro", () => {
  const model = buildInspection(trains[0], "drive")!;
  const rod = model.root.getObjectByName("connecting-rod")!,
    piston = model.root.getObjectByName("piston")!;
  for (let degree = 0; degree <= 360; degree += 5) {
    model.update(timeAtPhase(degree));
    expect(rod.scale.y).toBeCloseTo(3, 10);
    expect(piston.position.x).toBeGreaterThan(1.2);
    expect(piston.position.x).toBeLessThan(3.6);
    expect(piston.position.y).toBe(0);
  }
  disposeObject(model.root);
});

test("pistones opuestos: holgura central y longitud constante de las seis bielas visibles", () => {
  expect(() => opposedSliders(0, 2, 0.2, 1)).toThrow(RangeError);
  const model = buildInspection(
      trains.find((t) => t.id === "deltic")!,
      "power",
    )!,
    rods: any[] = [];
  model.root.traverse((o) => {
    if (o.name === "deltic-rod") rods.push(o);
  });
  expect(rods).toHaveLength(6);
  for (let degree = 0; degree <= 360; degree += 10) {
    model.update(timeAtPhase(degree));
    for (const rod of rods) expect(rod.scale.y).toBeCloseTo(1.13, 10);
    const pair = opposedSliders((degree * Math.PI) / 180, 3.46, 0.22, 1.13);
    expect(pair.right - pair.left).toBeGreaterThan(0.7);
  }
  disposeObject(model.root);
});

test("los engranajes del detalle giran en sentidos opuestos con igual recorrido tangencial", () => {
  const model = buildInspection(
    trains.find((t) => t.id === "velaro")!,
    "drive",
  )!;
  for (const degree of [0, 45, 90, 180, 360]) {
    model.update(timeAtPhase(degree));
    const a = model.root.getObjectByName("pinion")!.rotation.z,
      b = model.root.getObjectByName("driven-gear")!.rotation.z;
    expect(a * 0.42 + b * 1.05).toBeCloseTo(0, 10);
  }
  disposeObject(model.root);
});

test("pantógrafos de rombo y de un brazo conservan la longitud de sus articulaciones", () => {
  for (const id of ["shinkansen", "velaro"]) {
    const model = buildInspection(trains.find((t) => t.id === id)!, "supply")!,
      lower: any[] = [],
      upper: any[] = [];
    model.root.traverse((o) => {
      if (o.name === "pantograph-lower") lower.push(o);
      if (o.name === "pantograph-upper") upper.push(o);
    });
    expect(lower).toHaveLength(id === "shinkansen" ? 4 : 2);
    expect(upper).toHaveLength(lower.length);
    for (let degree = 0; degree <= 360; degree += 15) {
      model.update(timeAtPhase(degree));
      lower.forEach((rod) =>
        expect(rod.scale.y).toBeCloseTo(id === "shinkansen" ? 2.6 : 3.1, 10),
      );
      upper.forEach((rod) =>
        expect(rod.scale.y).toBeCloseTo(id === "shinkansen" ? 2.6 : 2.5, 10),
      );
    }
    disposeObject(model.root);
  }
});

test("control de fase: pausa, cambia el detalle 3D y fija el esquema en la posición elegida", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("canvas").waitFor();
  await page.getByTestId("part-drive").click();
  await page.getByRole("button", { name: "Abrir detalle 3D" }).click();
  await expect(page.getByTestId("viewer")).toHaveAttribute(
    "data-inspection",
    "steam",
  );
  await page
    .getByRole("button", { name: "Situar mecanismo a 0 grados", exact: true })
    .click();
  await page.waitForTimeout(600);
  const before = await page.locator("canvas").screenshot();
  const sliderBefore = await page
    .locator("[data-slider]")
    .getAttribute("transform");
  await page
    .getByRole("button", { name: "Situar mecanismo a 180 grados", exact: true })
    .click();
  await page.waitForTimeout(600);
  await expect(
    page.getByRole("slider", { name: "Posición manual del mecanismo" }),
  ).toHaveValue("180");
  await expect(
    page.locator(".mechanism-preview svg[role=img]"),
  ).toHaveAttribute("data-phase", "180");
  await expect(
    page.getByRole("button", { name: "Animar mecanismos", exact: true }),
  ).toBeVisible();
  expect(
    await page.locator("[data-slider]").getAttribute("transform"),
  ).not.toBe(sliderBefore);
  expect((await page.locator("canvas").screenshot()).equals(before)).toBe(
    false,
  );
  await page
    .getByRole("slider", { name: "Posición manual del mecanismo" })
    .focus();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("slider", { name: "Posición manual del mecanismo" }),
  ).toHaveValue("360");
});

test("cerrar sucesivos detalles libera sus búferes WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const buffers = new Set<WebGLBuffer>(),
      proto = WebGL2RenderingContext.prototype,
      create = proto.createBuffer,
      remove = proto.deleteBuffer;
    (window as any).__workshopBuffers = () => buffers.size;
    proto.createBuffer = function () {
      const b = create.call(this);
      if (b) buffers.add(b);
      return b;
    };
    proto.deleteBuffer = function (b) {
      if (b) buffers.delete(b);
      return remove.call(this, b);
    };
  });
  await page.goto("/");
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(800);
  const baseline = await page.evaluate(() =>
    (window as any).__workshopBuffers(),
  );
  for (const [id, part] of [
    ["rocket", "power"],
    ["rocket", "drive"],
    ["deltic", "power"],
    ["deltic", "drive"],
    ["velaro", "drive"],
    ["velaro", "power"],
    ["velaro", "supply"],
    ["velaro", "running"],
    ["maglev", "power"],
  ]) {
    await page.getByTestId("train-" + id).click();
    await page.getByTestId("part-" + part).click();
    await page.getByRole("button", { name: "Abrir detalle 3D" }).click();
    await page.waitForTimeout(150);
  }
  await page.getByTestId("train-rocket").click();
  await page.waitForTimeout(800);
  expect(
    await page.evaluate(() => (window as any).__workshopBuffers()),
  ).toBeLessThanOrEqual(baseline);
});
