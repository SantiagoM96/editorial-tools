/* Onboarding contextual para BAE DEV — solo desktop.
   Es independiente de la lógica de edición y no se ejecuta en mobile. */
(()=>{
 'use strict';
 const mq=window.matchMedia('(min-width:701px)');
 // QA y vista convencional pueden desactivar el recorrido con ?onboarding=off.
 if(new URLSearchParams(location.search).get('onboarding')==='off')return;
 const storageKey='bae-dev-tour-desktop-v1';
 const qs=s=>document.querySelector(s);
 const steps=[
  {selector:"section.modern-design-group",title:"Elegí el diseño de tu placa",description:"Seleccioná el estilo visual que querés usar en esta placa.",group:'panel'},
  {selector:"section.modern-photo-group",title:"Agregá una fotografía",description:"Cargá una imagen y ajustá su encuadre arrastrándola en la vista previa o utilizando el zoom.",group:'panel'},
  {selector:"section.modern-import-group",title:"Importá una noticia",description:"Pegá el enlace de BAE Negocios para importar el titular y la fotografía de la noticia.",group:'panel'},
  {selector:"section.modern-text-card",title:"Editá los textos",description:"Escribí el titular, aplicá formato, elegí la alineación y activá el textual cuando lo necesites.",group:'panel'},
  {selector:"section.modern-card:has(.texture-field)",title:"Ajustá el diseño",description:"Cambiá la textura y su opacidad para terminar de personalizar la placa.",group:'panel'},
  {selector:"section.modern-design-group > .modern-toggle",title:'Abrí o cerrá todos los módulos',description:'Mantené presionada la tecla Shift y hacé clic en la cabecera de un módulo para expandirlos o contraerlos todos juntos.',showShiftDemo:true,focusHeader:true,group:'shortcuts'},
  {selector:'.modern-logo-hit',title:'Configurá el logo y la firma',description:'Tocá el logo en la vista previa para abrir Diseño de placas y ajustar el logo, su ubicación y la firma inferior.',logoControls:true,group:'preview'},
  {selector:'.modern-text-hit',title:'Editá el texto desde la vista previa',description:'Tocá el titular en la vista previa para abrir sus controles de texto.',group:'preview'},
  {selector:"body",title:"¿Poco espacio?",description:"Probá el zoom del navegador al 90% u 80% para aprovechar mejor el espacio de trabajo.",fullScreen:true,showZoomDemo:true}
 ];
 // La navegación multipágina es ahora el primer paso del recorrido.
 steps.unshift({selector:'.editor-slide-nav',title:'Organizá las diapositivas',description:'Agregá, seleccioná y eliminá diapositivas. Arrastrá la fila para desplazarte. Cada placa conserva su propio diseño y puede estar Sin diseño.',group:'slides'});
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
  layer.innerHTML='<div class="ds-tour-shade" data-side="top"></div><div class="ds-tour-shade" data-side="left"></div><div class="ds-tour-shade" data-side="right"></div><div class="ds-tour-shade" data-side="bottom"></div><div class="ds-tour-highlight" aria-hidden="true"></div><section class="ds-tour-card" role="dialog" aria-modal="true" aria-labelledby="dsTourTitle" aria-describedby="dsTourDesc"><div class="ds-tour-card-header"><span id="dsTourProgress" class="ds-tour-progress"></span><button type="button" class="ds-tour-close" aria-label="Cerrar el recorrido">×</button></div><h2 id="dsTourTitle"></h2><p id="dsTourDesc"></p><div id="dsTourZoomDemo" class="ds-tour-zoom-demo preview" hidden aria-label="Demostración animada del zoom del navegador"></div><div id="dsTourShiftDemo" class="ds-tour-shift-demo" hidden aria-label="Demostración de Shift más clic"><img src="../shared/shift-click-demo.svg?v=shift-hand-mouse-v42-20261112" alt="Tecla Shift presionada y mouse haciendo clic para abrir o cerrar todos los módulos" width="600" height="250"></div><div class="ds-tour-dots" aria-hidden="true"></div><div class="ds-tour-footer"><button type="button" class="ds-tour-skip">Omitir</button><div class="ds-tour-nav"><button type="button" class="ds-tour-back">Anterior</button><button type="button" class="ds-tour-next">Siguiente</button></div></div></section>';
  // Máscara SVG perforada: un hueco para el logo de preview y dos
  // únicamente para sus controles en Diseño de placas.
  const multi=document.createElementNS('http://www.w3.org/2000/svg','svg');
  multi.classList.add('ds-tour-multispot');
  multi.setAttribute('aria-hidden','true');
  const multiPath=document.createElementNS('http://www.w3.org/2000/svg','path');
  multiPath.setAttribute('fill-rule','evenodd');multi.appendChild(multiPath);
  layer.prepend(multi);
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
  // Todas las aberturas de la máscara tienen esquinas de exactamente 8px.
  const roundedHole=(l,t,r,b)=>{
   const rad=Math.min(8,(r-l)/2,(b-t)/2);
   return 'M'+(l+rad)+' '+t+' H'+(r-rad)+
    ' Q'+r+' '+t+' '+r+' '+(t+rad)+
    ' V'+(b-rad)+' Q'+r+' '+b+' '+(r-rad)+' '+b+
    ' H'+(l+rad)+' Q'+l+' '+b+' '+l+' '+(b-rad)+
    ' V'+(t+rad)+' Q'+l+' '+t+' '+(l+rad)+' '+t+' Z';
  };
  const outer='M0 0 H'+vw+' V'+vh+' H0 Z';
  const multi=layer.querySelector('.ds-tour-multispot');
  multi.setAttribute('viewBox','0 0 '+vw+' '+vh);
  if(!steps[index].logoControls&&!last){
   multi.firstChild.setAttribute('d',outer+' '+roundedHole(x,y,right,bottom));
  }
  if(steps[index].logoControls){
   const design=qs('section.modern-design-group');
   const controlSelectors=['.editor-logo-layout-row','.modern-footer-field'];
   const holes=[target,...controlSelectors.map(sel=>design?.querySelector(sel)).filter(Boolean)];
   const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
   const d=[outer];
   for(const node of holes){
    const box=node.getBoundingClientRect();
    const margin=node===target?8:5;
    const l=clamp(box.left-margin,0,vw),t=clamp(box.top-margin,0,vh);
    const r=clamp(box.right+margin,0,vw),b=clamp(box.bottom+margin,0,vh);
    if(r-l<8||b-t<8)continue;
    d.push(roundedHole(l,t,r,b));
   }
   multi.firstChild.setAttribute('d',d.join(' '));
  }
  rectStyle(shadows[0],0,0,vw,y);
  rectStyle(shadows[1],0,y,x,h);
  rectStyle(shadows[2],right,y,vw-right,h);
  rectStyle(shadows[3],0,bottom,vw,vh-bottom);
  // Desktop: posicionar la tarjeta a un lado; si no entra, debajo o arriba.
  const cw=Math.min(last?345:325,vw-32),ch=card.offsetHeight||230;
  // El paso del titular aumenta exclusivamente un 30% la separación.
  const tipGap=steps[index].selector==='.modern-text-hit'?23.4:18;
  const fitsRight=right+tipGap+cw<=vw-16;
  const fitsLeft=x-tipGap-cw>=16;
  let cx,cy;
  if(last){cx=(vw-cw)/2;cy=(vh-ch)/2}
  else if(fitsRight){cx=right+tipGap;cy=y+(h-ch)/2}
  else if(fitsLeft){cx=x-tipGap-cw;cy=y+(h-ch)/2}
  else{
   cx=Math.max(16,Math.min(vw-cw-16,x+(w-cw)/2));
   const fallbackGap=steps[index].selector==='.modern-text-hit'?15.6:12;
   cy=bottom+fallbackGap+ch<=vh-12?bottom+fallbackGap:Math.max(12,y-ch-fallbackGap);
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
  layer.querySelector('#dsTourProgress').textContent=(index+1)+' de '+steps.length;
  layer.querySelector('#dsTourTitle').textContent=step.title;
  layer.querySelector('#dsTourDesc').textContent=step.description;
  layer.querySelector('#dsTourShiftDemo').hidden=!step.showShiftDemo;
  const demoSlot=layer.querySelector('#dsTourZoomDemo');
  demoSlot.hidden=!step.showZoomDemo;
  if(step.showZoomDemo&&!demoSlot.firstChild){
   const existing=qs('#browserZoomTip .browser-zoom-demo');
   if(existing)demoSlot.appendChild(existing.cloneNode(true));
  }
  layer.classList.toggle('is-logo-spotlight',Boolean(step.logoControls));
  layer.classList.toggle('is-rounded-spotlight',!step.logoControls&&!step.fullScreen);
  layer.dataset.tourGroup=step.group||'panel';
  if(step.logoControls){
   const design=qs('section.modern-design-group');
   if(design)toggleCardOpen(design);
  }
  layer.classList.toggle('is-whole-screen',Boolean(step.fullScreen));
  document.body.classList.toggle('ds-tour-preview-step',step.selector==='.modern-logo-hit'||step.selector==='.modern-text-hit'||step.selector==='#dsLogoHitButton'||step.selector==='#dsHeadlineHitButton');
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
 // El inicio automático interfiere con la verificación de publicación de Pages;
 // el recorrido completo sigue disponible desde Ayuda y con ?onboarding=force.
 if(mq.matches&&new URLSearchParams(location.search).get('onboarding')==='force'){
  // Después de que el editor termine su primera renderización.
  window.addEventListener('load',()=>requestAnimationFrame(()=>requestAnimationFrame(start)),{once:true});
 }
 window.BAEOnboarding={open:start,close:finish};
})();
