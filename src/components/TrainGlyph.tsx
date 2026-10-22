import type { Train } from '../types';
export default function TrainGlyph({train}:{train:Train}){
  const steam=train.technology==='Vapor',rocket=train.id==='rocket',garratt=train.id==='garratt',deltic=train.id==='deltic',maglev=train.id==='maglev';
  return <svg viewBox="0 0 180 68" aria-hidden="true" className="train-glyph">
    <path d="M7 57H173" stroke="#879282" strokeWidth="1.5"/>
    {steam?<>
      <rect x={rocket?39:25} y={rocket?24:18} width={rocket?63:97} height={rocket?23:25} rx="8" fill={train.accent}/>
      <rect x={rocket?46:34} y={rocket?3:8} width={rocket?7:9} height={rocket?28:15} rx="2" fill="#435047"/>
      <path d={rocket?'M45 4h9':'M32 8h14'} stroke="#b69a5a" strokeWidth="3"/>
      <path d="M47 22v19M66 20v22M85 19v23" stroke="#b69a5a" strokeWidth="2"/>
      {!rocket&&<><rect x="105" y="14" width="24" height="32" rx="2" fill={train.accent}/><rect x="110" y="18" width="13" height="12" fill="#263b38"/></>}
      <rect x={rocket?121:133} y="28" width="35" height="21" rx="2" fill={train.accent}/>
      {garratt&&<rect x="13" y="29" width="31" height="17" rx="2" fill={train.accent}/>}
      <path d="M20 47H169" stroke="#485448" strokeWidth="5"/>
      {(rocket?[48,98,129,150]:[28,43,58,73,89,104,141,155]).map((x,i)=><g key={x}><circle cx={x} cy="49" r={rocket&&i===0?11:6.5} fill="#3a4942"/><circle cx={x} cy="49" r="2" fill="#bda87a"/>{rocket&&i===0&&<path d="M39 49h18M48 40v18M42 43l12 12M42 55l12-12" stroke="#a4a88f"/>}</g>)}
      <path d={rocket?'M48 49l33-20':'M29 50h75'} stroke="#b9b49a" strokeWidth="2"/>
    </>:<>
      <path d={deltic?'M12 44l8-20q4-9 16-9h112q12 0 17 11l4 18z':maglev?'M8 46q37-4 49-22q5-8 15-8h94v31z':train.id==='shinkansen'?'M9 43q6-17 24-19l8-10h125v33H17q-8 0-8-4z':'M9 45l22-23q8-9 22-9h113v34H9z'} fill={train.id==='tgv'?train.accent:deltic?train.accent:'#dce1d4'} stroke="#98a394" strokeWidth=".7"/>
      <path d="M32 37h132" stroke={deltic?'#ddcb9c':train.accent} strokeWidth={train.id==='shinkansen'?7:4}/>
      {[54,69,84,99,114,129,144].map(x=><rect key={x} x={x} y="22" width="9" height="7" rx="1" fill="#41616a"/>)}
      <path d="M30 29l8-9h10v9z" fill="#41616a"/>
      {!deltic&&!maglev&&<path d="M109 13l-8-5 9-5h14" stroke="#526053" fill="none" strokeWidth="1.5"/>}
      {!maglev&&[36,48,137,149].map(x=><circle key={x} cx={x} cy="49" r="5" fill="#405047"/>)}
      {maglev&&<path d="M10 51h157" stroke="#9aab9b" strokeWidth="5"/>}
    </>}
  </svg>;
}
