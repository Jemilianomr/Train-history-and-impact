import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean}){
  const ref=useRef<HTMLDivElement>(null),close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';ref.current?.querySelector<HTMLElement>('button')?.focus();
    const handle=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){e.preventDefault();close.current();}
      if(e.key==='Tab'){
        const items=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],select,input,[tabindex="0"]')??[]).filter(el=>el.offsetParent!==null);
        const first=items[0],last=items[items.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };document.addEventListener('keydown',handle);
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',handle);previous?.focus();};
  },[]);
  return <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className={`modal ${wide?'wide':''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref}><header className="modal-header"><div><span className="eyebrow">ATLAS FERROVIARIO</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="Cerrar ventana" onClick={onClose}><X size={22}/></button></header><div className="modal-content">{children}</div></div></div>;
}
