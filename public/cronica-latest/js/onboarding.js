/* Onboarding contextual para Crónica DEV — solo desktop.
   Es independiente de la lógica de edición y no se ejecuta en mobile. */
(()=>{
 'use strict';
 const mq=window.matchMedia('(min-width:701px)');
 // QA y vista convencional pueden desactivar el recorrido con ?onboarding=off.
 if(new URLSearchParams(location.search).get('onboarding')==='off')return;
 const storageKey='cronica-dev-tour-desktop-v1';
 const qs=s=>document.querySelector(s);
 const steps=[
  {selector:"section.carousel-panel",title:"Organizá las páginas",description:"Agregá, seleccioná o eliminá las páginas del carrusel. La portada y las internas se editan de manera independiente."},
  {selector:"section.cronica-variant-panel",title:"Elegí el diseño de cada placa",description:"Elegí Portada o Interior para la página seleccionada del carrusel."},
  {selector:"section.modern-photo-group",title:"Agregá una fotografía",description:"Cargá una imagen y ajustá su encuadre arrastrándola en la vista previa o utilizando el zoom."},
  {selector:"section.modern-design-group",title:"Configurá el logo y la firma",description:"Seleccioná el logo de Crónica y elegí la firma inferior. La portada mantiene su firma de carrusel por defecto."},
  {selector:"section.modern-text-card",title:"Editá los textos",description:"Escribí el titular, configurá la volanta, destacá fragmentos y elegí su alineación."},
  {selector:"#photoStage",title:"Editá desde la vista previa",description:"Tocá el logo para abrir Diseño de placas o el titular para abrir Textos. El módulo correspondiente se destaca."},
  {selector:"body",title:"¿Poco espacio?",description:"Probá el zoom del navegador al 90% u 80% para aprovechar mejor el espacio de trabajo.",fullScreen:true,showZoomDemo:true}
 ];
 let index=-1,active=false,layer=null,card=null,highlight=null;
 let shadows=[],lastFocus=null,scheduled=0;
 function completed(){try{return localStorage.getItem(storageKey)==='complete'}catch(e){return false}}
 function remember(){try{localStorage.setItem(storageKey,'complete')}catch(e){}}
 function toggleCardOpen(element){
  const accordion=element.closest('.modern-card');
  if(!accordion)return;
  const button=accordion.querySelector('.modern-toggle');
  if(button&&button.getAttribute('aria-expanded')!=='true')button.click();
 }
 function setup(){
  if(layer)return;
  layer=document.createElement('div');
  layer.id='dsOnboardingLayer';
  layer.className='ds-onboarding-layer';
  layer.hidden=true;
  layer.innerHTML='<div class="ds-tour-shade" data-side="top"></div><div class="ds-tour-shade" data-side="left"></div><div class="ds-tour-shade" data-side="right"></div><div class="ds-tour-shade" data-side="bottom"></div><div class="ds-tour-highlight" aria-hidden="true"></div><section class="ds-tour-card" role="dialog" aria-modal="true" aria-labelledby="dsTourTitle" aria-describedby="dsTourDesc"><div class="ds-tour-card-header"><span id="dsTourProgress" class="ds-tour-progress"></span><button type="button" class="ds-tour-close" aria-label="Cerrar el recorrido">×</button></div><h2 id="dsTourTitle"></h2><p id="dsTourDesc"></p><div id="dsTourZoomDemo" class="ds-tour-zoom-demo preview" hidden aria-label="Demostración animada del zoom del navegador"></div><div class="ds-tour-dots" aria-hidden="true"></div><div class="ds-tour-footer"><button type="button" class="ds-tour-skip">Omitir</button><div class="ds-tour-nav"><button type="button" class="ds-tour-back">Anterior</button><button type="button" class="ds-tour-next">Siguiente</button></div></div></section>';
  document.body.appendChild(layer);
  shadows=[...layer.querySelectorAll('.ds-tour-shade')];
  highlight=layer.querySelector('.ds-tour-highlight');
  card=layer.querySelector('.ds-tour-card');
  layer.querySelector('.ds-tour-close').addEventListener('click',finish);
  layer.querySelector('.ds-tour-skip').addEventListener('click',finish);
  layer.querySelector('.ds-tour-back').addEventListener('click',()=>show(index-1));
  layer.querySelector('.ds-tour-next').addEventListener('click',()=>index===steps.length-1?finish():show(index+1));
  shadows.forEach(node=>node.addEventListener('click',event=>event.preventDefault()));
 }
 function rectStyle(node,left,top,width,height){
  Object.assign(node.style,{left:left+'px',top:top+'px',width:Math.max(0,width)+'px',height:Math.max(0,height)+'px'});
 }
 function position(){
  scheduled=0;
  if(!active||!mq.matches)return;
  const target=qs(steps[index].selector);
  if(!target)return;
  const last=Boolean(steps[index].fullScreen);
  const vw=window.innerWidth,vh=window.innerHeight;
  const rect=last?{left:0,top:0,right:vw,bottom:vh}:target.getBoundingClientRect();
  const x=last?0:Math.max(8,rect.left-8),y=last?0:Math.max(8,rect.top-8);
  const right=last?vw:Math.min(vw-8,rect.right+8),bottom=last?vh:Math.min(vh-8,rect.bottom+8);
  const w=Math.max(16,right-x),h=Math.max(16,bottom-y);
  rectStyle(highlight,x,y,w,h);
  rectStyle(shadows[0],0,0,vw,y);
  rectStyle(shadows[1],0,y,x,h);
  rectStyle(shadows[2],right,y,vw-right,h);
  rectStyle(shadows[3],0,bottom,vw,vh-bottom);
  // Desktop: posicionar la tarjeta a un lado; si no entra, debajo o arriba.
  const cw=Math.min(last?345:325,vw-32),ch=card.offsetHeight||230;
  const fitsRight=right+18+cw<=vw-16;
  const fitsLeft=x-18-cw>=16;
  let cx,cy;
  if(last){cx=(vw-cw)/2;cy=(vh-ch)/2}
  else if(fitsRight){cx=right+18;cy=y+(h-ch)/2}
  else if(fitsLeft){cx=x-18-cw;cy=y+(h-ch)/2}
  else{
   cx=Math.max(16,Math.min(vw-cw-16,x+(w-cw)/2));
   cy=bottom+12+ch<=vh-12?bottom+12:Math.max(12,y-ch-12);
  }
  cx=Math.max(16,Math.min(vw-cw-16,cx));
  cy=Math.max(12,Math.min(vh-ch-12,cy));
  card.style.width=cw+'px';
  card.style.left=cx+'px';card.style.top=cy+'px';
 }
 function schedule(){if(active&&!scheduled)scheduled=requestAnimationFrame(position)}
 function show(next){
  if(!active||next<0||next>=steps.length)return;
  index=next;
  const step=steps[index];
  const target=qs(step.selector);
  if(!target)return;
  toggleCardOpen(target);
  // Cada avance del recorrido dispara el pulso aunque la tarjeta ya esté
  // expandida. No se fuerza un clic artificial sobre el acordeón abierto.
  const accordion=target.closest('.modern-card');
  const pulseTarget=accordion||(target.classList.contains('cronica-preview-pages')?target:null);
  if(!step.fullScreen&&pulseTarget)window.CronicaPulseCard?.(pulseTarget);
  layer.querySelector('#dsTourProgress').textContent=(index+1)+' de '+steps.length;
  layer.querySelector('#dsTourTitle').textContent=step.title;
  layer.querySelector('#dsTourDesc').textContent=step.description;
  const demoSlot=layer.querySelector('#dsTourZoomDemo');
  demoSlot.hidden=!step.showZoomDemo;
  if(step.showZoomDemo&&!demoSlot.firstChild){
   const existing=qs('#browserZoomTip .browser-zoom-demo');
   if(existing)demoSlot.appendChild(existing.cloneNode(true));
  }
  layer.classList.toggle('is-whole-screen',Boolean(step.fullScreen));
  document.body.classList.toggle('ds-tour-preview-step',step.selector==='#photoStage');
  layer.querySelector('.ds-tour-back').disabled=index===0;
  layer.querySelector('.ds-tour-next').textContent=index===steps.length-1?'Finalizar':'Siguiente';
  layer.querySelector('.ds-tour-dots').innerHTML=steps.map((_,i)=>'<span class="'+(i===index?'is-current':'')+'"></span>').join('');
  if(!step.fullScreen)target.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
  position();
  requestAnimationFrame(()=>{position();card.querySelector('.ds-tour-next').focus({preventScroll:true})});
 }
 function start(){
  if(!mq.matches||active)return;
  setup();
  lastFocus=document.activeElement;
  active=true;layer.hidden=false;document.body.classList.add('ds-tour-active');
  show(0);
 }
 function finish(){
  if(!active)return;
  active=false;remember();
  layer.hidden=true;
  document.body.classList.remove('ds-tour-active');
  document.body.classList.remove('ds-tour-preview-step');
  if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus({preventScroll:true});
 }
 function onKey(event){
  if(!active)return;
  if(event.key==='Escape'){event.preventDefault();finish()}
  if(event.key==='ArrowRight'&&event.altKey){event.preventDefault();if(index<steps.length-1)show(index+1)}
  if(event.key==='ArrowLeft'&&event.altKey){event.preventDefault();if(index>0)show(index-1)}
  if(event.key==='Tab'){
   const items=[...card.querySelectorAll('button:not([disabled])')];
   if(!items.length)return;
   const i=items.indexOf(document.activeElement);
   if(event.shiftKey&&i<=0){event.preventDefault();items[items.length-1].focus()}
   else if(!event.shiftKey&&i===items.length-1){event.preventDefault();items[0].focus()}
  }
 }
 document.addEventListener('keydown',onKey);
 window.addEventListener('resize',()=>{
  if(active&&!mq.matches)finish();
  else schedule();
 });
 window.addEventListener('scroll',schedule,{passive:true});
 const trigger=qs('#dsOnboardingTrigger');
 if(trigger)trigger.addEventListener('click',start);
 if(mq.matches&&(!completed() || new URLSearchParams(location.search).get('onboarding')==='force')){
  // Después de que el editor termine su primera renderización.
  window.addEventListener('load',()=>requestAnimationFrame(()=>requestAnimationFrame(start)),{once:true});
 }
 window.CronicaOnboarding={open:start,close:finish};
})();
