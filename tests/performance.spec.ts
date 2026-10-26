import { test, expect, type Page } from "@playwright/test";

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("viewer")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page.waitForTimeout(300);
}

// Access the actual production scene through its existing update method. No
// debug globals or test-only branches are shipped in the application.
async function inspectScene(page: Page) {
  await page.evaluate(async () => {
    const url = performance
      .getEntriesByType("resource")
      .find((e) => /\/assets\/engine-/.test(e.name))!.name;
    const { TrainScene } = await import(/* @vite-ignore */ url);
    const original = TrainScene.prototype.update;
    TrainScene.prototype.update = function (state: unknown) {
      (window as any).__scene = this;
      TrainScene.prototype.update = original;
      return original.call(this, state);
    };
  });
  await page.getByTestId("part-body").click();
}

test("arrastrar la cámara animada nunca crea cadenas RAF paralelas", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const request = requestAnimationFrame.bind(window),
      cancel = cancelAnimationFrame.bind(window),
      pending = new Set<number>();
    (window as any).__maxEngineFrames = 0;
    window.requestAnimationFrame = (callback) => {
      const engine = new Error().stack!.includes("/assets/engine-");
      const id = request((time) => {
        pending.delete(id);
        callback(time);
      });
      if (engine) pending.add(id);
      (window as any).__maxEngineFrames = Math.max(
        (window as any).__maxEngineFrames,
        pending.size,
      );
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      cancel(id);
    };
  });
  await ready(page);
  await page.getByRole("button", { name: "Configuración gráfica" }).click();
  await page.getByRole("button", { name: /Alta calidad/ }).click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Animar mecanismos", exact: true })
    .click();
  const bounds = (await page.locator("canvas").boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width * 0.5,
    bounds.y + bounds.height * 0.6,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.65,
    bounds.y + bounds.height * 0.55,
    { steps: 4 },
  );
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page
    .getByRole("button", { name: "Pausar mecanismos", exact: true })
    .click();
  expect(await page.evaluate(() => (window as any).__maxEngineFrames)).toBe(1);
});

test("una pantalla de 144 Hz respeta los límites 30/60 incluso con cambios continuos de cámara", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const request = requestAnimationFrame.bind(window),
      cancel = cancelAnimationFrame.bind(window);
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = -1;
    (window as any).__manualFrames = { callbacks, time: 0 };
    window.requestAnimationFrame = (callback) => {
      if (!new Error().stack!.includes("/assets/engine-"))
        return request(callback);
      callbacks.set(id, callback);
      return id--;
    };
    window.cancelAnimationFrame = (id) => {
      if (id < 0) callbacks.delete(id);
      else cancel(id);
    };
  });
  await ready(page);
  await inspectScene(page);
  const counts = await page.evaluate(() => {
    const scene = (window as any).__scene,
      clock = (window as any).__manualFrames;
    let draws = 0;
    // Count submitted scene frames independently of the software GPU speed.
    scene.renderer.render = () => {
      draws++;
    };
    scene.controls.update = () =>
      scene.controls.dispatchEvent({ type: "change" });
    const results = [];
    for (const quality of ["balanced", "high"]) {
      clock.time = 0;
      scene.lastRender = 0;
      scene.lastTime = 0;
      draws = 0;
      scene.update({ ...scene.state, playing: true, quality });
      for (let i = 0; i < 144; i++) {
        clock.time += 1000 / 144;
        const callbacks = [...clock.callbacks.values()];
        clock.callbacks.clear();
        callbacks.forEach((fn: any) => fn(clock.time));
        if (clock.callbacks.size !== 1)
          throw new Error("Duplicate animation chain");
      }
      results.push(draws);
    }
    return results;
  });
  expect(counts[0]).toBeGreaterThanOrEqual(29);
  expect(counts[0]).toBeLessThanOrEqual(30);
  expect(counts[1]).toBeGreaterThanOrEqual(59);
  expect(counts[1]).toBeLessThanOrEqual(60);
});

test("las sombras en pausa se reutilizan al girar y se actualizan al cambiar la fase", async ({
  page,
}) => {
  await ready(page);
  await inspectScene(page);
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const scene = (window as any).__scene,
      render = scene.renderer.render.bind(scene.renderer);
    (window as any).__shadowPasses = 0;
    (window as any).__sceneDraws = 0;
    scene.renderer.render = (...args: any[]) => {
      (window as any).__sceneDraws++;
      if (scene.renderer.shadowMap.needsUpdate)
        (window as any).__shadowPasses++;
      return render(...args);
    };
  });
  await page
    .getByRole("button", { name: "Vista lateral", exact: true })
    .click();
  await page.waitForTimeout(600);
  expect(
    await page.evaluate(() => (window as any).__sceneDraws),
  ).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as any).__shadowPasses)).toBe(0);
  await page
    .getByRole("button", { name: "Situar mecanismo a 90 grados", exact: true })
    .click();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as any).__shadowPasses)).toBe(1);
});

test("detalle y despiece reutilizan un único detalle sin volver a cargar sus búferes", async ({
  page,
}) => {
  await ready(page);
  await inspectScene(page);
  await page.getByTestId("part-drive").click();
  await page.getByRole("button", { name: "Abrir detalle 3D" }).click();
  await expect(page.getByTestId("viewer")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    (window as any).__detail = (window as any).__scene.inspection;
    const gl = (window as any).__scene.renderer.getContext();
    const bufferData = gl.bufferData.bind(gl);
    gl.bufferData = (...args: any[]) => {
      (window as any).__uploads++;
      return bufferData(...args);
    };
  });
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Desmontado", exact: true }).click();
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      (window as any).__uploads = 0;
    });
    await page.getByRole("button", { name: "Abrir detalle 3D" }).click();
    await page.waitForTimeout(300);
    expect(
      await page.evaluate(
        () => (window as any).__detail === (window as any).__scene.inspection,
      ),
    ).toBe(true);
    expect(await page.evaluate(() => (window as any).__uploads)).toBe(0);
  }
  await page.getByRole("button", { name: "Ensamblado", exact: true }).click();
  expect(
    await page.evaluate(() => (window as any).__scene.inspection.root.visible),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Volver a la ficha del tren" })
    .click();
  const canvas = page.locator("canvas"),
    bounds = (await canvas.boundingBox())!;
  for (const [x, y] of [
    [0.52, 0.53],
    [0.5, 0.62],
    [0.43, 0.58],
    [0.6, 0.58],
    [0.4, 0.65],
  ]) {
    await canvas.click({
      position: { x: bounds.width * x, y: bounds.height * y },
    });
    if (await page.locator(".part-title").count()) break;
  }
  await expect(page.locator(".part-title")).toBeVisible();
  await page.getByTestId("train-deltic").click();
  await expect(page.getByTestId("viewer")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  expect(await page.evaluate(() => (window as any).__scene.inspection)).toBe(
    null,
  );
});

test("la compilación de un tren anterior no termina la preparación del tren actual", async ({
  page,
}) => {
  await ready(page);
  await inspectScene(page);
  await page.evaluate(() => {
    const scene = (window as any).__scene;
    // Exercise the parallel-compilation branch even on SwiftShader, which does
    // not provide KHR_parallel_shader_compile. Resolve jobs in a controlled order.
    const has = scene.renderer.extensions.has.bind(scene.renderer.extensions);
    (window as any).__restoreSupport = () => {
      scene.renderer.extensions.has = has;
    };
    scene.renderer.extensions.has = (name: string) =>
      name === "KHR_parallel_shader_compile" || has(name);
    const jobs: { release?: () => void }[] = ((window as any).__shaderJobs =
      []);
    scene.renderer.compileAsync = () => {
      const job: { release?: () => void } = {};
      jobs.push(job);
      return new Promise<void>((resolve) => {
        job.release = resolve;
      });
    };
  });
  await page.getByTestId("train-bigboy").click();
  await page.getByTestId("train-velaro").click();
  await page.waitForFunction(
    () =>
      (window as any).__shaderJobs.length === 2 &&
      (window as any).__shaderJobs.every((j: any) => j.release),
  );
  await page.evaluate(() => (window as any).__shaderJobs[0].release());
  await expect(page.getByTestId("viewer")).toHaveAttribute("aria-busy", "true");
  await page.evaluate(() => {
    (window as any).__restoreSupport();
    (window as any).__shaderJobs[1].release();
  });
  await expect(page.getByTestId("viewer")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  expect(
    await page.evaluate(() => (window as any).__scene.state.train.id),
  ).toBe("velaro");
});

test("cambios rápidos durante la preparación muestran únicamente el último tren y detalle", async ({
  page,
}) => {
  await ready(page);
  await inspectScene(page);
  for (const id of ["bigboy", "velaro", "deltic", "maglev"]) {
    await page.getByTestId("train-" + id).click();
    await page.getByTestId("part-power").click();
    await page.getByRole("button", { name: "Abrir detalle 3D" }).click();
    await page.getByRole("button", { name: "Desmontado", exact: true }).click();
  }
  await page.getByRole("button", { name: "Abrir detalle 3D" }).click();
  await expect(page.getByTestId("viewer")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  expect(
    await page.evaluate(() => {
      const scene = (window as any).__scene;
      return [
        scene.state.train.id,
        scene.inspection.kind,
        scene.inspection.root.visible,
        scene.model.root.visible,
      ];
    }),
  ).toEqual(["maglev", "maglev", true, false]);
  const first = await page.evaluate(
    () => (window as any).__scene.inspection.kind,
  );
  await page.waitForTimeout(600);
  expect(
    await page.evaluate(() => (window as any).__scene.inspection.kind),
  ).toBe(first);
});
