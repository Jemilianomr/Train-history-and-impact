import * as T from 'three';
import type { PartId, Train } from '../types';
import { sliderPosition } from './mechanics';

export interface TrainModel {
  root: T.Group;
  parts: Record<PartId, T.Group>;
  update: (time: number) => void;
  length: number;
}
const steel = '#45534f', dark = '#293b38', tire = '#46504a', brass = '#bd934a', copper = '#b7764e';

export function buildTrain(train: Train): TrainModel {
  const root = new T.Group();
  const parts = Object.fromEntries(['body', 'power', 'drive', 'running', 'supply'].map(id => {
    const g = new T.Group(); g.name = id; g.userData.part = id; root.add(g); return [id, g];
  })) as Record<PartId, T.Group>;
  const materialCache = new Map<string, T.MeshStandardMaterial>();
  const animated: ((t: number) => void)[] = [];
  const material = (color: string, metal = .25, opacity = 1) => {
    const key = `${color}/${metal}/${opacity}`;
    if (!materialCache.has(key)) materialCache.set(key, new T.MeshStandardMaterial({ color, metalness: metal, roughness: .57, transparent: opacity < 1, opacity }));
    return materialCache.get(key)!;
  };
  function mesh(parent: T.Object3D, geometry: T.BufferGeometry, color: string, x = 0, y = 0, z = 0, metal = .25) {
    const m = new T.Mesh(geometry, material(color, metal)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(parent: T.Object3D, w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0) {
    return mesh(parent, new T.BoxGeometry(w, h, d), color, x, y, z);
  }
  function cyl(parent: T.Object3D, r: number, length: number, color: string, x: number, y: number, z: number, axis: 'x' | 'y' | 'z' = 'y', radial = 20) {
    const m = mesh(parent, new T.CylinderGeometry(r, r, length, radial), color, x, y, z);
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    if (axis === 'z') m.rotation.x = Math.PI / 2;
    return m;
  }
  function rod(parent: T.Object3D, a: T.Vector3, b: T.Vector3, radius: number, color = steel) {
    const m = mesh(parent, new T.CylinderGeometry(radius, radius, 1, 8), color);
    const place = (p: T.Vector3, q: T.Vector3) => { m.position.copy(p).add(q).multiplyScalar(.5); m.scale.y = p.distanceTo(q); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), q.clone().sub(p).normalize()); };
    place(a, b); return { mesh: m, place };
  }
  const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);

  function wheel(parent: T.Object3D, x: number, radius: number, z: number, spoked: boolean, phase = 0) {
    const g = new T.Group(); g.userData.wheel = true; g.position.set(x, radius + .12, z); parent.add(g);
    const rim = mesh(g, new T.TorusGeometry(radius * .89, radius * .105, 7, 24), tire); rim.castShadow = true;
    cyl(g, radius * .16, .20, brass, 0, 0, 0, 'z');
    if (spoked) {
      const spokes = new T.InstancedMesh(new T.BoxGeometry(radius * 1.56, radius * .085, .12), material(steel), 6);
      const m = new T.Matrix4(); const q = new T.Quaternion();
      for (let i = 0; i < 6; i++) { q.setFromAxisAngle(v(0, 0, 1), i * Math.PI / 6); m.compose(v(0, 0, 0), q, v(1, 1, 1)); spokes.setMatrixAt(i, m); }
      spokes.castShadow = true; g.add(spokes);
      const weight = mesh(g, new T.CircleGeometry(radius * .62, 16, 0, Math.PI * .72), steel, 0, 0, .07); weight.rotation.z = 2;
    } else cyl(g, radius * .83, .13, steel, 0, 0, 0, 'z');
    animated.push(t => { g.rotation.z = -(t * 1.7 + phase); });
    return g;
  }
  function axle(parent: T.Object3D, x: number, r: number, spoked = false) {
    const half = train.gauge / 2 + .10;
    wheel(parent, x, r, half, spoked, 0); wheel(parent, x, r, -half, spoked, Math.PI / 2);
    cyl(parent, .085, train.gauge + .3, steel, x, r + .12, 0, 'z', 10);
  }
  function linkage(parent: T.Object3D, x: number, radius: number, length: number, side: number, axisAngle = 0, coupled: number[] = []) {
    const z = side * (train.gauge / 2 + .28), y = radius + .12, cr = radius * .33;
    const axis = v(Math.cos(axisAngle), Math.sin(axisAngle), 0);
    const origin = v(x, y, z);
    const piston = box(parent, .25, .26, .24, '#d2c9a7');
    const connecting = rod(parent, origin, origin.clone().addScaledVector(axis, length), .065, '#b9b9a4');
    const pistonRod = rod(parent, origin, origin.clone().addScaledVector(axis, length + .7), .055, '#b9b9a4');
    const c = origin.clone().addScaledVector(axis, length + .7);
    const cylinder = cyl(parent, .27, .9, dark, c.x, c.y, z, 'x'); cylinder.rotation.z = Math.PI / 2 + axisAngle;
    const rails = [-.17, .17].map(offset => rod(parent, origin.clone().addScaledVector(axis, length - .45).add(v(0, offset, 0)), origin.clone().addScaledVector(axis, length + .4).add(v(0, offset, 0)), .035, steel));
    const pins = [x, ...coupled].map(px => cyl(parent, .11, .13, brass, px, y, z + side * .04, 'z', 10));
    const coupling = coupled.length ? rod(parent, v(x, y, z), v(coupled[coupled.length - 1], y, z), .075, '#b9b9a4') : null;
    void rails;
    animated.push(time => {
      const theta = -(time * 1.7 + (side < 0 ? Math.PI / 2 : 0));
      const pin = v(x + cr * Math.cos(theta), y + cr * Math.sin(theta), z);
      const s = sliderPosition(theta - axisAngle, cr, length);
      const slide = origin.clone().addScaledVector(axis, s);
      connecting.place(pin, slide); piston.position.copy(slide); piston.rotation.z = axisAngle;
      pistonRod.place(slide, slide.clone().addScaledVector(axis, .95));
      pins.forEach((p, i) => { p.position.x = [x, ...coupled][i] + cr * Math.cos(theta); p.position.y = y + cr * Math.sin(theta); });
      if (coupling) coupling.place(pin, v(coupled[coupled.length - 1] + cr * Math.cos(theta), pin.y, z));
    });
  }
  function bogie(x: number, count = 2, spacing = 1.9) {
    const p = parts.running;
    const wheelbase = (count - 1) * spacing;
    box(p, wheelbase + 1.1, .35, train.gauge + .25, dark, x, 1.05, 0);
    for (let i = 0; i < count; i++) {
      const px = x + (i - (count - 1) / 2) * spacing;
      axle(p, px, .46);
      for (const sign of [-1, 1]) {
        cyl(p, .15, .40, '#969d8e', px, 1.15, sign * (train.gauge / 2 + .19));
        for (let ring = 0; ring < 4; ring++) { const m = mesh(p, new T.TorusGeometry(.15, .025, 5, 10), dark, px, 1.03 + ring * .07, sign * (train.gauge / 2 + .19)); m.rotation.x = Math.PI / 2; }
        box(p, .26, .38, .12, copper, px + .45, .65, sign * (train.gauge / 2 + .23));
      }
      cyl(parts.drive, .29, 1.05, '#6d817c', px - .27, .94, 0, 'z');
    }
    cyl(p, .43, .35, '#748176', x, 1.4, 0);
  }
  function cabin(x: number, y: number, w: number, h: number, d: number, color: string, rocket = false) {
    const p = parts.body;
    if (rocket) { box(p, 1.2, .16, 1.8, dark, x, y - .6, 0); rod(p, v(x + .55, y - .5, -.8), v(x + .55, y + .4, -.8), .04, brass); rod(p, v(x + .55, y - .5, .8), v(x + .55, y + .4, .8), .04, brass); return; }
    box(p, w, h, d, color, x, y, 0);
    box(p, w + .24, .16, d + .25, dark, x, y + h / 2 + .05, 0);
    for (const z of [-d / 2 - .014, d / 2 + .014]) {
      box(p, w * .55, h * .42, .035, '#203b40', x, y + .16, z);
      box(p, .055, h * .45, .05, brass, x, y + .16, z);
    }
  }
  function boiler(x: number, y: number, length: number, radius: number, color: string) {
    const p = parts.power;
    const shell = cyl(p, radius, length, color, x, y, 0, 'x', 32); shell.userData.cover = true;
    const frontPlate = cyl(p, radius * 1.02, .13, dark, x - length / 2, y, 0, 'x'); frontPlate.userData.cover = true;
    const tubes = new T.Group(); tubes.userData.detail = true; tubes.visible = false; p.add(tubes);
    // Explanatory tube bank: count and wall thickness are intentionally schematic.
    for (let row = -2; row <= 2; row++) for (let col = -2; col <= 2; col++) {
      if (row * row + col * col > 6) continue;
      cyl(tubes, radius * .07, length * .95, '#ba985e', x, y + row * radius * .26, col * radius * .26, 'x', 8);
    }
    const inner = cyl(tubes, radius * .94, length * .98, '#b6b78f', x, y, 0, 'x', 28);
    (inner.material as T.MeshStandardMaterial) = new T.MeshStandardMaterial({color:'#b6b78f',transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide});
    for (let i = 0; i < 5; i++) {
      const px = x - length * .38 + i * length * .19;
      const band = mesh(p, new T.TorusGeometry(radius + .015, .028, 6, 28), brass, px, y, 0); band.rotation.y = Math.PI / 2;
    }
    for (const z of [-radius * .92, radius * .92]) rod(p, v(x - length * .43, y + radius * .35, z), v(x + length * .42, y + radius * .35, z), .034, brass);
    const top = y + radius;
    cyl(p, radius * .26, radius * .65, color, x + length * .18, top + radius * .2, 0);
    const dome = mesh(p, new T.SphereGeometry(radius * .26, 12, 8), brass, x + length * .18, top + radius * .53, 0); dome.scale.y = .55;
    cyl(p, radius * .22, radius * .3, brass, x + length * .36, top + .1, 0);
    const chimneyX = x - length * .38;
    cyl(p, radius * .23, radius * 1.25, dark, chimneyX, top + radius * .43, 0);
    cyl(p, radius * .29, .11, brass, chimneyX, top + radius * 1.04, 0);
    return { chimneyX, chimneyY: top + radius * 1.1 };
  }
  function buffers(x: number, y: number, p: T.Object3D = parts.body) {
    box(p, .17, .35, train.gauge + .9, '#954e3d', x, y, 0);
    for (const z of [-.72, .72]) { cyl(p, .08, .30, steel, x - .17, y, z, 'x', 10); cyl(p, .20, .12, dark, x - .36, y, z, 'x', 14); }
  }
  function smallRivets(p: T.Object3D, length: number, x: number, y: number, z: number) {
    const count = Math.max(3, Math.floor(length / .35));
    const m = new T.InstancedMesh(new T.SphereGeometry(.045, 5, 4), material('#8e9886'), count);
    for (let i = 0; i < count; i++) m.setMatrixAt(i, new T.Matrix4().makeTranslation(x - length / 2 + i * length / (count - 1), y, z));
    p.add(m);
  }

  if (train.id === 'rocket') {
    box(parts.body, 4.5, .18, 1.55, '#453f33', -.1, 1.05, 0);
    boiler(-.55, 1.96, 2.75, .66, '#cfaa4f');
    // Tall chimney is distinctive of the Rainhill reconstruction.
    cyl(parts.power, .15, 1.8, '#3d4238', -1.595, 3.95, 0);
    cyl(parts.power, .21, .12, brass, -1.595, 4.87, 0);
    box(parts.power, .85, 1.12, 1.22, '#a17636', 1.0, 1.6, 0);
    axle(parts.running, -.9, .76, true); axle(parts.running, 1.45, .47, true);
    linkage(parts.drive, -.9, .76, 1.45, 1, .52); linkage(parts.drive, -.9, .76, 1.45, -1, .52);
    cabin(1.55, 1.5, 1, 1, 1.6, '#a17b3c', true);
    const p = parts.supply;
    box(p, 1.9, .22, 1.7, '#63573c', 3.36, .92);
    box(p, 1.85, .7, 1.65, '#7e744b', 3.36, 1.38);
    for (const x of [2.8, 3.96]) axle(p, x, .43, true);
    cyl(p, .58, 1.2, '#846b3e', 3.4, 2.05, 0, 'z');
    for (const z of [-.52, 0, .52]) { const b = mesh(p, new T.TorusGeometry(.59, .035, 6, 24), steel, 3.4, 2.05, z); b.rotation.y = 0; }
    rod(parts.body, v(2, 1, 0), v(2.5, 1, 0), .06);
    buffers(-2.42, .96);
    root.position.x = -.6;
  } else if (train.id === 'bigboy') {
    const p = parts.body;
    box(p, 23.2, .55, 2.3, dark, -5.6, 1.65);
    boiler(-6.3, 3.1, 15.1, 1.32, '#43514a');
    cabin(2.45, 3.3, 3.5, 2.45, 3.15, '#3c4943');
    box(parts.power, 3.8, 2.3, 2.45, '#36443c', 1, 2.55);
    const front = [-13.8, -11.8, -9.8, -7.8], rear = [-5.4, -3.4, -1.4, .6];
    [...front, ...rear].forEach(x => axle(parts.running, x, .8636, true));
    [-17.0, -15.7, 2.7, 4.05].forEach(x => axle(parts.running, x, .48));
    for (const side of [-1, 1]) { linkage(parts.drive, -13.8, .8636, 2.2, side, Math.PI, front.slice(1)); linkage(parts.drive, -5.4, .8636, 2.2, side, Math.PI, rear.slice(1)); }
    buffers(-18, 1.05);
    for (const side of [-1, 1]) {
      box(p, 17, .17, .55, '#768070', -6.5, 2.65, side * 1.48);
      rod(p, v(-14.5, 3.4, side * 1.4), v(1.3, 3.4, side * 1.4), .04, brass);
      smallRivets(p, 15, -6, 2.6, side * 1.53);
      for (let i = 0; i < 3; i++) box(p, .7, .14, .4, steel, 4.0, .75 + i * .4, side * 1.35);
    }
    const s = parts.supply;
    box(s, 12.1, 2.65, 3.2, '#414d46', 11.6, 2.6);
    box(s, 12.3, .35, 3.3, dark, 11.6, 1.3);
    box(s, 4, .6, 2.85, '#242e29', 7.8, 4.1);
    for (const x of [6.5, 7.8, 9.1, 11.6, 12.9, 14.2, 15.5]) axle(s, x, .53);
    for (const z of [-1.62, 1.62]) smallRivets(s, 11, 11.6, 2.1, z);
    rod(p, v(4.2, 1.5, 0), v(5.6, 1.5, 0), .14);
    cyl(p, .28, .18, brass, -14, 3.25, 0, 'x');
    // Coal is an instanced load, rather than hundreds of separate draw calls.
    const coal = new T.InstancedMesh(new T.IcosahedronGeometry(.19, 0), material('#26342e'), 70);
    for (let i = 0; i < 70; i++) coal.setMatrixAt(i, new T.Matrix4().makeTranslation(6.1 + (i % 10) * .35, 4.46 + Math.sin(i * 7) * .08, -.95 + Math.floor(i / 10) * .3)); s.add(coal);
  } else if (train.id === 'garratt') {
    box(parts.body, 13.5, .48, 2.2, dark, 0, 1.9);
    boiler(-.9, 3.05, 8.4, 1.1, '#53634e');
    cabin(4.3, 3.16, 3.1, 2.5, 2.9, '#53634e');
    for (const center of [-8.6, 8.6]) {
      box(parts.running, 10.9, .4, 1.6, dark, center, 1.13);
      const driveX = [-2.5, -.85, .85, 2.5].map(x => x + center);
      driveX.forEach(x => axle(parts.running, x, .62, true));
      const pilotX = center < 0 ? [center - 4.5, center - 3.45, center + 3.9] : [center - 3.9, center + 3.45, center + 4.5];
      pilotX.forEach(x => axle(parts.running, x, .37));
      for (const side of [-1, 1]) linkage(parts.drive, driveX[0], .62, 1.65, side, Math.PI, driveX.slice(1));
      cyl(parts.running, .6, .32, brass, center < 0 ? -5 : 5, 1.8, 0);
      box(parts.supply, 5.2, 1.9, 2.3, '#53634e', center, 2.55);
      for (const z of [-1.17, 1.17]) smallRivets(parts.supply, 4.8, center, 2, z);
    }
    box(parts.supply, 3.6, .4, 2.0, '#303c30', 8.5, 3.62);
    buffers(-13.7, 1.08);
    for (const z of [-1.28, 1.28]) rod(parts.body, v(-5, 3.25, z), v(2.8, 3.25, z), .045, brass);
  } else {
    // Smooth, section-based hulls preserve a different nose profile for each family.
    function hull(parent: T.Object3D, sections: [number, number, number, number][], color: string) {
      const ring = 24, positions: number[] = [], indices: number[] = [];
      sections.forEach(([x, halfWidth, halfHeight, center]) => {
        for (let i = 0; i < ring; i++) {
          const a = i * Math.PI * 2 / ring;
          // Rounded rectangular cross-section, rather than a circular tube.
          const z = Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** .48 * halfWidth;
          const y = Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** .65 * halfHeight;
          positions.push(x, center + y, z);
        }
      });
      for (let s = 0; s < sections.length - 1; s++) for (let i = 0; i < ring; i++) {
        const a = s * ring + i, b = s * ring + (i + 1) % ring, c = a + ring, d = b + ring;
        indices.push(a, c, b, b, c, d);
      }
      for (let i = 1; i < ring - 1; i++) { indices.push(0, i, i + 1); const offset = (sections.length - 1) * ring; indices.push(offset, offset + i + 1, offset + i); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); geo.setIndex(indices); geo.computeVertexNormals();
      return mesh(parent, geo, color);
    }
    function windows(xStart: number, xEnd: number, y: number, z: number, count: number, width = .86) {
      for (const side of [-1, 1]) for (let i = 0; i < count; i++) {
        const x = xStart + i * (xEnd - xStart) / Math.max(1, count - 1);
        box(parts.body, width, .63, .035, '#304d51', x, y, side * z);
        box(parts.body, width, .035, .045, '#b5bdad', x, y - .34, side * z);
      }
    }
    function pantograph(x: number, base: number) {
      const p = parts.supply;
      for (const z of [-.45, .45]) {
        cyl(p, .12, .25, '#e4ded0', x, base + .14, z);
        rod(p, v(x - .8, base + .35, z), v(x + .7, base + 1.1, z), .045, dark);
        rod(p, v(x + .7, base + 1.1, z), v(x - .1, base + 1.7, z), .045, dark);
      }
      box(p, .33, .08, 1.9, '#667065', x - .1, base + 1.72);
      box(p, 2, .12, 1.15, dark, x, base);
    }
    function electricalModule(x: number) {
      box(parts.power, 2.6, .64, 1.55, '#7a8a7c', x, 1.02);
      for (let i = 0; i < 12; i++) box(parts.power, .09, .65, 1.67, '#9b9f8d', x - 1.18 + i * .21, 1.02);
      box(parts.power, 1.5, .7, 1.5, '#d1c29b', x + 2.5, 1.06);
      for (let i = 0; i < 4; i++) cyl(parts.power, .14, .52, copper, x + 2 + i * .32, 1.05, 0, 'z');
    }
    if (train.id === 'deltic') {
      hull(parts.body, [[-10,.8,.65,2.2],[-9.4,1.3,1.2,2.55],[-7.6,1.42,1.35,2.8],[7.6,1.42,1.35,2.8],[9.4,1.3,1.2,2.55],[10,.8,.65,2.2]], '#397c8d');
      for (const side of [-1, 1]) {
        box(parts.body, 15.3, .42, .04, '#e0d3a6', 0, 2.45, side * 1.43);
        box(parts.body, 15, .06, .06, '#bdbba0', 0, 2.17, side * 1.46);
        for (let i = 0; i < 22; i++) box(parts.body, .15, .68, .045, '#235969', -5.8 + i * .54, 3.45, side * 1.42);
        for (const x of [-8.4, 8.4]) box(parts.body, 1.13, .65, .04, '#1d3d45', x, 3.16, side * 1.32);
      }
      for (const side of [-1, 1]) {
        const nose = box(parts.body, .08, .55, 1.5, '#234249', side * 9.32, 3.3); nose.rotation.z = side * .3;
        for (let i = 0; i < 3; i++) { const chev = box(parts.body, .06, .12, 1.3 - i * .2, '#dfc890', side * (9.78 - i * .07), 2.3 - i * .25); chev.rotation.z = side * .16; }
      }
      bogie(-6.1, 3, 1.65); bogie(6.1, 3, 1.65);
      for (const x of [-3.6, 3.2]) {
        const engine = new T.Group(); engine.position.set(x, 2.42, 0); parts.power.add(engine);
        // Three banks form the triangular cross-section of each Deltic power unit.
        const points = [v(0, .8, 0), v(0, -.45, .72), v(0, -.45, -.72)];
        for (let bank = 0; bank < 3; bank++) for (let j = 0; j < 6; j++) {
          const a = points[bank].clone().add(v((j - 2.5) * .37, 0, 0));
          const b = points[(bank + 1) % 3].clone().add(v((j - 2.5) * .37, 0, 0));
          rod(engine, a, b, .15, '#7f937c');
        }
        for (const point of points) cyl(engine, .16, 2.6, brass, point.x, point.y, point.z, 'x');
        cyl(parts.drive, .62, 1.15, '#9caa93', x + 1.9, 2.43, 0, 'x');
        for (const z of [-.55,.55]) cyl(parts.supply, .42, .10, '#314f4e', x, 4.18, z);
      }
      box(parts.supply, 4.5, .58, 1.55, '#536654', 0, .95);
      buffers(-10.2, 1.2); buffers(10.2, 1.2);
    } else if (train.id === 'maglev') {
      hull(parts.body, [[-14,.12,.18,1.0],[-12,.45,.35,1.1],[-9,1.1,.65,1.35],[-6,1.4,1.15,1.83],[-3.3,1.42,1.5,2.15],[13.5,1.42,1.5,2.15]], '#e7ece8');
      for (const z of [-1.433,1.433]) { box(parts.body, 17.1,.18,.035,'#497da5',5.0,2.1,z); box(parts.body, 17.1,.12,.035,'#497da5',5.0,1.8,z); }
      windows(-1.4, 12, 2.85, 1.432, 12, .55);
      for (const z of [-.85,.85]) { const wind = box(parts.body, 1.7,.04,.65,'#28434c',-4.3,3.37,z); wind.rotation.z = .28; }
      for (const x of [-2,9]) {
        for (const side of [-1,1]) {
          box(parts.power, 3.6,.68,.38,'#adbdba',x,.92,side*1.25);
          for (let i=0;i<4;i++) cyl(parts.power,.19,.2,copper,x-1.3+i*.86,.92,side*1.5,'z');
          const w=wheel(parts.supply,x,.3,side*1.0,false); w.position.y=.45; w.visible=true;
        }
      }
      for (const side of [-1,1]) {
        box(parts.running, 31,1.05,.28,'#b8c3b6',0,.5,side*1.85);
        for(let i=0;i<30;i++) {
          const x=-14.5+i;
          for(const y of [.35,.72]) {
            const loop=mesh(parts.running,new T.TorusGeometry(.18,.035,5,10), '#8a9e8d',x,y,side*1.68); loop.scale.x=1.5;
          }
          box(parts.drive,.58,.2,.07,copper,x,.95,side*1.69);
        }
      }
    } else {
      const sh = train.id === 'shinkansen', tgv = train.id === 'tgv';
      const length = tgv ? 21 : 25;
      const front = -length/2;
      const white = sh ? '#e9e4d1' : tgv ? '#d3793e' : '#e8e9e3';
      const halfW = sh ? 1.67 : 1.45;
      const sections: [number,number,number,number][] = sh ? [[front,.16,.23,1.85],[front+1,.85,.6,2.0],[front+2.6,1.5,1.25,2.5],[front+4,halfW,1.45,2.7],[length/2,halfW,1.45,2.7]] : tgv ? [[front,.82,.45,1.5],[front+2,1.2,.75,2.0],[front+4,halfW,1.25,2.7],[length/2,halfW,1.25,2.7]] : [[front,.22,.22,1.2],[front+1.8,.75,.6,1.6],[front+4,1.35,1.2,2.25],[front+6,halfW,1.4,2.65],[length/2,halfW,1.4,2.65]];
      hull(parts.body, sections, white);
      if(sh) {
        // Separate bulb nose and the two raised cab windscreens identify the series 0.
        const nose=mesh(parts.body,new T.SphereGeometry(.5,24,12),'#e9e4d1',front+.3,1.9,0);nose.scale.set(1.25,.75,1.1);
        for(const side of [-1,1]) { const win=box(parts.body,1.25,.5,.065,'#28434b',front+2.65,3.25,side*.92);win.rotation.y=side*.48; win.rotation.z=.32; }
      } else {
        const windshield = box(parts.body, 1.6,.055,2.02,'#263f45',front+(tgv?3.5:4.1),3.45);
        windshield.rotation.z=tgv?.48:.3;
      }
      const band=sh?'#3c6a98':tgv?'#62554a':'#91475b';
      for(const side of [-1,1]) {
        box(parts.body,length-(sh?4:5),sh?.7:.23,.045,band,sh?2:2.5,sh?2.4:1.7,side*(halfW+.012));
        if(tgv) for(let i=0;i<14;i++) box(parts.body,.13,.75,.04,'#514d43',-1.8+i*.65,3.15,side*1.465);
        for(const x of [front+5.1,length/2-1]) { box(parts.body,.035,1.8,.045,'#a9b3a6',x,2.38,side*(halfW+.04)); box(parts.body,.75,.035,.05,'#a9b3a6',x+.38,1.48,side*(halfW+.04)); }
      }
      if(!tgv)windows(front+(sh?5:7),length/2-1.4,2.95,halfW+.04,sh?9:11);
      bogie(front+5,2,2.4);bogie(length/2-3,2,2.4);
      electricalModule(-1.2);
      pantograph(tgv?5.8:3.2,4.18);
      if(tgv) {
        const p=parts.body;
        box(p,.7,2.35,2.35,'#54564c',11.1,2.55);
        hull(p,[[11.5,1.38,1.25,2.65],[19,1.38,1.25,2.65]],'#cbc4af');
        windows(12.6,18,3,1.4,5);
        for(const z of [-1.4,1.4]) box(p,7.5,.3,.04,'#d3793e',15.3,1.65,z);
        bogie(18.6,2,2.4);
        root.position.x=-3;
      }
      const lightX=front+(sh?.8:1.2);
      for(const z of [-.55,.55]) { const light=mesh(parts.body,new T.SphereGeometry(.12,10,6),'#eedab1',lightX,1.75,z);light.scale.x=.3; }
    }
  }
  // Share one material per part/color, so highlighting never leaks into other parts.
  for (const [id, group] of Object.entries(parts)) {
    const copies = new Map<T.Material,T.Material>();
    group.traverse(o => {
      o.userData.part=id;
      if(o instanceof T.Mesh) {
        const original=o.material as T.Material;
        if(!copies.has(original))copies.set(original,original.clone());
        o.material=copies.get(original)!;
      }
    });
  }
  materialCache.forEach(m=>m.dispose());
  return { root,parts,length:train.length,update: t => animated.forEach(fn=>fn(t)) };
}

export function disposeObject(object: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
  object.traverse(o => {
    // Instanced attributes belong to the object, not to its shared geometry.
    // This event lets WebGLObjects release instanceMatrix/instanceColor buffers.
    if(o instanceof T.InstancedMesh)o.dispose();
    if(o instanceof T.Mesh || o instanceof T.LineSegments) {
      geometries.add(o.geometry);
      (Array.isArray(o.material)?o.material:[o.material]).forEach((m:T.Material)=>materials.add(m));
    }
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
