import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { trains } from '../src/data/trains';
import { sources } from '../src/data/sources';
import { sliderPosition } from '../src/scene/mechanics';
import { buildTrain, disposeObject } from '../src/scene/model';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByText('Preparando el diorama…')).toHaveCount(0);
}

test('ocho casos con referencias resolubles y componentes completos', () => {
  expect(trains).toHaveLength(8);
  expect(new Set(trains.map(t => t.id)).size).toBe(8);
  expect(new Set(trains.map(t => t.country)).size).toBe(6);
  for (const train of trains) {
    expect(new Set(train.parts.map(p => p.id)).size).toBe(5);
    const ids = [...train.sources, ...train.parts.flatMap(p => p.sources), ...train.history.flatMap(h => h.sources), ...train.materials.flatMap(m=>m.sources), ...train.stats.map(s=>s.source), ...train.drawings.map(d=>d.source)];
    for (const id of ids) { expect(sources[id], `${train.id}: ${id}`).toBeTruthy(); expect(new URL(sources[id].url).protocol).toBe('https:'); }
    expect(train.history.length).toBeGreaterThanOrEqual(3); expect(train.fidelity.length).toBeGreaterThan(40);
  }
});

test('la biela conserva longitud durante una revolución completa', () => {
  const radius=.28,length=1.5;
  for(let deg=0;deg<=360;deg++){
    const theta=deg*Math.PI/180, x=sliderPosition(theta,radius,length);
    const d=Math.hypot(x-radius*Math.cos(theta),radius*Math.sin(theta));
    expect(d).toBeCloseTo(length,10);
    expect(x).toBeGreaterThanOrEqual(length-radius-1e-10);expect(x).toBeLessThanOrEqual(length+radius+1e-10);
  }
  expect(()=>sliderPosition(0,1,.5)).toThrow(RangeError);
});

test('los rodajes visibles conservan el número de ruedas documentado', () => {
  const counts: Record<string,number>={rocket:8,garratt:28,bigboy:38,deltic:12,shinkansen:8,velaro:8};
  for(const [id,count] of Object.entries(counts)){
    const model=buildTrain(trains.find(t=>t.id===id)!);let wheels=0;
    model.root.traverse(o=>{if(o.userData.wheel)wheels++;});expect(wheels,id).toBe(count);
    for(const t of [0,.7,2.8])model.update(t);
    disposeObject(model.root);
  }
});

test('la colección carga sin errores y funciona la búsqueda y los filtros', async ({page}) => {
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
  await expect(page.getByRole('heading',{level:1})).toContainText('El mundo, sobre rieles');
  await page.getByRole('textbox',{name:'Buscar trenes'}).fill('japon');
  await expect(page.locator('.train-card')).toHaveCount(2);
  await page.getByRole('button',{name:'Limpiar búsqueda'}).click();
  await page.getByLabel('Filtrar por región').selectOption('África');await expect(page.locator('.train-card')).toHaveCount(1);
  await page.getByLabel('Filtrar por tecnología').selectOption('Eléctrico');await expect(page.getByText('No encontramos ese tren')).toBeVisible();
  await page.getByRole('button',{name:'Restablecer filtros'}).click();await expect(page.locator('.train-card')).toHaveCount(8);
  expect(errors).toEqual([]);
});

for(const train of trains){
  test(`${train.name}: cinco sistemas, desmontaje, aislamiento y fuentes`, async ({page}) => {
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
    await page.getByTestId(`train-${train.id}`).click();await expect(page.locator('.train-title h2')).toHaveText(train.name);
    await page.getByRole('button',{name:'Desmontado',exact:true}).click();
    for(const part of train.parts){
      await page.getByTestId(`part-${part.id}`).click();
      await expect(page.locator('.part-title')).toHaveText(part.name);
      await page.getByRole('button',{name:'Aislar pieza',exact:true}).click();
      await expect(page.getByRole('button',{name:'Aislar pieza',exact:true})).toHaveAttribute('aria-pressed','true');
      await expect(page.locator('.mechanism-preview svg[role="img"]')).toHaveAttribute('aria-label',`Esquema didáctico: ${part.name}`);
    }
    await page.getByRole('tab',{name:'Fuentes',exact:true}).click();await expect(page.locator('.drawing-note')).toBeVisible();
    await expect(page.locator('.fidelity-note')).toContainText(train.fidelity);
    await expect(page.locator('canvas')).toHaveCount(1);expect(errors).toEqual([]);
  });
}

test('la selección por raycast del modelo actualiza la ficha', async ({page}) => {
  await ready(page);await page.waitForTimeout(400);
  const canvas=page.locator('canvas'),rect=(await canvas.boundingBox())!;
  let hit=false;
  for(const [x,y] of [[.52,.53],[.5,.62],[.43,.58],[.6,.58],[.4,.65]]){
    await canvas.click({position:{x:rect.width*x,y:rect.height*y}});
    if(await page.locator('.part-title').count()){hit=true;break;}
  }
  expect(hit,'Se debe poder seleccionar geometría visible con el puntero').toBe(true);
});

test('el encuadre inicial y adaptable coincide con restaurar la cámara', async ({page}) => {
  // Capture the uniforms used by a draw to the main framebuffer. The last
  // uniform upload alone may belong to the shadow camera when Three.js reuses
  // unchanged uniforms for the visible camera.
  await page.addInitScript(()=>{
    (window as any).__cameraMatrices={};
    const names=new WeakMap<WebGLUniformLocation,{program:WebGLProgram,name:string}>();
    const matrices=new WeakMap<WebGLProgram,Record<string,number[]>>();
    let currentProgram:WebGLProgram|null=null,framebuffer:WebGLFramebuffer|null=null;
    const proto=WebGL2RenderingContext.prototype,locate=proto.getUniformLocation,upload=proto.uniformMatrix4fv;
    const use=proto.useProgram,bind=proto.bindFramebuffer;
    proto.useProgram=function(program){currentProgram=program;return use.call(this,program);};
    proto.bindFramebuffer=function(target,buffer){if(target===this.FRAMEBUFFER||target===this.DRAW_FRAMEBUFFER)framebuffer=buffer;return bind.call(this,target,buffer);};
    proto.getUniformLocation=function(program,name){const loc=locate.call(this,program,name);if(loc)names.set(loc,{program,name});return loc;};
    proto.uniformMatrix4fv=function(location,transpose,data,...rest){
      const info=location&&names.get(location);
      if(info&&(info.name==='viewMatrix'||info.name==='projectionMatrix')){
        const value=matrices.get(info.program)??{};value[info.name]=Array.from(data);matrices.set(info.program,value);
      }
      return upload.call(this,location,transpose,data,...rest);
    };
    for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){
      const original=(proto as any)[name];
      (proto as any)[name]=function(...args:any[]){
        const value=currentProgram&&matrices.get(currentProgram);
        if(!framebuffer&&value?.viewMatrix&&value.projectionMatrix)(window as any).__cameraMatrices={...value};
        return original.apply(this,args);
      };
    }
  });
  await page.goto('/?tren=bigboy');
  await expect(page.locator('canvas')).toHaveCount(1);
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(1000);
    const initial=await page.evaluate(()=>(window as any).__cameraMatrices);
    expect(initial.viewMatrix).toHaveLength(16);expect(initial.projectionMatrix).toHaveLength(16);
    expect(initial.projectionMatrix[11]).toBe(-1);expect(initial.projectionMatrix[15]).toBe(0);
    await page.getByRole('button',{name:'Restaurar cámara',exact:true}).click();
    await page.waitForTimeout(500);
    const restored=await page.evaluate(()=>(window as any).__cameraMatrices);
    for(const name of ['viewMatrix','projectionMatrix'])for(let i=0;i<16;i++)expect(restored[name][i]).toBeCloseTo(initial[name][i],4);
  }
});

test('el detalle es accesible por teclado y Escape devuelve el foco', async ({page}) => {
  await ready(page);await page.getByTestId('part-drive').click();
  const open=page.getByRole('button',{name:'Ampliar mecanismo: Cilindros y bielas'});await open.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('button',{name:'Cerrar ventana'})).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(()=>!!document.querySelector('[role=dialog]')?.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(open).toBeFocused();
});

test('contexto histórico, comparación y biblioteca conservan el tren activo', async ({page}) => {
  await ready(page);await page.getByTestId('train-garratt').click();
  await page.getByRole('tab',{name:'Contexto',exact:true}).click();await expect(page.locator('.inspector-body')).toContainText('segregación racial');
  await page.getByRole('button',{name:'Comparar',exact:true}).click();await expect(page.locator('.comparison-grid article')).toHaveCount(2);
  await page.getByRole('dialog').locator('select').selectOption('maglev');await expect(page.getByRole('dialog')).toContainText('SCMaglev L0');
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Biblioteca de fuentes'}).click();
  await expect(page.locator('.source-card')).toHaveCount(Object.keys(sources).length);
  const links=await page.locator('.source-card a').evaluateAll(nodes=>nodes.map(n=>(n as HTMLAnchorElement).href));
  expect(links.every(url=>url.startsWith('https://'))).toBe(true);
  await expect(page.getByRole('dialog')).toContainText('No se ha consultado el texto completo');
});

test('la URL recupera el tren y tolera identificadores desconocidos', async ({page})=>{
  await page.goto('/?tren=maglev');await expect(page.locator('.train-title h2')).toHaveText('SCMaglev L0');
  await page.goto('/?tren=desconocido');await expect(page.locator('.train-title h2')).toHaveText('Stephenson’s Rocket');
});

test('el recorrido avanza y puede detenerse', async ({page})=>{
  await ready(page);await page.clock.install();await page.getByRole('button',{name:'Recorrer la evolución'}).click();
  await page.clock.fastForward(12_100);await expect(page.locator('.train-title h2')).toHaveText('Garratt GL');
  await page.getByRole('button',{name:'Detener recorrido'}).click();await page.clock.fastForward(24_100);
  await expect(page.locator('.train-title h2')).toHaveText('Garratt GL');
});

test('movimiento reducido y pausa detienen el dibujo continuo', async ({page})=>{
  await page.addInitScript(()=>{
    (window as any).__draws=0;
    for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){
      const proto=WebGL2RenderingContext.prototype as any,original=proto[name];
      proto[name]=function(...args:any[]){(window as any).__draws++;return original.apply(this,args);};
    }
  });
  await ready(page);await expect(page.getByRole('button',{name:'Animar mecanismos',exact:true})).toBeVisible();
  await page.waitForTimeout(1200);const before=await page.evaluate(()=>(window as any).__draws);expect(before).toBeGreaterThan(0);
  await page.waitForTimeout(600);expect(await page.evaluate(()=>(window as any).__draws)).toBe(before);
  await page.getByRole('button',{name:'Animar mecanismos',exact:true}).click();await page.waitForTimeout(450);
  expect(await page.evaluate(()=>(window as any).__draws)).toBeGreaterThan(before);
  await page.getByRole('button',{name:'Pausar mecanismos',exact:true}).click();await page.waitForTimeout(900);
  const paused=await page.evaluate(()=>(window as any).__draws);await page.waitForTimeout(500);expect(await page.evaluate(()=>(window as any).__draws)).toBe(paused);
});

test('pérdida de contexto gráfico: recuperación sin perder las fichas', async ({page})=>{
  await ready(page);
  await page.evaluate(()=>{const canvas=document.querySelector('canvas')!;const gl=canvas.getContext('webgl2');gl?.getExtension('WEBGL_lose_context')?.loseContext();});
  await expect(page.getByRole('alert')).toContainText('Se perdió el contexto gráfico');
  await page.getByRole('tab',{name:'Contexto',exact:true}).click();await expect(page.getByText('Una necesidad antes que un icono')).toBeVisible();
  await page.getByRole('button',{name:'Volver a abrir el visor'}).click();await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('canvas')).toHaveCount(1);
});

test('cambiar de tren libera geometrías y búferes WebGL anteriores', async ({page})=>{
  await page.addInitScript(()=>{
    const buffers=new Set<WebGLBuffer>(),proto=WebGL2RenderingContext.prototype;
    const create=proto.createBuffer,remove=proto.deleteBuffer;
    (window as any).__liveBuffers=()=>buffers.size;
    proto.createBuffer=function(){const buffer=create.call(this);if(buffer)buffers.add(buffer);return buffer;};
    proto.deleteBuffer=function(buffer){if(buffer)buffers.delete(buffer);return remove.call(this,buffer);};
  });
  await ready(page);await page.waitForTimeout(600);
  const baselineBuffers=await page.evaluate(()=>(window as any).__liveBuffers());expect(baselineBuffers).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Configuración gráfica'}).click();
  const geometry=()=>page.locator('dl>div').filter({hasText:'Geometrías en memoria'}).locator('dd');
  await expect(geometry()).not.toHaveText('—');const baseline=Number(await geometry().textContent());await page.keyboard.press('Escape');
  for(let repeat=0;repeat<2;repeat++)for(const train of trains){await page.getByTestId(`train-${train.id}`).click();await page.waitForTimeout(50);}
  await page.getByTestId('train-rocket').click();await page.getByRole('button',{name:'Configuración gráfica'}).click();await expect(geometry()).not.toHaveText('—');
  const after=Number(await geometry().textContent());expect(after).toBeLessThanOrEqual(baseline+2);expect(after).toBeGreaterThan(0);
  await page.waitForTimeout(600);
  expect(await page.evaluate(()=>(window as any).__liveBuffers())).toBeLessThanOrEqual(baselineBuffers);
});

test('auditoría de accesibilidad automática de la vista y el detalle', async ({page})=>{
  await ready(page);
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);
  await page.getByTestId('part-power').click();await page.getByRole('button',{name:'Ampliar mecanismo: Caldera y hogar'}).click();
  const detail=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(detail.violations).toEqual([]);
});

test('pantalla móvil: sin desbordamiento y fichas operables', async ({page})=>{
  await page.setViewportSize({width:390,height:844});await ready(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByTestId('train-maglev').click();await expect(page.locator('.train-title h2')).toHaveText('SCMaglev L0');
  await page.getByTestId('part-power').click();await page.getByRole('button',{name:'Ampliar mecanismo: Imanes superconductores'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
