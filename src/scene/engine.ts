import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildTrain, disposeObject, type TrainModel } from "./model";
import { buildInspection, type InspectionModel } from "./inspection";
import { timeAtPhase } from "./mechanics";
import { inspectionKind } from "../data/inspection";
import type { PartId, Train, ViewMode } from "../types";

export interface SceneState {
  train: Train;
  selected: PartId | null;
  mode: ViewMode;
  playing: boolean;
  speed: number;
  quality: "balanced" | "high";
  phase: number;
  seek: number;
}
export interface SceneStats {
  fps: number;
  triangles: number;
  calls: number;
  geometries: number;
  renderer: string;
}

export class TrainScene {
  private scene = new T.Scene();
  private camera = new T.PerspectiveCamera(35, 1, 0.1, 600);
  private renderer: T.WebGLRenderer;
  private studioMap: T.WebGLRenderTarget;
  private controls: OrbitControls;
  private model!: TrainModel;
  private inspection: InspectionModel | null = null;
  private environment = new T.Group();
  private resizeObserver: ResizeObserver;
  private state: SceneState;
  private frame = 0;
  private framesLeft = 2;
  private disposed = false;
  private elapsed = 0;
  private lastTime = 0;
  private lastRender = 0;
  private sampleTime = 0;
  private sampleFrames = 0;
  private metricsPending = true;
  private ray = new T.Raycaster();
  private pointer = new T.Vector2();
  private down = { x: 0, y: 0 };
  private sun: T.DirectionalLight;
  private rendererName = "WebGL 2";
  private contextLost = false;
  private preparing = false;
  private preparation = 0;
  constructor(
    private host: HTMLElement,
    state: SceneState,
    private onSelect: (id: PartId) => void,
    private onStats: (stats: SceneStats) => void,
    private onError: (message: string) => void,
    private onPreparing: (preparing: boolean) => void = () => {},
  ) {
    this.state = state;
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor("#e5e9df", 0);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFShadowMap;
    // Camera movement does not change the light-space depth map.
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    const studio = new RoomEnvironment(),
      pmrem = new T.PMREMGenerator(this.renderer);
    this.studioMap = pmrem.fromScene(studio, 0.04, 0.1, 100, { size: 128 });
    studio.dispose();
    pmrem.dispose();
    this.scene.environment = this.studioMap.texture;
    this.scene.environmentIntensity = 0.5;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Modelo tridimensional. Arrastra para girar; usa la rueda para acercarte. Las piezas también se pueden seleccionar en la lista.",
    );
    this.renderer.domElement.setAttribute("role", "img");
    host.appendChild(this.renderer.domElement);
    const gl = this.renderer.getContext();
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    if (debug)
      this.rendererName = String(
        gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),
      );
    this.scene.add(new T.HemisphereLight("#fff9e8", "#8c9a83", 2.3));
    this.sun = new T.DirectionalLight("#fff2d7", 2.7);
    this.sun.position.set(-15, 27, 16);
    this.sun.castShadow = true;
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.04;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 100;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    const fill = new T.DirectionalLight("#e5f4f4", 1.1);
    fill.position.set(10, 10, -15);
    this.scene.add(fill);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minPolarAngle = 0.13;
    this.controls.addEventListener("change", this.invalidate);
    this.scene.add(this.environment);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(host);
    this.renderer.domElement.addEventListener("pointerdown", this.onDown);
    this.renderer.domElement.addEventListener("pointerup", this.onUp);
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.onContextLost,
    );
    document.addEventListener("visibilitychange", this.visibility);
    this.update(state);
    this.resize();
  }
  private onContextLost = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.preparation++;
    this.onPreparing(false);
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.onError(
      "Se perdió el contexto gráfico. Puedes volver a abrir el visor; las fichas siguen disponibles.",
    );
  };
  private onDown = (e: PointerEvent) => {
    this.down = { x: e.clientX, y: e.clientY };
  };
  private onUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 5)
      return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    if (this.activeInspection || this.preparing) return;
    const hits = this.ray.intersectObjects(
      Object.values(this.model.parts).filter((p) => p.visible),
      true,
    );
    if (hits.length) {
      const id = hits[0].object.userData.part as PartId;
      if (id) this.onSelect(id);
    }
  };
  private visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.lastTime = 0;
    } else this.invalidate();
  };
  private resize = () => {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h || this.disposed) return;
    const aspectChanged = Math.abs(this.camera.aspect - w / h) > 0.001;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // The initial model is built before the host dimensions are known.
    // Refit after measuring the viewport, including responsive layout changes.
    if (aspectChanged && this.model) this.resetCamera();
    this.invalidate();
  };
  private buildEnvironment(train: Train) {
    disposeObject(this.environment);
    this.environment.clear();
    const len = train.length + 6,
      width = train.id === "maglev" ? 6.2 : 6;
    const mat = (color: string) =>
      new T.MeshStandardMaterial({ color, roughness: 1 });
    const slab = new T.Mesh(
      new T.BoxGeometry(len, 0.42, width),
      mat("#c4ccbb"),
    );
    slab.position.y = -0.42;
    slab.receiveShadow = true;
    this.environment.add(slab);
    const bed = new T.Mesh(
      new T.BoxGeometry(len, 0.16, train.id === "maglev" ? 4.8 : 3.1),
      mat("#b1b9a9"),
    );
    bed.position.y = -0.14;
    bed.receiveShadow = true;
    this.environment.add(bed);
    if (train.id !== "maglev") {
      const count = Math.ceil(len / 0.65);
      const sleepers = new T.InstancedMesh(
        new T.BoxGeometry(0.23, 0.12, 2.6),
        mat("#8c8b72"),
        count,
      );
      for (let i = 0; i < count; i++)
        sleepers.setMatrixAt(
          i,
          new T.Matrix4().makeTranslation(
            -len / 2 + ((i + 0.5) * len) / count,
            -0.015,
            0,
          ),
        );
      sleepers.receiveShadow = true;
      this.environment.add(sleepers);
      for (const side of [-1, 1]) {
        const rail = new T.Mesh(
          new T.BoxGeometry(len, 0.14, 0.085),
          mat("#77847b"),
        );
        rail.position.set(0, 0.08, (side * train.gauge) / 2);
        rail.receiveShadow = true;
        this.environment.add(rail);
        const foot = new T.Mesh(
          new T.BoxGeometry(len, 0.035, 0.15),
          mat("#737b6b"),
        );
        foot.position.set(0, 0.025, (side * train.gauge) / 2);
        this.environment.add(foot);
      }
    }
    // Instanced edging and fixed deterministic foliage keep the diorama lightweight.
    const shrubs = new T.InstancedMesh(
      new T.IcosahedronGeometry(0.28, 0),
      mat("#9ba88d"),
      18,
    );
    for (let i = 0; i < 18; i++) {
      const x = Math.sin(i * 17.4) * len * 0.45,
        z = (i % 2 ? 1 : -1) * (2.2 + Math.abs(Math.sin(i * 4)) * 0.55);
      const scale = 0.7 + Math.abs(Math.sin(i * 5));
      const m = new T.Matrix4().compose(
        new T.Vector3(x, -0.12, z),
        new T.Quaternion(),
        new T.Vector3(scale, 0.7 * scale, scale),
      );
      shrubs.setMatrixAt(i, m);
    }
    this.environment.add(shrubs);
    const ground = new T.Mesh(
      new T.PlaneGeometry(250, 250),
      new T.ShadowMaterial({ color: "#586d52", opacity: 0.12 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.635;
    ground.receiveShadow = true;
    this.environment.add(ground);
    const extent = Math.max(12, len * 0.7);
    const c = this.sun.shadow.camera;
    c.left = -extent;
    c.right = extent;
    c.top = extent;
    c.bottom = -extent;
    c.updateProjectionMatrix();
  }
  update(next: SceneState) {
    if (this.disposed || this.contextLost) return;
    const first = !this.model,
      changed = first || this.state.train.id !== next.train.id;
    const qualityChanged = first || this.state.quality !== next.quality;
    const oldMode = this.state.mode;
    const oldSelected = this.state.selected;
    const phaseChanged = this.state.seek !== next.seek;
    const selectionChanged = first || oldSelected !== next.selected;
    const layoutChanged = changed || oldMode !== next.mode || selectionChanged;
    this.state = next;
    this.metricsPending = true;
    if (changed) {
      if (this.inspection) {
        this.scene.remove(this.inspection.root);
        disposeObject(this.inspection.root);
        this.inspection = null;
      }
      if (this.model) {
        this.scene.remove(this.model.root);
        disposeObject(this.model.root);
      }
      this.model = buildTrain(next.train);
      this.scene.add(this.model.root);
      this.elapsed = 0;
      this.model.update(0);
      this.buildEnvironment(next.train);
      this.renderer.renderLists.dispose();
    }
    if (qualityChanged) {
      this.renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, next.quality === "high" ? 2 : 1.25),
      );
      const size = next.quality === "high" ? 2048 : 1024;
      this.sun.shadow.mapSize.set(size, size);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
      this.renderer.shadowMap.needsUpdate = true;
    }
    const kind =
      next.mode === "isolated"
        ? inspectionKind(next.train, next.selected)
        : null;
    let newInspection = false;
    // Keep at most one detail for the current train. Switching between exploded
    // and isolated views reuses its geometry, buffers and compiled materials.
    if (kind && kind !== this.inspection?.kind && next.selected) {
      if (this.inspection) {
        this.scene.remove(this.inspection.root);
        disposeObject(this.inspection.root);
      }
      this.inspection = buildInspection(next.train, next.selected);
      if (this.inspection) this.scene.add(this.inspection.root);
      newInspection = true;
      this.renderer.renderLists.dispose();
    }
    if (this.inspection)
      this.inspection.root.visible = kind === this.inspection.kind;
    this.model.root.visible = !this.activeInspection;
    if (changed || phaseChanged) {
      this.elapsed = timeAtPhase(next.phase);
      this.lastTime = 0;
    }
    if (layoutChanged || phaseChanged) {
      if (this.activeInspection) this.activeInspection.update(this.elapsed);
      else this.model.update(this.elapsed);
      this.renderer.shadowMap.needsUpdate = true;
    }
    const offsets: Record<PartId, T.Vector3> = {
      body: new T.Vector3(0, 4.5, 0),
      power: new T.Vector3(0, 1.6, -2.3),
      drive: new T.Vector3(0, 1, 2.8),
      running: new T.Vector3(0, 0, 0),
      supply: new T.Vector3(0, 2.3, 4),
    };
    if (layoutChanged)
      for (const [id, g] of Object.entries(this.model.parts)) {
        g.visible =
          next.mode !== "isolated" || !next.selected || id === next.selected;
        g.position.copy(
          next.mode === "exploded" ? offsets[id as PartId] : new T.Vector3(),
        );
        g.traverse((o) => {
          if (o.userData.cover)
            o.visible = !(next.mode === "isolated" && id === next.selected);
          if (o.userData.detail)
            o.visible = next.mode === "isolated" && id === next.selected;
          if ((changed || selectionChanged) && o instanceof T.Mesh) {
            const m = o.material as T.MeshStandardMaterial;
            m.emissive.set(id === next.selected ? "#9b672e" : "#000000");
            m.emissiveIntensity = id === next.selected ? 0.14 : 0;
          }
        });
      }
    this.environment.visible = next.mode !== "isolated";
    if (
      changed ||
      oldMode !== next.mode ||
      (next.mode === "isolated" && oldSelected !== next.selected)
    )
      this.resetCamera();
    if (changed || newInspection)
      this.prepare(
        newInspection && this.inspection ? this.inspection.root : this.scene,
      );
    this.invalidate();
  }
  private get activeInspection() {
    return this.inspection?.root.visible ? this.inspection : null;
  }
  private prepare(object: T.Object3D) {
    const version = ++this.preparation;
    this.preparing = true;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.onPreparing(true);
    // KHR_parallel_shader_compile lets the browser finish new shaders without
    // synchronously waiting for them in the first visible draw.
    // Without the extension, keep Three.js's ordinary first-draw compilation:
    // compileAsync would only add a timer and a synchronous precompilation pass.
    const compilation = this.renderer.extensions.has(
      "KHR_parallel_shader_compile",
    )
      ? this.renderer.compileAsync(object, this.camera, this.scene)
      : Promise.resolve();
    void compilation
      .then(() => {
        if (this.disposed || this.contextLost || version !== this.preparation)
          return;
        this.preparing = false;
        this.lastTime = 0;
        this.onPreparing(false);
        this.invalidate();
      })
      .catch((error: unknown) => {
        if (this.disposed || this.contextLost || version !== this.preparation)
          return;
        this.preparing = false;
        this.onPreparing(false);
        this.onError(
          error instanceof Error
            ? error.message
            : "No se pudo preparar el modelo.",
        );
      });
  }
  resetCamera = () => {
    this.model.root.updateMatrixWorld(true);
    this.activeInspection?.root.updateMatrixWorld(true);
    const obj =
      this.activeInspection?.root ??
      (this.state.mode === "isolated" && this.state.selected
        ? this.model.parts[this.state.selected]
        : this.model.root);
    const bounds = new T.Box3().setFromObject(obj);
    if (this.state.mode !== "isolated")
      bounds.union(
        new T.Box3(
          new T.Vector3(-this.model.length / 2 - 3, -0.65, -3),
          new T.Vector3(this.model.length / 2 + 3, 0.1, 3),
        ),
      );
    const center = bounds.getCenter(new T.Vector3());
    const direction = (
      this.activeInspection?.kind === "deltic"
        ? new T.Vector3(-1, 0.24, 0.38)
        : new T.Vector3(-0.5, 0.39, 0.86)
    ).normalize();
    const shadowExtent = Math.max(
        6,
        bounds.getSize(new T.Vector3()).length() * 0.6,
      ),
      shadow = this.sun.shadow.camera;
    shadow.left = -shadowExtent;
    shadow.right = shadowExtent;
    shadow.top = shadowExtent;
    shadow.bottom = -shadowExtent;
    shadow.updateProjectionMatrix();
    this.sun.target.position.copy(center);
    this.sun.position.copy(center).add(new T.Vector3(-15, 27, 16));
    const right = new T.Vector3()
      .crossVectors(new T.Vector3(0, 1, 0), direction)
      .normalize();
    const up = new T.Vector3().crossVectors(direction, right).normalize();
    const tanV = Math.tan(T.MathUtils.degToRad(this.camera.fov / 2)),
      tanH = tanV * this.camera.aspect;
    let dist = 0;
    // Fit all eight projected corners, including perspective depth, not just world-space width.
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const c = new T.Vector3(x, y, z).sub(center),
            depth = c.dot(direction);
          dist = Math.max(
            dist,
            depth + Math.abs(c.dot(right)) / tanH,
            depth + Math.abs(c.dot(up)) / tanV,
          );
        }
    const distance = Math.max(6, dist * (this.activeInspection ? 1.25 : 1.12));
    this.controls.target.copy(center);
    this.camera.position.copy(center).add(direction.multiplyScalar(distance));
    this.controls.minDistance = Math.max(2, distance * 0.13);
    this.controls.maxDistance = distance * 3;
    this.controls.update();
    this.renderer.shadowMap.needsUpdate = true;
    this.invalidate();
  };
  setSide = () => {
    const d = this.camera.position.distanceTo(this.controls.target);
    this.camera.position
      .copy(this.controls.target)
      .add(new T.Vector3(0, d * 0.1, d));
    this.controls.update();
    this.invalidate();
  };
  zoom = (factor: number) => {
    this.camera.position
      .sub(this.controls.target)
      .multiplyScalar(factor)
      .add(this.controls.target);
    this.controls.update();
    this.invalidate();
  };
  private invalidate = () => {
    if (this.disposed || this.contextLost || document.hidden || this.preparing)
      return;
    // OrbitControls emits further change events while damping. Static edits only
    // need two frames, so pausing does not leave a long queue of expensive draws.
    this.framesLeft = 2;
    if (!this.frame) this.frame = requestAnimationFrame(this.loop);
  };
  private loop = (now: number) => {
    this.frame = 0;
    if (this.disposed || this.contextLost || document.hidden || this.preparing)
      return;
    const dt = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.06) : 0;
    this.lastTime = now;
    const budget = this.state.quality === "high" ? 1000 / 60 : 1000 / 30;
    this.controls.update();
    if (this.state.playing) this.elapsed += dt * this.state.speed;
    if (now - this.lastRender >= budget - 0.1) {
      if (this.state.playing) {
        if (this.activeInspection) this.activeInspection.update(this.elapsed);
        else this.model.update(this.elapsed);
        this.renderer.shadowMap.needsUpdate = true;
      }
      this.renderer.render(this.scene, this.camera);
      // Retain the fractional interval on 120/144/165 Hz displays, without
      // rendering a backlog of missed frames after an expensive operation.
      this.lastRender =
        now - (Math.max(0, now - this.lastRender - budget) % budget);
      this.framesLeft = Math.max(0, this.framesLeft - 1);
      this.sampleFrames++;
      if (now - this.sampleTime > 1000 || this.metricsPending) {
        const info = this.renderer.info;
        this.onStats({
          fps: Math.round(
            (this.sampleFrames * 1000) / Math.max(1, now - this.sampleTime),
          ),
          triangles: info.render.triangles,
          calls: info.render.calls,
          geometries: info.memory.geometries,
          renderer: this.rendererName,
        });
        this.sampleTime = now;
        this.sampleFrames = 0;
        this.metricsPending = false;
      }
    }
    // controls.update() can emit change -> invalidate() and already schedule
    // the next frame. Never create a second independent animation chain.
    if ((this.state.playing || this.framesLeft > 0) && !this.frame)
      this.frame = requestAnimationFrame(this.loop);
    else if (!this.frame) this.lastTime = 0;
  };
  dispose() {
    this.disposed = true;
    this.preparation++;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
    this.renderer.domElement.removeEventListener("pointerdown", this.onDown);
    this.renderer.domElement.removeEventListener("pointerup", this.onUp);
    this.renderer.domElement.removeEventListener(
      "webglcontextlost",
      this.onContextLost,
    );
    this.controls.removeEventListener("change", this.invalidate);
    this.controls.dispose();
    disposeObject(this.scene);
    this.studioMap.dispose();
    this.sun.shadow.map?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
