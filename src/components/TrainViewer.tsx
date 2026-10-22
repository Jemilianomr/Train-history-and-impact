import { useEffect, useRef, useState } from 'react';
import { Box, LoaderCircle, RotateCcw, ZoomIn, ZoomOut, ScanLine, AlertCircle } from 'lucide-react';
import type { SceneState, SceneStats, TrainScene } from '../scene/engine';
import type { PartId } from '../types';

export default function TrainViewer({state,onSelect,onStats}:{state:SceneState;onSelect:(p:PartId)=>void;onStats:(s:SceneStats)=>void}){
  const host=useRef<HTMLDivElement>(null),engine=useRef<TrainScene|null>(null),latest=useRef({state,onSelect,onStats});
  latest.current={state,onSelect,onStats};
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[generation,setGeneration]=useState(0);
  useEffect(()=>{
    let cancelled=false;setLoading(true);setError('');
    import('../scene/engine').then(({TrainScene})=>{
      if(cancelled||!host.current)return;
      try{engine.current=new TrainScene(host.current,latest.current.state,p=>latest.current.onSelect(p),s=>latest.current.onStats(s),setError);setLoading(false);}
      catch(e){setError(e instanceof Error?e.message:'No se pudo iniciar WebGL 2.');setLoading(false);}
    }).catch(()=>{if(!cancelled){setError('No se pudo cargar el visor. Comprueba la conexión con la aplicación y vuelve a intentarlo.');setLoading(false);}});
    return()=>{cancelled=true;engine.current?.dispose();engine.current=null;};
  },[generation]);
  useEffect(()=>{engine.current?.update(state);},[state]);
  return <div className="viewer" data-testid="viewer">
    <div className="viewer-grid"/>
    <div ref={host} className="canvas-host" data-testid="canvas-host"/>
    <div className="viewer-heading"><span><span className="live-dot"/> MODELO DIDÁCTICO</span><span><Box size={13}/> EXPLORACIÓN 3D</span></div>
    <div className="scene-caption"><span className="scene-number">{String(['rocket','garratt','bigboy','deltic','shinkansen','tgv','velaro','maglev'].indexOf(state.train.id)+1).padStart(2,'0')}</span><div><strong>{state.train.maker}</strong><span>{state.train.country} · {state.train.year}</span></div></div>
    {!error&&<div className="camera-tools" aria-label="Controles de cámara">
      <button title="Acercar" aria-label="Acercar" onClick={()=>engine.current?.zoom(.8)}><ZoomIn size={17}/></button>
      <button title="Alejar" aria-label="Alejar" onClick={()=>engine.current?.zoom(1.25)}><ZoomOut size={17}/></button>
      <button title="Vista lateral" aria-label="Vista lateral" onClick={()=>engine.current?.setSide()}><ScanLine size={17}/></button>
      <button title="Restaurar cámara" aria-label="Restaurar cámara" onClick={()=>engine.current?.resetCamera()}><RotateCcw size={16}/></button>
    </div>}
    <div className="viewer-hint">Arrastra para girar <span>·</span> Acerca con la rueda <span>·</span> Selecciona una pieza</div>
    {loading&&<div className="viewer-message"><LoaderCircle className="spin" size={28}/><p>Preparando el diorama…</p></div>}
    {error&&<div className="viewer-message error-message" role="alert"><AlertCircle size={26}/><h3>El visor necesita WebGL 2</h3><p>{error}</p><p>La colección, los mecanismos y las referencias siguen disponibles.</p><button className="primary-button" onClick={()=>setGeneration(n=>n+1)}>Volver a abrir el visor</button></div>}
  </div>;
}
