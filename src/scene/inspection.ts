import * as T from "three";
import type { Train, PartId } from "../types";
import { inspectionKind, type InspectionKind } from "../data/inspection";
import { Workshop, palette as c, vec } from "./geometry";
import { ANGULAR_SPEED, sliderPosition, opposedSliders } from "./mechanics";

export interface InspectionModel {
  root: T.Group;
  update: (time: number) => void;
  kind: InspectionKind;
}

/** Purpose-built teaching sections. Dimensions are illustrative, not manufacturer CAD. */
export function buildInspection(
  train: Train,
  part: PartId,
): InspectionModel | null {
  const kind = inspectionKind(train, part);
  if (!kind) return null;
  const w = new Workshop(),
    p = w.root;
  if (kind === "boiler") {
    const shell = w.cylinder(
      p,
      1.35,
      5.8,
      c.steel,
      0,
      0,
      0,
      "x",
      true,
      Math.PI / 2,
      Math.PI,
    );
    shell.material = w.material(c.steel, 0.7);
    shell.material.side = T.DoubleSide;
    for (const x of [-2.9, 2.9]) {
      w.ring(p, 1.35, 0.07, c.brass, x);
      w.bolts(p, 1.2, 16, x);
    }
    for (let row = -2; row <= 2; row++)
      for (let col = -2; col <= 2; col++) {
        if (row * row + col * col > 6) continue;
        const y = row * 0.32 - 0.12,
          z = col * 0.34;
        w.cylinder(p, 0.095, 5.65, c.copper, 0, y, z);
        w.ring(p, 0.096, 0.016, c.brass, 2.84, y, z);
      }
    const water = w.box(p, 5.35, 0.58, 1.9, c.blue, 0, -0.78, 0);
    water.material = w.material(c.blue, 0.08, 0.2);
    w.box(p, 0.8, 2.4, 2.3, c.dark, 3.3, -0.2, 0, true);
    w.box(p, 0.82, 1.3, 1.7, c.copper, 3.35, -0.4, 0.5, true);
    for (let i = 0; i < 7; i++)
      w.box(p, 0.86, 0.06, 0.09, c.steel, 3.35, -1.13, -0.6 + i * 0.2);
    const fire = w.box(p, 0.75, 0.44, 1.4, "#e4a442", 3.3, -0.8, 0.55);
    fire.material = w.material("#e4a442", 0);
    fire.material.emissive.set("#bd5b19");
    fire.material.emissiveIntensity = 0.3;
    w.cylinder(p, 0.23, 2, c.dark, -2.55, 1.55, 0, "y");
    w.ring(p, 0.26, 0.05, c.brass, -2.55, 2.56, 0, "y");
    w.cylinder(p, 0.33, 0.6, c.brass, 0.9, 1.5, 0, "y");
    // Flow tracers denote paths, not gas particles or fluid simulation.
    const tracers = new T.InstancedMesh(
      w.geometry("tracer", () => new T.SphereGeometry(0.07, 8, 6)),
      w.material("#efbe62", 0),
      12,
    );
    p.add(tracers);
    w.animations.push((t) => {
      for (let i = 0; i < 12; i++) {
        const x = 2.7 - ((t * 0.65 + i / 12) % 1) * 5.4;
        tracers.setMatrixAt(
          i,
          new T.Matrix4().makeTranslation(x, ((i % 3) - 1) * 0.32 - 0.12, 0.72),
        );
      }
      tracers.instanceMatrix.needsUpdate = true;
      fire.material.emissiveIntensity = 0.3 + 0.08 * Math.sin(t * 7);
    });
  } else if (kind === "steam") {
    const r = 0.7,
      l = 3,
      origin = vec(-2, 0, 0),
      cylinderCenter = 2.4;
    w.box(p, 7, 0.2, 1.8, c.dark, 0.3, -1.35, 0, true);
    const flywheel = new T.Group();
    flywheel.position.copy(origin);
    p.add(flywheel);
    w.ring(flywheel, 1.08, 0.14, c.steel, 0, 0, 0, "z");
    w.cylinder(flywheel, 0.24, 0.42, c.brass, 0, 0, 0, "z");
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      w.rod(
        flywheel,
        vec(0.2 * Math.cos(a), 0.2 * Math.sin(a), 0),
        vec(0.96 * Math.cos(a), 0.96 * Math.sin(a), 0),
        0.065,
        c.steel,
      );
    }
    w.cylinder(flywheel, 0.13, 0.3, c.brass, r, 0, 0.27, "z");
    const cylinder = w.cylinder(
      p,
      0.56,
      2.4,
      c.steel,
      cylinderCenter,
      0,
      0,
      "x",
      true,
      Math.PI / 2,
      Math.PI,
    );
    cylinder.material = w.material(c.steel, 0.65);
    cylinder.material.side = T.DoubleSide;
    for (const x of [1.2, 3.6]) {
      w.ring(p, 0.57, 0.07, c.brass, x);
      w.bolts(p, 0.45, 10, x);
    }
    for (const y of [-0.44, 0.44])
      w.rod(p, vec(0.1, y, 0.26), vec(1.5, y, 0.26), 0.055, c.steel);
    const crosshead = w.box(p, 0.28, 0.54, 0.43, c.steel, 1, 0, 0.27, true);
    crosshead.name = "crosshead";
    const piston = w.cylinder(p, 0.47, 0.16, c.copper, 2.5, 0, 0);
    piston.name = "piston";
    const rings = [-0.055, 0.055].map((x) =>
      w.ring(p, 0.478, 0.018, c.dark, 2.5 + x),
    );
    const rod = w.rod(p, origin, vec(1, 0, 0.27), 0.09, c.ivory);
    rod.mesh.name = "connecting-rod";
    const stem = w.rod(p, vec(1, 0, 0.27), vec(2.5, 0, 0.27), 0.06, c.steel);
    w.animations.push((t) => {
      const a = -t * ANGULAR_SPEED,
        slider = origin.x + sliderPosition(a, r, l),
        pin = vec(origin.x + r * Math.cos(a), r * Math.sin(a), 0.27);
      flywheel.rotation.z = a;
      crosshead.position.x = slider;
      piston.position.x = slider + 1.45;
      rings.forEach(
        (ring, i) =>
          (ring.position.x = piston.position.x + (i ? 1 : -1) * 0.055),
      );
      rod.place(pin, vec(slider, 0, 0.27));
      stem.place(vec(slider, 0, 0.27), vec(piston.position.x, 0, 0.27));
    });
  } else if (kind === "motor" || kind === "generator") {
    const dc =
      kind === "generator" || train.id === "shinkansen" || train.id === "tgv";
    const housing = w.cylinder(
      p,
      1.34,
      2.6,
      c.steel,
      0,
      0,
      0,
      "z",
      true,
      Math.PI * 0.5,
      Math.PI * 1.35,
    );
    housing.material = w.material(c.steel, 0.65);
    housing.material.side = T.DoubleSide;
    for (const z of [-1.35, 1.35]) {
      w.ring(p, 1.34, 0.08, c.dark, 0, 0, z, "z");
      w.bolts(p, 1.19, 16, z, "z");
    }
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6,
        coil = w.box(
          p,
          0.24,
          0.32,
          2.22,
          c.copper,
          1.04 * Math.cos(a),
          1.04 * Math.sin(a),
          0,
          true,
        );
      coil.rotation.z = a;
      for (let j = 0; j < 3; j++)
        w.ring(
          p,
          0.1,
          0.025,
          c.brass,
          1.04 * Math.cos(a),
          1.04 * Math.sin(a),
          -0.7 + j * 0.7,
          "z",
        );
    }
    const rotor = new T.Group();
    rotor.name = "rotor";
    p.add(rotor);
    w.cylinder(rotor, 0.73, 2.2, c.dark, 0, 0, 0, "z");
    w.cylinder(rotor, 0.15, 4.8, c.ivory, 0, 0, 0.4, "z");
    for (let i = 0; i < 18; i++) {
      const a = (i * Math.PI) / 9;
      const bar = w.box(
        rotor,
        0.08,
        0.1,
        2.22,
        dc ? c.copper : c.brass,
        0.71 * Math.cos(a),
        0.71 * Math.sin(a),
        0,
      );
      bar.rotation.z = a;
    }
    if (dc) {
      w.cylinder(rotor, 0.42, 0.4, c.copper, 0, 0, 1.6, "z");
      for (let i = 0; i < 18; i++) {
        const a = (i * Math.PI) / 9;
        const bar = w.box(
          rotor,
          0.025,
          0.04,
          0.42,
          c.dark,
          0.42 * Math.cos(a),
          0.42 * Math.sin(a),
          1.6,
        );
        bar.rotation.z = a;
      }
      for (const side of [-1, 1]) {
        w.box(p, 0.25, 0.25, 0.33, c.dark, side * 0.55, 0, 1.6);
        w.box(p, 0.26, 0.32, 0.42, c.brass, side * 0.76, 0, 1.6, true);
      }
    } else {
      w.ring(rotor, 0.74, 0.045, c.brass, 0, 0, -1.07, "z");
      w.ring(rotor, 0.74, 0.045, c.brass, 0, 0, 1.07, "z");
    }
    for (const x of [-0.9, 0.9])
      w.box(p, 0.5, 0.3, 2.6, c.dark, x, -1.3, 0, true);
    if (kind === "motor") {
      const small = w.gear(p, 0.42, 14, c.brass, 0, 0, 2.12),
        large = w.gear(p, 1.05, 35, c.steel, 1.47, 0, 2.12);
      small.name = "pinion";
      large.name = "driven-gear";
      w.cylinder(p, 0.15, 0.95, c.ivory, 1.47, 0, 2.35, "z");
      w.animations.push((t) => {
        const a = -t * ANGULAR_SPEED;
        rotor.rotation.z = a;
        small.rotation.z = a;
        large.rotation.z = (-a * 14) / 35;
      });
    } else
      w.animations.push((t) => {
        rotor.rotation.z = -t * ANGULAR_SPEED;
      });
  } else if (kind === "deltic") {
    const points = [vec(0, 1.8, 0), vec(0, -1.2, 1.73), vec(0, -1.2, -1.73)];
    w.box(p, 5.2, 0.23, 4.5, c.dark, 0, -1.65, 0, true);
    points.forEach((point) => {
      w.cylinder(p, 0.2, 4.9, c.brass, 0, point.y, point.z);
      for (const x of [-2.2, 2.2])
        w.ring(p, 0.3, 0.08, c.steel, x, point.y, point.z);
    });
    for (let bank = 0; bank < 3; bank++) {
      const a = points[bank],
        b = points[(bank + 1) % 3],
        axis = b.clone().sub(a).normalize(),
        perp = vec().crossVectors(vec(1, 0, 0), axis),
        span = a.distanceTo(b);
      for (let j = 0; j < 6; j++) {
        const x = -1.85 + j * 0.74,
          mid = a.clone().add(b).multiplyScalar(0.5);
        mid.x = x;
        const barrel = w.cylinder(
          p,
          0.29,
          span * 0.68,
          c.steel,
          mid.x,
          mid.y,
          mid.z,
          "y",
          j === 0,
          Math.PI / 2,
          j === 0 ? Math.PI : 2 * Math.PI,
        );
        barrel.quaternion.setFromUnitVectors(vec(0, 1, 0), axis);
        if (j === 0) {
          barrel.material = w.material(c.steel, 0.6);
          barrel.material.side = T.DoubleSide;
        }
        if (j !== 0) continue;
        const pistons = [0, 1].map(() => {
          const mesh = w.cylinder(p, 0.25, 0.18, c.copper, 0, 0, 0, "y");
          mesh.quaternion.setFromUnitVectors(vec(0, 1, 0), axis);
          return mesh;
        });
        const rods = [
          w.rod(p, a, b, 0.065, c.ivory),
          w.rod(p, a, b, 0.065, c.ivory),
        ];
        rods.forEach((r) => {
          r.mesh.name = "deltic-rod";
        });
        w.animations.push((t) => {
          const angle = t * ANGULAR_SPEED + (bank * 2 * Math.PI) / 3,
            { left, right } = opposedSliders(angle, span, 0.22, 1.13);
          const pa = a.clone().addScaledVector(axis, left),
            pb = a.clone().addScaledVector(axis, right);
          pa.x = pb.x = x;
          pistons[0].position.copy(pa);
          pistons[1].position.copy(pb);
          const ca = a
            .clone()
            .addScaledVector(axis, 0.22 * Math.cos(angle))
            .addScaledVector(perp, 0.22 * Math.sin(angle));
          ca.x = x;
          const cb = b
            .clone()
            .addScaledVector(axis, -0.22 * Math.cos(angle))
            .addScaledVector(perp, 0.22 * Math.sin(angle));
          cb.x = x;
          rods[0].place(ca, pa);
          rods[1].place(cb, pb);
        });
      }
    }
    for (const x of [-2.7, 2.7]) {
      const fan = w.gear(p, 0.45, 18, c.brass, x, 0, 0);
      fan.rotation.y = Math.PI / 2;
    }
  } else if (kind === "transformer") {
    w.box(p, 5.5, 0.22, 2.9, c.dark, 0, -1.55, 0, true);
    for (const y of [-1.14, 1.14])
      w.box(p, 4, 0.43, 1.1, c.steel, 0, y, 0, true);
    for (const x of [-1.5, 0, 1.5]) {
      w.box(p, 0.45, 2.1, 0.8, c.steel, x, 0, 0);
      for (let i = 0; i < 14; i++) {
        const coil = w.ring(
          p,
          0.57,
          0.047,
          c.copper,
          x,
          -0.8 + i * 0.12,
          0,
          "y",
        );
        coil.scale.z = 0.85;
      }
      w.cylinder(p, 0.12, 0.7, c.blue, x, 1.7, 0, "y");
      for (let i = 0; i < 5; i++)
        w.ring(p, 0.17, 0.033, c.ivory, x, 1.4 + i * 0.12, 0, "y");
    }
    for (let i = 0; i < 16; i++)
      w.box(p, 0.045, 2.05, 0.7, c.blue, -2.3 + i * 0.025, 0, -0.75);
    for (let i = 0; i < 16; i++)
      w.box(p, 0.045, 2.05, 0.7, c.blue, 1.9 + i * 0.025, 0, -0.75);
    // Laminations are indicated on exposed yoke faces.
    for (let i = 0; i < 12; i++)
      for (const y of [-1.14, 1.14])
        w.box(p, 3.8, 0.025, 0.02, c.dark, 0, y - 0.17 + i * 0.03, 0.56);
  } else if (kind === "pantograph") {
    w.box(p, 4, 0.18, 2, c.steel, 0, -1.2, 0, true);
    for (const x of [-1.5, 1.5])
      for (const z of [-0.65, 0.65]) {
        w.cylinder(p, 0.15, 0.5, c.blue, x, -0.88, z, "y");
        for (let i = 0; i < 4; i++)
          w.ring(p, 0.22, 0.045, c.ivory, x, -1.05 + i * 0.12, z, "y");
      }
    const diamond = train.id === "shinkansen";
    const frames = (diamond ? [-1, 1] : [1]).flatMap((direction) =>
      [-0.5, 0.5].map((z) => {
        const lower = w.rod(p, vec(), vec(1, 1, z), 0.06, c.steel);
        const upper = w.rod(p, vec(), vec(1, 1, z), 0.045, c.ivory);
        lower.mesh.name = "pantograph-lower";
        upper.mesh.name = "pantograph-upper";
        const joint = w.cylinder(p, 0.13, 0.15, c.brass, 0, 0, z, "z");
        return { direction, z, lower, upper, joint };
      }),
    );
    const collector = w.box(p, 0.34, 0.14, 3.2, c.brass, -0.7, 2.5, 0, true);
    w.box(collector, 0.16, 0.05, 3.15, c.dark, 0, 0.1, 0);
    w.animations.push((t) => {
      const angle = 0.62 + 0.1 * Math.sin(t * ANGULAR_SPEED),
        low = diamond ? 2.6 : 3.1,
        high = diamond ? 2.6 : 2.5,
        base = diamond ? 0 : -1.5;
      const top = vec(
        base + (low - high) * Math.cos(angle),
        -0.6 + (low + high) * Math.sin(angle),
        0,
      );
      for (const { direction, z, lower, upper, joint } of frames) {
        const elbow = vec(
          base + direction * low * Math.cos(angle),
          -0.6 + low * Math.sin(angle),
          z,
        );
        lower.place(vec(base, -0.6, z), elbow);
        upper.place(elbow, vec(top.x, top.y, z));
        joint.position.copy(elbow);
      }
      collector.position.copy(top);
    });
  } else if (kind === "bogie") {
    const three = train.id === "deltic",
      xs = three ? [-2.3, 0, 2.3] : [-1.8, 1.8];
    for (const side of [-1, 1])
      w.box(
        p,
        three ? 6.4 : 5.4,
        0.4,
        0.3,
        c.steel,
        0,
        0.55,
        side * 1.24,
        true,
      );
    for (const x of [-1, 1])
      w.box(p, 0.32, 0.35, 2.8, c.steel, x, 0.55, 0, true);
    // Two body supports indicate the shared Jacobs arrangement of TGV trailers.
    for (const x of train.id === "tgv" ? [-0.85, 0.85] : [0])
      w.cylinder(p, 0.6, 0.3, c.brass, x, 0.9, 0, "y");
    const spring = w.geometry("bogie-spring", () => {
      const points = Array.from({ length: 169 }, (_, i) => {
        const angle = (i / 168) * 7 * Math.PI * 2;
        return vec(
          0.18 * Math.cos(angle),
          (i / 168) * 0.48,
          0.18 * Math.sin(angle),
        );
      });
      return new T.TubeGeometry(
        new T.CatmullRomCurve3(points),
        168,
        0.035,
        6,
        false,
      );
    });
    for (const x of xs) {
      const shaft = new T.Group();
      shaft.position.set(x, 0, 0);
      p.add(shaft);
      w.cylinder(shaft, 0.12, 3.1, c.ivory, 0, 0, 0, "z");
      for (const side of [-1, 1]) {
        w.cylinder(shaft, 0.7, 0.18, c.steel, 0, 0, side * 1.4, "z");
        w.ring(shaft, 0.67, 0.05, c.ivory, 0, 0, side * 1.49, "z");
        w.cylinder(shaft, 0.74, 0.045, c.steel, 0, 0, side * 1.31, "z");
        w.cylinder(shaft, 0.19, 0.3, c.brass, 0, 0, side * 1.4, "z");
        if (three) {
          w.box(p, 0.18, 0.38, 0.25, c.copper, x + 0.69, 0, side * 1.4, true);
        } else {
          w.ring(shaft, 0.4, 0.055, c.copper, 0, 0, side * 0.82, "z");
          w.box(p, 0.4, 0.45, 0.25, c.copper, x + 0.37, 0, side * 0.82, true);
        }
        w.mesh(p, spring, c.brass, x, 0.35, side * 1.23);
        w.box(p, 0.4, 0.25, 0.46, c.steel, x, 0.15, side * 1.23, true);
      }
      w.animations.push((t) => {
        shaft.rotation.z = -t * ANGULAR_SPEED;
      });
    }
    for (const z of [-1.4, 1.4]) w.box(p, 7, 0.08, 0.13, c.ivory, 0, -0.74, z);
  } else if (kind === "maglev") {
    for (const side of [-1, 1]) {
      w.box(p, 8, 0.24, 0.35, c.ivory, 0, -1.5, side * 1.7);
      for (let i = 0; i < 9; i++) {
        const x = -3.5 + i * 0.88;
        for (const y of [-0.85, -0.25]) {
          const loop = w.ring(p, 0.3, 0.04, c.steel, x, y, side * 1.7, "z");
          loop.scale.x = 1.2;
        }
        const coil = w.box(
          p,
          0.58,
          0.28,
          0.15,
          c.copper,
          x,
          0.35,
          side * 1.7,
          true,
        );
        // Shared material cannot carry independent phases; each coil receives its own material.
        coil.material = (coil.material as T.MeshStandardMaterial).clone();
        w.animations.push((t) => {
          coil.material.emissive.set("#cf702e");
          coil.material.emissiveIntensity =
            0.1 + (0.35 * (1 + Math.sin(t * ANGULAR_SPEED - i * 0.65))) / 2;
        });
      }
      const cryostat = w.box(
        p,
        3.6,
        0.75,
        0.38,
        c.blue,
        0,
        -0.3,
        side * 1.1,
        true,
      );
      w.box(p, 3.1, 0.36, 0.025, c.ivory, 0, -0.3, side * 1.31, true);
      cryostat.name = "cryostat";
    }
    w.box(p, 4.2, 0.22, 2.5, c.ivory, 0, 0.18, 0, true);
    w.box(p, 8.5, 0.15, 4, c.dark, 0, -1.7, 0, true);
  }
  p.traverse((o) => {
    o.userData.part = part;
  });
  w.update(0);
  return { root: p, update: w.update, kind };
}
