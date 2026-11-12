import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';

const KEY='cronica-dev-tour-desktop-v1';
const steps=[
 {selector:'.cronica-preview-pages',title:'Organizá las páginas',description:'Agregá, seleccioná o eliminá las páginas del carrusel. Cada página conserva su propio diseño y su propia foto.'},
 {selector:'.cronica-variant-panel',title:'Elegí el diseño de cada placa',description:'Seleccioná Sin diseño, Portada o Interior para definir el diseño de la placa.'},
 {selector:'.cronica-media-panel',title:'Agregá una fotografía',description:'Cargá una foto y ajustá el encuadre arrastrándola en la vista previa o utilizando el zoom.'},
 {selector:'.cronica-text-panel',title:'Editá los textos',description:'Escribí el titular, configurá la volanta, destacá fragmentos y elegí su alineación.'},
 {selector:'.cronica-variant-panel .modern-toggle',title:'Abrí o cerrá todos los módulos',description:'Mantené Shift y hacé clic en una cabecera para abrir o cerrar todos los módulos.',shift:true},
 {selector:'#cronicaLogoHit',title:'Configurá el logo y la firma',description:'Tocá el logo en la placa para ir a Diseño de placas, elegir su posición y definir la firma inferior.'},
 {selector:'#cronicaTextHit',title:'Editá el texto desde la vista previa',description:'Tocá el titular de la placa para abrir sus controles de texto.'},
 {selector:'body',title:'¿Poco espacio?',description:'Probá el zoom del navegador al 90 % u 80 % para aprovechar mejor el espacio de trabajo.',fullscreen:true},
] as const;

type Rectangle={left:number;top:number;right:number;bottom:number;width:number;height:number};
type Placement={hole:Rectangle;card:{left:number;top:number;width:number};viewport:{width:number;height:number}};

function readVisited():boolean {try{return localStorage.getItem(KEY)==='complete'}catch{return false}}
function remember():void {try{localStorage.setItem(KEY,'complete')}catch{/* Navegación privada: no bloquear */}}
function geometry(target:Element,card:HTMLElement,fullscreen:boolean):Placement {
 const width=window.innerWidth,height=window.innerHeight;
 const r=fullscreen?{left:0,top:0,right:width,bottom:height}:target.getBoundingClientRect();
 const left=fullscreen?0:Math.max(8,r.left-8),top=fullscreen?0:Math.max(8,r.top-8);
 const right=fullscreen?width:Math.min(width-8,r.right+8),bottom=fullscreen?height:Math.min(height-8,r.bottom+8);
 const hole={left,top,right,bottom,width:Math.max(16,right-left),height:Math.max(16,bottom-top)};
 const cw=Math.min(fullscreen?345:325,width-32),ch=card.offsetHeight||230,gap=18;
 let cx=right+gap+cw<=width-16?right+gap
   :left-gap-cw>=16?left-gap:Math.max(16,Math.min(width-cw-16,left+(hole.width-cw)/2));
 let cy=top+(hole.height-ch)/2;
 if(fullscreen){cx=(width-cw)/2;cy=(height-ch)/2}
 else if(cx!==right+gap&&cx!==left-gap-cw)cy=bottom+12+ch<=height-12?bottom+12:Math.max(12,top-ch-12);
 cx=Math.max(16,Math.min(width-cw-16,cx));
 cy=Math.max(12,Math.min(height-ch-12,cy));
 return {hole,card:{left:cx,top:cy,width:cw},viewport:{width,height}};
}

/** Tour autónomo: no escribe en el documento ni en Canvas, solo señala controles React. */
export function CronicaOnboarding() {
 const [active,setActive]=useState(false),[index,setIndex]=useState(0);
 const [placement,setPlacement]=useState<Placement|null>(null);
 const cardRef=useRef<HTMLElement>(null),lastFocus=useRef<HTMLElement|null>(null);
 const nextRef=useRef<HTMLButtonElement>(null);
 const mode=new URLSearchParams(window.location.search).get('onboarding');
 const disabled=mode==='off';
 const isDesktop=()=>window.matchMedia('(min-width:701px)').matches;
 const open=()=>{
  if(!isDesktop())return;
  lastFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setIndex(0);setActive(true);
 };
 const close=()=>{
  remember();setActive(false);setPlacement(null);
  lastFocus.current?.focus({preventScroll:true});
 };
 useEffect(()=>{
  if(disabled)return;
  if(!isDesktop())return;
  if(mode!=='force'&&readVisited())return;
  let cancelled=false;
  const show=()=>{if(!cancelled&&isDesktop())setActive(true)};
  const raf=requestAnimationFrame(()=>requestAnimationFrame(show));
  return ()=>{cancelled=true;cancelAnimationFrame(raf)};
 // Montar solo una vez; la query no cambia durante esta sesión.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{
  if(!active)return;
  document.body.classList.add('ds-tour-active');
  const onResize=()=>{if(!isDesktop())close()};
  const onEscape=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();close()}
   if(event.altKey&&event.key==='ArrowRight'){event.preventDefault();setIndex(n=>Math.min(n+1,steps.length-1))}
   if(event.altKey&&event.key==='ArrowLeft'){event.preventDefault();setIndex(n=>Math.max(n-1,0))}
   if(event.key==='Tab'&&cardRef.current){
    const buttons=[...cardRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    const pos=buttons.indexOf(document.activeElement as HTMLButtonElement);
    if(event.shiftKey&&pos<=0){event.preventDefault();buttons.at(-1)?.focus()}
    else if(!event.shiftKey&&pos===buttons.length-1){event.preventDefault();buttons[0]?.focus()}
   }
  };
  // Smoke y usuario pueden comenzar a editar sin quedar atrapados tras la guía.
  const onFile=(event:Event)=>{
   if((event.target as Element|null)?.closest?.('#file'))close();
  };
  document.addEventListener('keydown',onEscape);
  document.addEventListener('change',onFile,true);
  window.addEventListener('resize',onResize);
  return ()=>{
   document.body.classList.remove('ds-tour-active');
   document.removeEventListener('keydown',onEscape);
   document.removeEventListener('change',onFile,true);
   window.removeEventListener('resize',onResize);
  };
 // El cierre solo depende de active; los listeners no deben instalarse por cada paso.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[active]);
 useLayoutEffect(()=>{
  if(!active)return;
  const step=steps[index],target=document.querySelector<HTMLElement>(step.selector);
  const card=cardRef.current;
  if(!target||!card)return;
  const accordion=target.closest('.modern-card');
  const toggle=accordion?.querySelector<HTMLButtonElement>('.modern-toggle');
  if(toggle?.getAttribute('aria-expanded')==='false')toggle.click();
  if(!step.fullscreen)target.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
  const update=()=>setPlacement(geometry(target,card,'fullscreen' in step));
  update();
  const raf=requestAnimationFrame(()=>{update();nextRef.current?.focus({preventScroll:true})});
  window.addEventListener('resize',update);
  window.addEventListener('scroll',update,true);
  return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true)};
 },[active,index]);
 if(disabled)return null;
 const step=steps[index],last=index===steps.length-1;
 const hole=placement?.hole,viewport=placement?.viewport;
 const shades:ReadonlyArray<CSSProperties>=hole&&viewport?
 [
  {left:0,top:0,width:viewport.width,height:hole.top},
  {left:0,top:hole.top,width:hole.left,height:hole.height},
  {left:hole.right,top:hole.top,width:viewport.width-hole.right,height:hole.height},
  {left:0,top:hole.bottom,width:viewport.width,height:viewport.height-hole.bottom}
 ]:[{inset:0}];
 return createPortal(
  <>
   <button type="button" id="dsOnboardingTrigger" className="ds-onboarding-trigger"
    aria-label="Abrir onboarding interactivo" title="Abrir onboarding" onClick={open}>
    <svg className="ds-onboarding-flag-art" viewBox="0 0 136 42" aria-hidden="true"><path d="M0 3 Q0 0 4 0 H136 V42 H4 Q0 42 0 39 L0 29 L11 21 L0 13 Z" fill="#ed0000" stroke="white" strokeWidth="2"/></svg>
    <span className="material-icons" aria-hidden="true">help_outline</span><span>Ayuda</span>
   </button>
   {active&&<div id="dsOnboardingLayer" className={'ds-onboarding-layer'+(last?' is-whole-screen':'')}>
    {shades.map((style,i)=><div key={i} className="ds-tour-shade" style={style}/>)}
    {!last&&hole&&<div className="ds-tour-highlight" style={{left:hole.left,top:hole.top,width:hole.width,height:hole.height}} aria-hidden="true"/>}
    <section ref={cardRef} className="ds-tour-card" role="dialog" aria-modal="true"
      aria-labelledby="dsTourTitle" aria-describedby="dsTourDesc"
      style={placement?{left:placement.card.left,top:placement.card.top,width:placement.card.width}:{left:16,top:16,width:325}}>
     <div className="ds-tour-card-header">
      <span id="dsTourProgress" className="ds-tour-progress">{index+1} de {steps.length}</span>
      <button type="button" className="ds-tour-close" aria-label="Cerrar el recorrido" onClick={close}>×</button>
     </div>
     <h2 id="dsTourTitle">{step.title}</h2>
     <p id="dsTourDesc">{step.description}</p>
     {'shift' in step&&<div className="ds-tour-shift-demo" aria-label="Demostración de Shift más clic">
      <img src="../shared/shift-click-demo.svg" alt="Tecla Shift y clic para abrir o cerrar todos los módulos" width="600" height="250"/>
     </div>}
     {last&&<div className="cronica-tour-zoom" aria-label="Zoom sugerido del navegador">100 % → 90 % → 80 %</div>}
     <div className="ds-tour-dots" aria-hidden="true">{steps.map((_,i)=><span key={i} className={i===index?'is-current':''}/>)}</div>
     <div className="ds-tour-footer">
      <button className="ds-tour-skip" type="button" onClick={close}>Omitir</button>
      <div className="ds-tour-nav">
       <button className="ds-tour-back" type="button" disabled={index===0} onClick={()=>setIndex(n=>Math.max(0,n-1))}>Anterior</button>
       <button ref={nextRef} className="ds-tour-next" type="button" onClick={()=>last?close():setIndex(n=>n+1)}>{last?'Finalizar':'Siguiente'}</button>
      </div>
     </div>
    </section>
   </div>}
  </>,document.body);
}
