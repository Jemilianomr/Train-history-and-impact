import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const palette = {
  steel: "#53646b",
  dark: "#25343b",
  copper: "#ba7047",
  brass: "#c79b4c",
  blue: "#3d8eae",
  ivory: "#ddd8c5",
  red: "#a44639",
};
export const vec = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);

/** Reuse primitive geometry and materials within one disposable model. */
export class Workshop {
  root = new T.Group();
  materials = new Map<string, T.MeshStandardMaterial>();
  geometries = new Map<string, T.BufferGeometry>();
  animations: ((time: number) => void)[] = [];
  material(color: string, metal = 0.5, opacity = 1) {
    const key = `${color}/${metal}/${opacity}`;
    if (!this.materials.has(key))
      this.materials.set(
        key,
        new T.MeshStandardMaterial({
          color,
          metalness: metal,
          roughness: metal > 0.65 ? 0.28 : 0.46,
          transparent: opacity < 1,
          opacity,
          depthWrite: opacity === 1,
          side: opacity < 1 ? T.DoubleSide : T.FrontSide,
        }),
      );
    return this.materials.get(key)!;
  }
  geometry(key: string, create: () => T.BufferGeometry) {
    if (!this.geometries.has(key)) this.geometries.set(key, create());
    return this.geometries.get(key)!;
  }
  mesh(
    p: T.Object3D,
    g: T.BufferGeometry,
    color: string,
    x = 0,
    y = 0,
    z = 0,
    metal = 0.5,
    opacity = 1,
  ) {
    const m = new T.Mesh(g, this.material(color, metal, opacity));
    m.position.set(x, y, z);
    m.castShadow = opacity === 1;
    m.receiveShadow = true;
    p.add(m);
    return m;
  }
  box(
    p: T.Object3D,
    w: number,
    h: number,
    d: number,
    color: string,
    x = 0,
    y = 0,
    z = 0,
    round = false,
  ) {
    const geo = round
      ? this.geometry(
          `round/${w}/${h}/${d}`,
          () => new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.09),
        )
      : this.geometry("box", () => new T.BoxGeometry());
    const m = this.mesh(p, geo, color, x, y, z);
    if (!round) m.scale.set(w, h, d);
    return m;
  }
  cylinder(
    p: T.Object3D,
    r: number,
    length: number,
    color: string,
    x = 0,
    y = 0,
    z = 0,
    axis: "x" | "y" | "z" = "x",
    open = false,
    start = 0,
    arc = Math.PI * 2,
  ) {
    const g = this.geometry(
      `cylinder/${open}/${start}/${arc}`,
      () => new T.CylinderGeometry(1, 1, 1, 40, 1, open, start, arc),
    );
    const m = this.mesh(p, g, color, x, y, z);
    m.scale.set(r, length, r);
    if (axis === "x") m.rotation.z = Math.PI / 2;
    if (axis === "z") m.rotation.x = Math.PI / 2;
    return m;
  }
  ring(
    p: T.Object3D,
    r: number,
    t: number,
    color: string,
    x = 0,
    y = 0,
    z = 0,
    axis: "x" | "y" | "z" = "x",
    arc = Math.PI * 2,
  ) {
    const g = this.geometry(
      `ring/${r}/${t}/${arc}`,
      () => new T.TorusGeometry(r, t, 8, 48, arc),
    );
    const m = this.mesh(p, g, color, x, y, z);
    if (axis === "x") m.rotation.y = Math.PI / 2;
    if (axis === "y") m.rotation.x = Math.PI / 2;
    return m;
  }
  rod(
    p: T.Object3D,
    a: T.Vector3,
    b: T.Vector3,
    r: number,
    color = palette.steel,
  ) {
    const m = this.cylinder(p, r, 1, color, 0, 0, 0, "y");
    m.userData.moving = true;
    const place = (start: T.Vector3, end: T.Vector3) => {
      m.position.copy(start).add(end).multiplyScalar(0.5);
      m.scale.y = start.distanceTo(end);
      m.quaternion.setFromUnitVectors(
        vec(0, 1, 0),
        end.clone().sub(start).normalize(),
      );
    };
    place(a, b);
    return { mesh: m, place };
  }
  bolts(
    p: T.Object3D,
    r: number,
    count: number,
    x: number,
    axis: "x" | "z" = "x",
  ) {
    const g = this.geometry(
      "bolt",
      () => new T.CylinderGeometry(0.055, 0.055, 0.08, 6),
    );
    const m = new T.InstancedMesh(g, this.material(palette.brass, 0.75), count);
    for (let i = 0; i < count; i++) {
      const a = (i * 2 * Math.PI) / count;
      const position =
        axis === "x"
          ? vec(x, r * Math.cos(a), r * Math.sin(a))
          : vec(r * Math.cos(a), r * Math.sin(a), x);
      const q = new T.Quaternion().setFromAxisAngle(
        axis === "x" ? vec(0, 0, 1) : vec(1, 0, 0),
        Math.PI / 2,
      );
      m.setMatrixAt(i, new T.Matrix4().compose(position, q, vec(1, 1, 1)));
    }
    p.add(m);
    return m;
  }
  gear(
    p: T.Object3D,
    r: number,
    teeth: number,
    color: string,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const group = new T.Group();
    group.position.set(x, y, z);
    p.add(group);
    this.cylinder(group, r * 0.88, 0.17, color, 0, 0, 0, "z");
    this.cylinder(group, r * 0.23, 0.26, palette.steel, 0, 0, 0, "z");
    const g = this.geometry(
      `tooth/${r}/${teeth}`,
      () => new T.BoxGeometry(r * 0.2, r * 0.19, 0.18),
    );
    const inst = new T.InstancedMesh(g, this.material(color, 0.7), teeth);
    for (let i = 0; i < teeth; i++) {
      const a = (i * 2 * Math.PI) / teeth;
      inst.setMatrixAt(
        i,
        new T.Matrix4().compose(
          vec(r * 0.94 * Math.cos(a), r * 0.94 * Math.sin(a), 0),
          new T.Quaternion().setFromAxisAngle(vec(0, 0, 1), a),
          vec(1, 1, 1),
        ),
      );
    }
    group.add(inst);
    return group;
  }
  update = (time: number) => this.animations.forEach((fn) => fn(time));
}

/** Batch only direct static meshes. Moving parts and cutaway covers stay separate. */
export function batchStaticMeshes(parent: T.Object3D) {
  const groups = new Map<string, T.Mesh[]>();
  for (const child of parent.children) {
    if (
      !(child instanceof T.Mesh) ||
      child instanceof T.InstancedMesh ||
      child.userData.moving ||
      child.userData.cover ||
      child.userData.detail ||
      Array.isArray(child.material) ||
      child.material.transparent
    )
      continue;
    const key =
      child.material.uuid +
      "/" +
      (child.geometry.index ? "indexed/" : "nonindexed/") +
      Object.keys(child.geometry.attributes).sort().join(",");
    const list = groups.get(key) ?? [];
    list.push(child);
    groups.set(key, list);
  }
  for (const meshes of groups.values()) {
    if (meshes.length < 3) continue;
    const copies = meshes.map((m) => {
      m.updateMatrix();
      return m.geometry.clone().applyMatrix4(m.matrix);
    });
    const merged = mergeGeometries(copies);
    copies.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new T.Mesh(merged, meshes[0].material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    // The caller uses unique source geometries; shared Workshop primitives are not batched here.
    meshes.forEach((m) => {
      parent.remove(m);
      m.geometry.dispose();
    });
  }
}
