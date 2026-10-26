import * as T from "three";
import type { PartId, Train } from "../types";
import { sliderPosition, rollingAngle } from "./mechanics";
import { batchStaticMeshes } from "./geometry";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export interface TrainModel {
  root: T.Group;
  parts: Record<PartId, T.Group>;
  update: (time: number) => void;
  length: number;
}
const steel = "#45534f",
  dark = "#293b38",
  tire = "#46504a",
  brass = "#bd934a",
  copper = "#b7764e";

export function buildTrain(train: Train): TrainModel {
  const root = new T.Group();
  const parts = Object.fromEntries(
    ["body", "power", "drive", "running", "supply"].map((id) => {
      const g = new T.Group();
      g.name = id;
      g.userData.part = id;
      root.add(g);
      return [id, g];
    }),
  ) as Record<PartId, T.Group>;
  const materialCache = new Map<string, T.MeshStandardMaterial>();
  const animated: ((t: number) => void)[] = [];
  const material = (color: string, metal = 0.25, opacity = 1) => {
    const key = `${color}/${metal}/${opacity}`;
    if (!materialCache.has(key))
      materialCache.set(
        key,
        new T.MeshStandardMaterial({
          color,
          metalness: metal,
          roughness: metal > 0.6 ? 0.28 : 0.48,
          transparent: opacity < 1,
          opacity,
        }),
      );
    return materialCache.get(key)!;
  };
  function mesh(
    parent: T.Object3D,
    geometry: T.BufferGeometry,
    color: string,
    x = 0,
    y = 0,
    z = 0,
    metal = 0.25,
  ) {
    const glass = [
      "#183844",
      "#304d51",
      "#28434b",
      "#263f45",
      "#1d3d45",
    ].includes(color);
    const m = new T.Mesh(geometry, material(color, glass ? 0.65 : metal));
    if (glass) (m.material as T.MeshStandardMaterial).roughness = 0.16;
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function box(
    parent: T.Object3D,
    w: number,
    h: number,
    d: number,
    color: string,
    x = 0,
    y = 0,
    z = 0,
  ) {
    return mesh(parent, new T.BoxGeometry(w, h, d), color, x, y, z);
  }
  function cyl(
    parent: T.Object3D,
    r: number,
    length: number,
    color: string,
    x: number,
    y: number,
    z: number,
    axis: "x" | "y" | "z" = "y",
    radial = 20,
  ) {
    const m = mesh(
      parent,
      new T.CylinderGeometry(r, r, length, radial),
      color,
      x,
      y,
      z,
    );
    if (axis === "x") m.rotation.z = Math.PI / 2;
    if (axis === "z") m.rotation.x = Math.PI / 2;
    return m;
  }
  function rod(
    parent: T.Object3D,
    a: T.Vector3,
    b: T.Vector3,
    radius: number,
    color = steel,
  ) {
    const m = mesh(parent, new T.CylinderGeometry(radius, radius, 1, 8), color);
    const place = (p: T.Vector3, q: T.Vector3) => {
      m.position.copy(p).add(q).multiplyScalar(0.5);
      m.scale.y = p.distanceTo(q);
      m.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        q.clone().sub(p).normalize(),
      );
    };
    place(a, b);
    m.userData.moving = true;
    return { mesh: m, place };
  }
  const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);

  function wheel(
    parent: T.Object3D,
    x: number,
    radius: number,
    z: number,
    spoked: boolean,
    phase = 0,
  ) {
    const g = new T.Group();
    g.userData.wheel = true;
    g.position.set(x, radius + 0.12, z);
    parent.add(g);
    const rim = mesh(
      g,
      new T.TorusGeometry(radius * 0.9, radius * 0.1, 10, 40),
      tire,
    );
    rim.castShadow = true;
    const tread = mesh(
      g,
      new T.CylinderGeometry(radius, radius, 0.16, 40),
      "#9da6a7",
      0,
      0,
      0,
      0.78,
    );
    tread.rotation.x = Math.PI / 2;
    // Open spokes remain visible; replace the solid tread by an annular extrusion.
    const shape = new T.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    const hole = new T.Path();
    hole.absarc(0, 0, radius * 0.82, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    tread.geometry.dispose();
    tread.geometry = new T.ExtrudeGeometry(shape, {
      depth: 0.17,
      bevelEnabled: false,
      curveSegments: 32,
    });
    tread.rotation.set(0, 0, 0);
    tread.position.z = -0.085;
    const flange = mesh(
      g,
      new T.TorusGeometry(radius * 1.015, radius * 0.028, 6, 40),
      "#73818a",
      0,
      0,
      z > 0 ? -0.1 : 0.1,
      0.7,
    );
    flange.name = "wheel-flange";

    cyl(g, radius * 0.16, 0.2, brass, 0, 0, 0, "z");
    if (spoked) {
      const spokes = new T.InstancedMesh(
        new T.BoxGeometry(radius * 1.56, radius * 0.085, 0.12),
        material(steel),
        6,
      );
      const m = new T.Matrix4();
      const q = new T.Quaternion();
      for (let i = 0; i < 6; i++) {
        q.setFromAxisAngle(v(0, 0, 1), (i * Math.PI) / 6);
        m.compose(v(0, 0, 0), q, v(1, 1, 1));
        spokes.setMatrixAt(i, m);
      }
      spokes.castShadow = true;
      g.add(spokes);
      const weight = mesh(
        g,
        new T.CircleGeometry(radius * 0.62, 16, 0, Math.PI * 0.72),
        steel,
        0,
        0,
        0.07,
      );
      weight.rotation.z = 2;
    } else cyl(g, radius * 0.83, 0.13, steel, 0, 0, 0, "z");
    animated.push((t) => {
      const reference =
        train.id === "rocket"
          ? 0.76
          : train.id === "bigboy"
            ? 0.8636
            : train.id === "garratt"
              ? 0.62
              : 0.46;
      g.rotation.z = rollingAngle(t, radius, reference) - phase;
    });
    return g;
  }
  function axle(parent: T.Object3D, x: number, r: number, spoked = false) {
    const half = train.gauge / 2 + 0.1;
    wheel(parent, x, r, half, spoked, 0);
    wheel(parent, x, r, -half, spoked, Math.PI / 2);
    cyl(parent, 0.085, train.gauge + 0.3, steel, x, r + 0.12, 0, "z", 10);
  }
  function linkage(
    parent: T.Object3D,
    x: number,
    radius: number,
    length: number,
    side: number,
    axisAngle = 0,
    coupled: number[] = [],
  ) {
    const z = side * (train.gauge / 2 + 0.28),
      y = radius + 0.12,
      cr = radius * 0.33;
    const axis = v(Math.cos(axisAngle), Math.sin(axisAngle), 0);
    const origin = v(x, y, z);
    const piston = box(parent, 0.25, 0.26, 0.24, "#d2c9a7");
    piston.userData.moving = true;
    const connecting = rod(
      parent,
      origin,
      origin.clone().addScaledVector(axis, length),
      0.065,
      "#b9b9a4",
    );
    const pistonRod = rod(
      parent,
      origin,
      origin.clone().addScaledVector(axis, length + 0.7),
      0.055,
      "#b9b9a4",
    );
    const c = origin.clone().addScaledVector(axis, length + 0.7);
    const cylinder = cyl(parent, 0.27, 0.9, dark, c.x, c.y, z, "x");
    cylinder.rotation.z = Math.PI / 2 + axisAngle;
    const rails = [-0.17, 0.17].map((offset) =>
      rod(
        parent,
        origin
          .clone()
          .addScaledVector(axis, length - 0.45)
          .add(v(0, offset, 0)),
        origin
          .clone()
          .addScaledVector(axis, length + 0.4)
          .add(v(0, offset, 0)),
        0.035,
        steel,
      ),
    );
    const pins = [x, ...coupled].map((px) =>
      cyl(parent, 0.11, 0.13, brass, px, y, z + side * 0.04, "z", 10),
    );
    pins.forEach((pin) => {
      pin.userData.moving = true;
    });
    const coupling = coupled.length
      ? rod(
          parent,
          v(x, y, z),
          v(coupled[coupled.length - 1], y, z),
          0.075,
          "#b9b9a4",
        )
      : null;
    void rails;
    animated.push((time) => {
      const theta = -(time * 1.7 + (side < 0 ? Math.PI / 2 : 0));
      const pin = v(x + cr * Math.cos(theta), y + cr * Math.sin(theta), z);
      const s = sliderPosition(theta - axisAngle, cr, length);
      const slide = origin.clone().addScaledVector(axis, s);
      connecting.place(pin, slide);
      piston.position.copy(slide);
      piston.rotation.z = axisAngle;
      pistonRod.place(slide, slide.clone().addScaledVector(axis, 0.95));
      pins.forEach((p, i) => {
        p.position.x = [x, ...coupled][i] + cr * Math.cos(theta);
        p.position.y = y + cr * Math.sin(theta);
      });
      if (coupling)
        coupling.place(
          pin,
          v(coupled[coupled.length - 1] + cr * Math.cos(theta), pin.y, z),
        );
    });
  }
  function bogie(x: number, count = 2, spacing = 1.9) {
    const p = parts.running;
    const wheelbase = (count - 1) * spacing;
    box(p, wheelbase + 1.1, 0.35, train.gauge + 0.25, dark, x, 1.05, 0);
    for (let i = 0; i < count; i++) {
      const px = x + (i - (count - 1) / 2) * spacing;
      axle(p, px, 0.46);
      for (const sign of [-1, 1]) {
        cyl(p, 0.15, 0.4, "#969d8e", px, 1.15, sign * (train.gauge / 2 + 0.19));
        for (let ring = 0; ring < 4; ring++) {
          const m = mesh(
            p,
            new T.TorusGeometry(0.15, 0.025, 5, 10),
            dark,
            px,
            1.03 + ring * 0.07,
            sign * (train.gauge / 2 + 0.19),
          );
          m.rotation.x = Math.PI / 2;
        }
        box(
          p,
          0.26,
          0.38,
          0.12,
          copper,
          px + 0.45,
          0.65,
          sign * (train.gauge / 2 + 0.23),
        );
      }
      cyl(parts.drive, 0.29, 1.05, "#6d817c", px - 0.27, 0.94, 0, "z");
    }
    cyl(p, 0.43, 0.35, "#748176", x, 1.4, 0);
  }
  function cabin(
    x: number,
    y: number,
    w: number,
    h: number,
    d: number,
    color: string,
    rocket = false,
  ) {
    const p = parts.body;
    if (rocket) {
      box(p, 1.2, 0.16, 1.8, dark, x, y - 0.6, 0);
      rod(
        p,
        v(x + 0.55, y - 0.5, -0.8),
        v(x + 0.55, y + 0.4, -0.8),
        0.04,
        brass,
      );
      rod(p, v(x + 0.55, y - 0.5, 0.8), v(x + 0.55, y + 0.4, 0.8), 0.04, brass);
      return;
    }
    box(p, w, h, d, color, x, y, 0);
    mesh(
      p,
      new RoundedBoxGeometry(w + 0.3, 0.22, d + 0.3, 2, 0.09),
      dark,
      x,
      y + h / 2 + 0.07,
      0,
    );
    for (const z of [-d / 2 - 0.014, d / 2 + 0.014]) {
      box(p, w * 0.55, h * 0.42, 0.035, "#203b40", x, y + 0.16, z);
      box(p, 0.055, h * 0.45, 0.05, brass, x, y + 0.16, z);
      for (const dx of [-w * 0.3, w * 0.3])
        box(p, 0.05, h * 0.48, 0.055, steel, x + dx, y + 0.16, z);
      box(p, w * 0.64, 0.05, 0.06, steel, x, y + h * 0.39, z);
      for (const dx of [-w * 0.42, w * 0.42])
        rod(
          p,
          v(x + dx, y - 0.8, z * 1.03),
          v(x + dx, y + 0.6, z * 1.03),
          0.035,
          "#a4aa9e",
        );
    }
  }
  function boiler(
    x: number,
    y: number,
    length: number,
    radius: number,
    color: string,
  ) {
    const p = parts.power;
    const shell = cyl(p, radius, length, color, x, y, 0, "x", 32);
    shell.userData.cover = true;
    const frontPlate = cyl(
      p,
      radius * 1.02,
      0.13,
      dark,
      x - length / 2,
      y,
      0,
      "x",
    );
    frontPlate.userData.cover = true;
    const front = x - length / 2 - 0.08;
    cyl(
      p,
      radius * 0.79,
      0.06,
      train.id === "rocket" ? "#403f31" : "#263139",
      front,
      y,
      0,
      "x",
      40,
    );
    for (const sign of [-1, 1])
      box(
        p,
        0.08,
        radius * 0.14,
        radius * 0.56,
        steel,
        front - 0.06,
        y + sign * radius * 0.4,
        0,
      );
    cyl(p, radius * 0.1, 0.14, brass, front - 0.13, y, 0, "x", 12);
    const latch = mesh(
      p,
      new T.TorusGeometry(radius * 0.21, 0.025, 6, 24),
      steel,
      front - 0.23,
      y,
      0,
    );
    latch.rotation.y = Math.PI / 2;
    if (train.id === "rocket") {
      for (let i = 0; i < 20; i++) {
        const a = (i * Math.PI) / 10;
        const line = box(
          p,
          length * 0.97,
          0.016,
          0.016,
          "#997335",
          x,
          y + Math.cos(a) * (radius + 0.008),
          Math.sin(a) * (radius + 0.008),
        );
        line.rotation.x = a;
      }
    } else {
      for (const side of [-1, 1]) {
        const points = [
          v(x + length * 0.38, y + radius * 0.8, side * radius * 0.5),
          v(x + length * 0.23, y + radius * 0.88, side * radius * 0.7),
          v(x - length * 0.2, y + radius * 0.45, side * radius * 1.05),
          v(x - length * 0.42, y - radius * 0.2, side * radius * 1.12),
        ];
        mesh(
          p,
          new T.TubeGeometry(
            new T.CatmullRomCurve3(points),
            28,
            0.045,
            8,
            false,
          ),
          "#818c8c",
        );
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          const bolt = cyl(
            p,
            0.04,
            0.1,
            brass,
            front - 0.12,
            y + radius * 0.68 * Math.cos(a),
            radius * 0.68 * Math.sin(a),
            "x",
            6,
          );
          void bolt;
        }
      }
    }
    const tubes = new T.Group();
    tubes.userData.detail = true;
    tubes.visible = false;
    p.add(tubes);
    // Explanatory tube bank: count and wall thickness are intentionally schematic.
    for (let row = -2; row <= 2; row++)
      for (let col = -2; col <= 2; col++) {
        if (row * row + col * col > 6) continue;
        cyl(
          tubes,
          radius * 0.07,
          length * 0.95,
          "#ba985e",
          x,
          y + row * radius * 0.26,
          col * radius * 0.26,
          "x",
          8,
        );
      }
    const inner = cyl(
      tubes,
      radius * 0.94,
      length * 0.98,
      "#b6b78f",
      x,
      y,
      0,
      "x",
      28,
    );
    (inner.material as T.MeshStandardMaterial) = new T.MeshStandardMaterial({
      color: "#b6b78f",
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      side: T.DoubleSide,
    });
    for (let i = 0; i < 5; i++) {
      const px = x - length * 0.38 + i * length * 0.19;
      const band = mesh(
        p,
        new T.TorusGeometry(radius + 0.015, 0.028, 6, 28),
        brass,
        px,
        y,
        0,
      );
      band.rotation.y = Math.PI / 2;
    }
    for (const z of [-radius * 0.92, radius * 0.92])
      rod(
        p,
        v(x - length * 0.43, y + radius * 0.35, z),
        v(x + length * 0.42, y + radius * 0.35, z),
        0.034,
        brass,
      );
    const top = y + radius;
    cyl(
      p,
      radius * 0.26,
      radius * 0.65,
      color,
      x + length * 0.18,
      top + radius * 0.2,
      0,
    );
    const dome = mesh(
      p,
      new T.SphereGeometry(radius * 0.26, 12, 8),
      brass,
      x + length * 0.18,
      top + radius * 0.53,
      0,
    );
    dome.scale.y = 0.55;
    cyl(p, radius * 0.22, radius * 0.3, brass, x + length * 0.36, top + 0.1, 0);
    const chimneyX = x - length * 0.38;
    cyl(
      p,
      radius * 0.23,
      radius * 1.25,
      dark,
      chimneyX,
      top + radius * 0.43,
      0,
    );
    cyl(p, radius * 0.29, 0.11, brass, chimneyX, top + radius * 1.04, 0);
    return { chimneyX, chimneyY: top + radius * 1.1 };
  }
  function buffers(x: number, y: number, p: T.Object3D = parts.body) {
    box(p, 0.17, 0.35, train.gauge + 0.9, "#954e3d", x, y, 0);
    for (const z of [-0.72, 0.72]) {
      cyl(p, 0.08, 0.3, steel, x - 0.17, y, z, "x", 10);
      cyl(p, 0.2, 0.12, dark, x - 0.36, y, z, "x", 14);
    }
  }
  function smallRivets(
    p: T.Object3D,
    length: number,
    x: number,
    y: number,
    z: number,
  ) {
    const count = Math.max(3, Math.floor(length / 0.35));
    const m = new T.InstancedMesh(
      new T.SphereGeometry(0.045, 5, 4),
      material("#8e9886"),
      count,
    );
    for (let i = 0; i < count; i++)
      m.setMatrixAt(
        i,
        new T.Matrix4().makeTranslation(
          x - length / 2 + (i * length) / (count - 1),
          y,
          z,
        ),
      );
    p.add(m);
  }

  if (train.id === "rocket") {
    box(parts.body, 4.5, 0.18, 1.55, "#453f33", -0.1, 1.05, 0);
    boiler(-0.55, 1.96, 2.75, 0.66, "#cfaa4f");
    // Tall chimney is distinctive of the Rainhill reconstruction.
    cyl(parts.power, 0.15, 1.8, "#3d4238", -1.595, 3.95, 0);
    cyl(parts.power, 0.21, 0.12, brass, -1.595, 4.87, 0);
    box(parts.power, 0.85, 1.12, 1.22, "#a17636", 1.0, 1.6, 0);
    axle(parts.running, -0.9, 0.76, true);
    axle(parts.running, 1.45, 0.47, true);
    linkage(parts.drive, -0.9, 0.76, 1.45, 1, 0.52);
    linkage(parts.drive, -0.9, 0.76, 1.45, -1, 0.52);
    cabin(1.55, 1.5, 1, 1, 1.6, "#a17b3c", true);
    const p = parts.supply;
    box(p, 1.9, 0.22, 1.7, "#63573c", 3.36, 0.92);
    box(p, 1.85, 0.7, 1.65, "#7e744b", 3.36, 1.38);
    for (const x of [2.8, 3.96]) axle(p, x, 0.43, true);
    cyl(p, 0.58, 1.2, "#846b3e", 3.4, 2.05, 0, "z");
    for (const z of [-0.52, 0, 0.52]) {
      const b = mesh(
        p,
        new T.TorusGeometry(0.59, 0.035, 6, 24),
        steel,
        3.4,
        2.05,
        z,
      );
      b.rotation.y = 0;
    }
    rod(parts.body, v(2, 1, 0), v(2.5, 1, 0), 0.06);
    buffers(-2.42, 0.96);
    root.position.x = -0.6;
  } else if (train.id === "bigboy") {
    const p = parts.body;
    box(p, 23.2, 0.55, 2.3, dark, -5.6, 1.65);
    boiler(-6.3, 3.1, 15.1, 1.32, "#43514a");
    cabin(2.45, 3.3, 3.5, 2.45, 3.15, "#3c4943");
    box(parts.power, 3.8, 2.3, 2.45, "#36443c", 1, 2.55);
    const front = [-13.8, -11.8, -9.8, -7.8],
      rear = [-5.4, -3.4, -1.4, 0.6];
    [...front, ...rear].forEach((x) => axle(parts.running, x, 0.8636, true));
    [-17.0, -15.7, 2.7, 4.05].forEach((x) => axle(parts.running, x, 0.48));
    for (const side of [-1, 1]) {
      linkage(parts.drive, -13.8, 0.8636, 2.2, side, Math.PI, front.slice(1));
      linkage(parts.drive, -5.4, 0.8636, 2.2, side, Math.PI, rear.slice(1));
    }
    buffers(-18, 1.05);
    for (const side of [-1, 1]) {
      box(p, 17, 0.17, 0.55, "#768070", -6.5, 2.65, side * 1.48);
      rod(p, v(-14.5, 3.4, side * 1.4), v(1.3, 3.4, side * 1.4), 0.04, brass);
      smallRivets(p, 15, -6, 2.6, side * 1.53);
      for (let i = 0; i < 3; i++)
        box(p, 0.7, 0.14, 0.4, steel, 4.0, 0.75 + i * 0.4, side * 1.35);
    }
    const s = parts.supply;
    box(s, 12.1, 2.65, 3.2, "#414d46", 11.6, 2.6);
    box(s, 12.3, 0.35, 3.3, dark, 11.6, 1.3);
    box(s, 4, 0.6, 2.85, "#242e29", 7.8, 4.1);
    for (const x of [6.5, 7.8, 9.1, 11.6, 12.9, 14.2, 15.5]) axle(s, x, 0.53);
    for (const z of [-1.62, 1.62]) smallRivets(s, 11, 11.6, 2.1, z);
    rod(p, v(4.2, 1.5, 0), v(5.6, 1.5, 0), 0.14);
    cyl(p, 0.28, 0.18, brass, -14, 3.25, 0, "x");
    // Coal is an instanced load, rather than hundreds of separate draw calls.
    const coal = new T.InstancedMesh(
      new T.IcosahedronGeometry(0.19, 0),
      material("#26342e"),
      70,
    );
    for (let i = 0; i < 70; i++)
      coal.setMatrixAt(
        i,
        new T.Matrix4().makeTranslation(
          6.1 + (i % 10) * 0.35,
          4.46 + Math.sin(i * 7) * 0.08,
          -0.95 + Math.floor(i / 10) * 0.3,
        ),
      );
    s.add(coal);
  } else if (train.id === "garratt") {
    box(parts.body, 13.5, 0.48, 2.2, dark, 0, 1.9);
    boiler(-0.9, 3.05, 8.4, 1.1, "#53634e");
    cabin(4.3, 3.16, 3.1, 2.5, 2.9, "#53634e");
    for (const center of [-8.6, 8.6]) {
      box(parts.running, 10.9, 0.4, 1.6, dark, center, 1.13);
      const driveX = [-2.5, -0.85, 0.85, 2.5].map((x) => x + center);
      driveX.forEach((x) => axle(parts.running, x, 0.62, true));
      const pilotX =
        center < 0
          ? [center - 4.5, center - 3.45, center + 3.9]
          : [center - 3.9, center + 3.45, center + 4.5];
      pilotX.forEach((x) => axle(parts.running, x, 0.37));
      for (const side of [-1, 1])
        linkage(
          parts.drive,
          driveX[0],
          0.62,
          1.65,
          side,
          Math.PI,
          driveX.slice(1),
        );
      cyl(parts.running, 0.6, 0.32, brass, center < 0 ? -5 : 5, 1.8, 0);
      box(parts.supply, 5.2, 1.9, 2.3, "#53634e", center, 2.55);
      for (const z of [-1.17, 1.17])
        smallRivets(parts.supply, 4.8, center, 2, z);
    }
    box(parts.supply, 3.6, 0.4, 2.0, "#303c30", 8.5, 3.62);
    buffers(-13.7, 1.08);
    for (const z of [-1.28, 1.28])
      rod(parts.body, v(-5, 3.25, z), v(2.8, 3.25, z), 0.045, brass);
  } else {
    // Smooth, section-based hulls preserve a different nose profile for each family.
    type Section = [number, number, number, number];
    function surface(sections: Section[], x: number, a: number, lift = 0) {
      let index = sections.findIndex(
        (s, i) => i < sections.length - 1 && x <= sections[i + 1][0],
      );
      if (index < 0) index = sections.length - 2;
      const left = sections[index],
        right = sections[index + 1],
        t = T.MathUtils.clamp((x - left[0]) / (right[0] - left[0]), 0, 1),
        u = t * t * (3 - 2 * t);
      const width = T.MathUtils.lerp(left[1], right[1], u) + lift,
        height = T.MathUtils.lerp(left[2], right[2], u) + lift,
        center = T.MathUtils.lerp(left[3], right[3], u);
      return v(
        x,
        center +
          Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.65 * height,
        Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.48 * width,
      );
    }
    function hull(parent: T.Object3D, sections: Section[], color: string) {
      const ring = 48,
        xs: number[] = [];
      for (let i = 0; i < sections.length - 1; i++) {
        const left = sections[i],
          right = sections[i + 1],
          same = left.slice(1).every((n, k) => n === right[k + 1]);
        const steps = same ? 1 : 12;
        for (let j = 0; j < steps; j++)
          xs.push(T.MathUtils.lerp(left[0], right[0], j / steps));
      }
      xs.push(sections.at(-1)![0]);
      const vertices: number[] = [],
        uv: number[] = [],
        indices: number[] = [];
      xs.forEach((x, j) => {
        for (let i = 0; i < ring; i++) {
          const point = surface(sections, x, (i * Math.PI * 2) / ring);
          vertices.push(...point.toArray());
          uv.push(j / (xs.length - 1), i / ring);
        }
      });
      for (let j = 0; j < xs.length - 1; j++)
        for (let i = 0; i < ring; i++) {
          const a = j * ring + i,
            b = j * ring + ((i + 1) % ring),
            c = a + ring,
            d = b + ring;
          indices.push(a, c, b, b, c, d);
        }
      for (let i = 1; i < ring - 1; i++) {
        indices.push(0, i, i + 1);
        const o = (xs.length - 1) * ring;
        indices.push(o, o + i + 1, o + i);
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
      geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return mesh(parent, geo, color);
    }
    // Glazing and paint follow the body surface instead of disappearing inside it.
    function skin(
      sections: Section[],
      start: number,
      end: number,
      a0: number,
      a1: number,
      color: string,
    ) {
      const vertices: number[] = [],
        indices: number[] = [],
        nx = 16,
        na = 16;
      for (let j = 0; j <= nx; j++)
        for (let i = 0; i <= na; i++)
          vertices.push(
            ...surface(
              sections,
              T.MathUtils.lerp(start, end, j / nx),
              T.MathUtils.lerp(a0, a1, i / na),
              0.025,
            ).toArray(),
          );
      for (let j = 0; j < nx; j++)
        for (let i = 0; i < na; i++) {
          const a = j * (na + 1) + i,
            b = a + 1,
            c = a + na + 1,
            d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const m = mesh(parts.body, geo, color);
      m.material.side = T.DoubleSide;
      return m;
    }
    function windows(
      xStart: number,
      xEnd: number,
      y: number,
      z: number,
      count: number,
      width = 0.86,
    ) {
      for (const side of [-1, 1])
        for (let i = 0; i < count; i++) {
          const x = xStart + (i * (xEnd - xStart)) / Math.max(1, count - 1);
          mesh(
            parts.body,
            new RoundedBoxGeometry(width + 0.1, 0.74, 0.055, 2, 0.07),
            "#66757b",
            x,
            y,
            side * z,
          );
          mesh(
            parts.body,
            new RoundedBoxGeometry(width, 0.63, 0.065, 2, 0.065),
            "#183844",
            x,
            y,
            side * (z + 0.018),
          );
          box(
            parts.body,
            width * 0.75,
            0.025,
            0.015,
            "#9ebbc0",
            x,
            y + 0.23,
            side * (z + 0.06),
          );
          box(
            parts.body,
            width,
            0.035,
            0.045,
            "#b5bdad",
            x,
            y - 0.34,
            side * z,
          );
        }
    }
    function pantograph(x: number, base: number) {
      const p = parts.supply;
      if (train.id === "shinkansen") {
        box(p, 2, 0.12, 1.15, dark, x, base);
        for (const z of [-0.45, 0.45]) {
          cyl(p, 0.12, 0.25, "#e4ded0", x, base + 0.14, z);
          for (const side of [-1, 1]) {
            rod(
              p,
              v(x, base + 0.35, z),
              v(x + side * 0.9, base + 1.05, z),
              0.045,
              dark,
            );
            rod(
              p,
              v(x + side * 0.9, base + 1.05, z),
              v(x, base + 1.75, z),
              0.045,
              dark,
            );
          }
        }
        box(p, 0.33, 0.08, 1.9, "#667065", x, base + 1.77);
        return;
      }
      for (const z of [-0.45, 0.45]) {
        cyl(p, 0.12, 0.25, "#e4ded0", x, base + 0.14, z);
        rod(
          p,
          v(x - 0.8, base + 0.35, z),
          v(x + 0.7, base + 1.1, z),
          0.045,
          dark,
        );
        rod(
          p,
          v(x + 0.7, base + 1.1, z),
          v(x - 0.1, base + 1.7, z),
          0.045,
          dark,
        );
      }
      box(p, 0.33, 0.08, 1.9, "#667065", x - 0.1, base + 1.72);
      box(p, 2, 0.12, 1.15, dark, x, base);
    }
    function electricalModule(x: number) {
      box(parts.power, 2.6, 0.64, 1.55, "#7a8a7c", x, 1.02);
      for (let i = 0; i < 12; i++)
        box(
          parts.power,
          0.09,
          0.65,
          1.67,
          "#9b9f8d",
          x - 1.18 + i * 0.21,
          1.02,
        );
      box(parts.power, 1.5, 0.7, 1.5, "#d1c29b", x + 2.5, 1.06);
      for (let i = 0; i < 4; i++)
        cyl(parts.power, 0.14, 0.52, copper, x + 2 + i * 0.32, 1.05, 0, "z");
    }
    if (train.id === "deltic") {
      const delticSections: Section[] = [
        [-10, 0.8, 0.65, 2.2],
        [-9.4, 1.3, 1.2, 2.55],
        [-7.6, 1.42, 1.35, 2.8],
        [7.6, 1.42, 1.35, 2.8],
        [9.4, 1.3, 1.2, 2.55],
        [10, 0.8, 0.65, 2.2],
      ];
      hull(parts.body, delticSections, "#28758b");
      for (const end of [-1, 1]) {
        const lo = end < 0 ? -9.65 : 8.6,
          hi = end < 0 ? -8.6 : 9.65;
        skin(delticSections, lo, hi, Math.PI * 0.24, Math.PI * 0.49, "#183844");
        skin(delticSections, lo, hi, Math.PI * 0.51, Math.PI * 0.76, "#183844");
        for (let i = 0; i < 3; i++)
          skin(
            delticSections,
            end < 0 ? -9.98 + i * 0.12 : 9.73 - i * 0.12,
            end < 0 ? -9.73 + i * 0.12 : 9.98 - i * 0.12,
            -0.15,
            0.15,
            "#ebd9a6",
          );
      }
      for (const side of [-1, 1]) {
        box(parts.body, 15.3, 0.42, 0.04, "#e0d3a6", 0, 2.45, side * 1.43);
        box(parts.body, 15, 0.06, 0.06, "#bdbba0", 0, 2.17, side * 1.46);
        for (let i = 0; i < 22; i++)
          box(
            parts.body,
            0.15,
            0.68,
            0.045,
            "#235969",
            -5.8 + i * 0.54,
            3.45,
            side * 1.42,
          );
        for (const x of [-8.4, 8.4])
          box(parts.body, 1.13, 0.65, 0.04, "#1d3d45", x, 3.16, side * 1.32);
      }
      for (const side of [-1, 1]) {
        const nose = box(
          parts.body,
          0.08,
          0.55,
          1.5,
          "#234249",
          side * 9.32,
          3.3,
        );
        nose.rotation.z = side * 0.3;
        for (let i = 0; i < 3; i++) {
          const chev = box(
            parts.body,
            0.06,
            0.12,
            1.3 - i * 0.2,
            "#dfc890",
            side * (9.78 - i * 0.07),
            2.3 - i * 0.25,
          );
          chev.rotation.z = side * 0.16;
        }
      }
      bogie(-6.1, 3, 1.65);
      bogie(6.1, 3, 1.65);
      for (const x of [-3.6, 3.2]) {
        const engine = new T.Group();
        engine.position.set(x, 2.42, 0);
        parts.power.add(engine);
        // Three banks form the triangular cross-section of each Deltic power unit.
        const points = [v(0, 0.8, 0), v(0, -0.45, 0.72), v(0, -0.45, -0.72)];
        for (let bank = 0; bank < 3; bank++)
          for (let j = 0; j < 6; j++) {
            const a = points[bank].clone().add(v((j - 2.5) * 0.37, 0, 0));
            const b = points[(bank + 1) % 3]
              .clone()
              .add(v((j - 2.5) * 0.37, 0, 0));
            rod(engine, a, b, 0.15, "#7f937c");
          }
        for (const point of points)
          cyl(engine, 0.16, 2.6, brass, point.x, point.y, point.z, "x");
        cyl(parts.drive, 0.62, 1.15, "#9caa93", x + 1.9, 2.43, 0, "x");
        for (const z of [-0.55, 0.55])
          cyl(parts.supply, 0.42, 0.1, "#314f4e", x, 4.18, z);
      }
      box(parts.supply, 4.5, 0.58, 1.55, "#536654", 0, 0.95);
      buffers(-10.2, 1.2);
      buffers(10.2, 1.2);
    } else if (train.id === "maglev") {
      const maglevSections: Section[] = [
        [-14, 0.12, 0.18, 1.0],
        [-12, 0.45, 0.35, 1.1],
        [-9, 1.1, 0.65, 1.35],
        [-6, 1.4, 1.15, 1.83],
        [-3.3, 1.42, 1.5, 2.15],
        [13.5, 1.42, 1.5, 2.15],
      ];
      hull(parts.body, maglevSections, "#e7ece8");
      for (const z of [-1.433, 1.433]) {
        box(parts.body, 17.1, 0.18, 0.035, "#497da5", 5.0, 2.1, z);
        box(parts.body, 17.1, 0.12, 0.035, "#497da5", 5.0, 1.8, z);
      }
      windows(-1.4, 12, 2.85, 1.432, 12, 0.55);
      skin(
        maglevSections,
        -5.0,
        -3.7,
        Math.PI * 0.22,
        Math.PI * 0.485,
        "#183844",
      );
      skin(
        maglevSections,
        -5.0,
        -3.7,
        Math.PI * 0.515,
        Math.PI * 0.78,
        "#183844",
      );
      for (const x of [-2, 9]) {
        for (const side of [-1, 1]) {
          box(parts.power, 3.6, 0.68, 0.38, "#adbdba", x, 0.92, side * 1.25);
          for (let i = 0; i < 4; i++)
            cyl(
              parts.power,
              0.19,
              0.2,
              copper,
              x - 1.3 + i * 0.86,
              0.92,
              side * 1.5,
              "z",
            );
          const w = wheel(parts.supply, x, 0.3, side * 1.0, false);
          w.position.y = 0.45;
          w.visible = true;
        }
      }
      for (const side of [-1, 1]) {
        box(parts.running, 31, 1.05, 0.28, "#b8c3b6", 0, 0.5, side * 1.85);
        for (let i = 0; i < 30; i++) {
          const x = -14.5 + i;
          for (const y of [0.35, 0.72]) {
            const loop = mesh(
              parts.running,
              new T.TorusGeometry(0.18, 0.035, 5, 10),
              "#8a9e8d",
              x,
              y,
              side * 1.68,
            );
            loop.scale.x = 1.5;
          }
          box(parts.drive, 0.58, 0.2, 0.07, copper, x, 0.95, side * 1.69);
        }
      }
    } else {
      const sh = train.id === "shinkansen",
        tgv = train.id === "tgv";
      const length = tgv ? 21 : 25;
      const front = -length / 2;
      const white = sh ? "#e9e4d1" : tgv ? "#d3793e" : "#e8e9e3";
      const halfW = sh ? 1.67 : 1.45;
      const sections: [number, number, number, number][] = sh
        ? [
            [front, 0.16, 0.23, 1.85],
            [front + 1, 0.85, 0.6, 2.0],
            [front + 2.6, 1.5, 1.25, 2.5],
            [front + 4, halfW, 1.45, 2.7],
            [length / 2, halfW, 1.45, 2.7],
          ]
        : tgv
          ? [
              [front, 0.82, 0.45, 1.5],
              [front + 2, 1.2, 0.75, 2.0],
              [front + 4, halfW, 1.25, 2.7],
              [length / 2, halfW, 1.25, 2.7],
            ]
          : [
              [front, 0.22, 0.22, 1.2],
              [front + 1.8, 0.75, 0.6, 1.6],
              [front + 4, 1.35, 1.2, 2.25],
              [front + 6, halfW, 1.4, 2.65],
              [length / 2, halfW, 1.4, 2.65],
            ];
      hull(parts.body, sections, white);
      if (sh) {
        const nose = mesh(
          parts.body,
          new T.SphereGeometry(0.48, 32, 20),
          white,
          front + 0.18,
          1.85,
          0,
        );
        nose.scale.set(1.1, 0.82, 1.12);
        skin(
          sections,
          front + 2.15,
          front + 3.55,
          Math.PI * 0.17,
          Math.PI * 0.485,
          "#183844",
        );
        skin(
          sections,
          front + 2.15,
          front + 3.55,
          Math.PI * 0.515,
          Math.PI * 0.83,
          "#183844",
        );
      } else {
        skin(
          sections,
          front + (tgv ? 2.4 : 3.5),
          front + (tgv ? 3.7 : 5.15),
          Math.PI * 0.23,
          Math.PI * 0.77,
          "#183844",
        );
        if (tgv) {
          skin(sections, front + 3.8, front + 5.3, -0.05, 0.24, "#183844");
          skin(
            sections,
            front + 3.8,
            front + 5.3,
            Math.PI - 0.24,
            Math.PI + 0.05,
            "#183844",
          );
        }
      }
      const band = sh ? "#3c6a98" : tgv ? "#62554a" : "#91475b";
      for (const side of [-1, 1]) {
        box(
          parts.body,
          length - (sh ? 4 : 5),
          sh ? 0.7 : 0.23,
          0.045,
          band,
          sh ? 2 : 2.5,
          sh ? 2.4 : 1.7,
          side * (halfW + 0.012),
        );
        if (tgv)
          for (let i = 0; i < 14; i++)
            box(
              parts.body,
              0.13,
              0.75,
              0.04,
              "#514d43",
              -1.8 + i * 0.65,
              3.15,
              side * 1.465,
            );
        for (const x of [front + 5.1, length / 2 - 1]) {
          box(
            parts.body,
            0.035,
            1.8,
            0.045,
            "#a9b3a6",
            x,
            2.38,
            side * (halfW + 0.04),
          );
          box(
            parts.body,
            0.75,
            0.035,
            0.05,
            "#a9b3a6",
            x + 0.38,
            1.48,
            side * (halfW + 0.04),
          );
        }
      }
      if (!tgv)
        windows(
          front + (sh ? 5 : 7),
          length / 2 - 1.4,
          2.95,
          halfW + 0.04,
          sh ? 9 : 11,
        );
      bogie(front + 5, 2, 2.4);
      bogie(length / 2 - 3, 2, 2.4);
      electricalModule(-1.2);
      pantograph(tgv ? 5.8 : 3.2, 4.18);
      if (tgv) {
        const p = parts.body;
        box(p, 0.7, 2.35, 2.35, "#54564c", 11.1, 2.55);
        hull(
          p,
          [
            [11.5, 1.38, 1.25, 2.65],
            [19, 1.38, 1.25, 2.65],
          ],
          "#cbc4af",
        );
        windows(12.6, 18, 3, 1.4, 5);
        for (const z of [-1.4, 1.4])
          box(p, 7.5, 0.3, 0.04, "#d3793e", 15.3, 1.65, z);
        bogie(18.6, 2, 2.4);
        root.position.x = -3;
      }
      const lightX = front + (sh ? 0.8 : 1.2);
      for (const z of [-0.55, 0.55]) {
        const light = mesh(
          parts.body,
          new T.SphereGeometry(0.12, 10, 6),
          "#eedab1",
          lightX,
          1.75,
          z,
        );
        light.scale.x = 0.3;
      }
    }
  }
  for (const group of Object.values(parts)) batchStaticMeshes(group);
  // Share one material per part/color, so highlighting never leaks into other parts.
  for (const [id, group] of Object.entries(parts)) {
    const copies = new Map<T.Material, T.Material>();
    group.traverse((o) => {
      o.userData.part = id;
      if (o instanceof T.Mesh) {
        const original = o.material as T.Material;
        if (!copies.has(original)) copies.set(original, original.clone());
        o.material = copies.get(original)!;
      }
    });
  }
  materialCache.forEach((m) => m.dispose());
  return {
    root,
    parts,
    length: train.length,
    update: (t) => animated.forEach((fn) => fn(t)),
  };
}

export function disposeObject(object: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>();
  object.traverse((o) => {
    // Instanced attributes belong to the object, not to its shared geometry.
    // This event lets WebGLObjects release instanceMatrix/instanceColor buffers.
    if (o instanceof T.InstancedMesh) o.dispose();
    if (o instanceof T.Mesh || o instanceof T.LineSegments) {
      geometries.add(o.geometry);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(
        (m: T.Material) => materials.add(m),
      );
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
