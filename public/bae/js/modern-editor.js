/* Diario Show editor shell adapted for Crónica and BAE DEV.
   Preserves each product's native rendering, importing and export. */
(function(){
'use strict';
const main=document.querySelector('main');
const panel=main?.querySelector(':scope > .editor-panel');
const preview=main?.querySelector(':scope > .preview');
const canvas=document.getElementById('art');
if(!main||!panel||!preview||!canvas)return;
const $=id=>document.getElementById(id);
const brand=location.pathname.includes('cronica')?'cronica':'bae';
document.body.dataset.editorBrand=brand;
const isCronica=brand==='cronica';
const narrow=window.matchMedia('(max-width:700px)');

function makeCard(section,title,isText=false){
 section.classList.add('modern-card');
 if(isText)section.classList.add('modern-text-card');
 const body=document.createElement('div');
 body.className='modern-body';
 body.id='modern-body-'+Math.random().toString(36).slice(2,9);
 while(section.firstChild)body.appendChild(section.firstChild);
 const toggle=document.createElement('button');
 toggle.type='button';toggle.className='modern-toggle';
 toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-controls',body.id);
 const label=document.createElement('span');label.textContent=title;
 const chev=document.createElement('span');
 chev.className='material-icons modern-chevron';chev.setAttribute('aria-hidden','true');
 chev.textContent='expand_less';
 const icon=document.createElement('span');
 icon.className='material-symbols-outlined modern-section-icon';
 icon.setAttribute('aria-hidden','true');
 icon.textContent=({
  'Páginas':'view_carousel','Diseño de placas':'palette',
  'Importar noticia':'link','Identidad gráfica':'shapes',
  'Fotografía':'photo_library','Textos':'text_fields','Diseño':'tune'
 })[title]||'settings';
 toggle.append(icon,label,chev);
 section.append(toggle,body);
 toggle.addEventListener('click',event=>{
  const expanded=toggle.getAttribute('aria-expanded')!=='true';
  if(event.shiftKey){
   // Solo tarjetas de Formato visibles en la variante actual.
   // Shift + clic sobre abierto cierra todas; sobre cerrado abre todas.
   for(const card of panel.querySelectorAll(':scope > .modern-card')){
    if(card.hidden||getComputedStyle(card).display==='none')continue;
    const button=card.querySelector(':scope > .modern-toggle');
    const content=card.querySelector(':scope > .modern-body');
    if(!button||!content)continue;
    button.setAttribute('aria-expanded',String(expanded));
    content.hidden=!expanded;
   }
  }else{
   toggle.setAttribute('aria-expanded',String(expanded));
   body.hidden=!expanded;
  }
  // Shift + clic con mouse no debe añadir un marco de foco sobre
  // la cabecera. El pulso pertenece al borde exterior de la tarjeta.
  // Con teclado (detail === 0) se conserva el foco accesible.
  if(event.shiftKey&&event.detail>0)toggle.blur();
  // Pulso en el borde exterior, sin cambiar su geometría.
  section.classList.remove('modern-card-flash');
  void section.offsetWidth;
  section.classList.add('modern-card-flash');
  requestAnimationFrame(updateHeight);
 });
 return section;
}
// Preserve original nodes and handlers by moving only, never recreating controls.
const sections=[...panel.querySelectorAll(':scope > section.panel-group')];
let textPanel;
if(isCronica){
 const content=sections.find(s=>s.querySelector('#headline'));
 textPanel=document.createElement('section');textPanel.className='panel-group';
 textPanel.setAttribute('aria-label','Textos');
 for(const sel of ['.typography-row','#headline','#size']){
  const node=content.querySelector(sel);
  const field=sel==='.typography-row'?node:node?.closest('.control-field');
  if(field)textPanel.appendChild(field);
 }
 content.after(textPanel);
}else{
 textPanel=sections.find(s=>s.querySelector('#headline'));
 const size=textPanel?.querySelector('#size')?.closest('.control-field');
 const headline=textPanel?.querySelector('#headline')?.closest('.control-field');
 if(size&&headline)headline.after(size);
}

// Controles originales: solo mover nodos, sin reconstruir sus listeners.
const originalContent=sections.find(s=>s.querySelector('.logo-choices'));
if(originalContent){
 originalContent.classList.add('modern-identity-group');
 // Firma inferior: dos presentaciones, sin alterar su diseño inicial.
 const footerField=document.createElement('div');
 footerField.className='control-field modern-footer-field';
 footerField.innerHTML='<label>Firma inferior</label><div class="modern-footer-options" role="group" aria-label="Firma inferior"><button type="button" data-footer-style="center" aria-pressed="'+String(!isCronica)+'">Centrada</button><button type="button" data-footer-style="carousel" aria-pressed="'+String(isCronica)+'">Carrusel</button></div>';
 originalContent.append(footerField);
 footerField.addEventListener('click',event=>{
  const button=event.target.closest('[data-footer-style]');
  if(!button)return;
  document.dispatchEvent(new CustomEvent('editorial:footer-style',{detail:{style:button.dataset.footerStyle}}));
  document.querySelectorAll('[data-footer-style]').forEach(b=>{
   b.setAttribute('aria-pressed',String(b.dataset.footerStyle===button.dataset.footerStyle));
  });
 });
 const photoField=$('file')?.closest('.control-field');
 if(photoField){
  const photoSection=document.createElement('section');
  photoSection.className='panel-group modern-photo-group';
  photoSection.append(photoField);
  originalContent.before(photoSection);
 }
 if(isCronica){
  // Después de Formato y Alineación: switch, texto de volanta y titular.
  const formatRow=textPanel.querySelector('.typography-row');
  let after=formatRow;
  for(const sel of ['#showStrap','#strapText','#headline']){
   const field=$(sel)?.closest('.control-field');
   if(field){after.after(field);after=field}
  }
 }else{
  const urlField=$('articleUrl')?.closest('.control-field');
  if(urlField){
   const importSection=document.createElement('section');
   importSection.className='panel-group modern-import-group';
   importSection.append(urlField);
   originalContent.before(importSection);
  }
 }
 // La selección de diseño, el logo y la firma viven en una misma tarjeta.
 // Se reubican nodos originales: conserva todos los listeners y el Canvas.
 const designSection=sections.find(node=>node.classList.contains('cronica-variant-panel')||node.querySelector('.theme-swatches'));
 if(designSection){
  designSection.classList.add('modern-design-group');
  const fields=[...originalContent.querySelectorAll(':scope > .control-field')];
  for(const field of fields)designSection.append(field);
  originalContent.remove();
 }
}
for(const section of [...panel.querySelectorAll(':scope > section.panel-group')]){
 // Nunca mostrar un acordeón sin controles aplicables a este producto.
 if(!section.querySelector('input,textarea,select,button:not(.modern-toggle),.logo-choices,.carousel-pages,.texture-options,.cronica-variant-options,.theme-swatches')){
  section.remove();continue;
 }
 let title=section.querySelector(':scope > h2')?.textContent?.trim()||
  (section===textPanel?'Textos':section.classList.contains('carousel-panel')?'Páginas':'Diseño de la placa');
 if(section.classList.contains('cronica-variant-panel')||section.querySelector('.theme-swatches'))title='Diseño de placas';
 if(section.classList.contains('modern-identity-group'))title='Identidad gráfica';
 if(section.classList.contains('modern-photo-group'))title='Fotografía';
 if(section.classList.contains('modern-import-group'))title='Importar noticia';
 if(section===textPanel)title='Textos';
 makeCard(section,title,section===textPanel);
}
if(!textPanel)return;
// Photo input card: native file input and its existing image loader remain intact.
const photoFile=$('file');
if(photoFile&&!photoFile.closest('.modern-photo-picker')){
 const photoField=photoFile.closest('.control-field');
 const photoPicker=document.createElement('div');photoPicker.className='modern-photo-picker';
 const photoSurface=document.createElement('div');
 photoSurface.className='modern-photo-surface';
 const photoLink=document.createElement('label');
 photoLink.className='modern-photo-clickable';photoLink.setAttribute('for','file');
 photoLink.innerHTML='<span class="material-symbols-outlined modern-photo-icon" aria-hidden="true">add_photo_alternate</span><span class="modern-photo-text"><strong class="modern-photo-action">Seleccioná</strong> <span class="modern-photo-caption">una fotografía</span></span>';
 photoSurface.append(photoLink);
 // La ayuda mantiene su botón original, pero queda dentro de la misma caja
 // que el selector, igual que Diario Show.
 const help=photoField.querySelector('.help-trigger');
 if(help){
  help.classList.add('modern-photo-help');
  photoSurface.append(help);
 }
 const heading=photoField.querySelector(':scope > label,:scope > .help-label-row');
 if(heading)heading.hidden=true;
 photoFile.classList.add('modern-photo-input');
 photoFile.parentNode.insertBefore(photoPicker,photoFile);
 photoPicker.append(photoFile,photoSurface);
 photoFile.addEventListener('change',()=>{
  const name=photoFile.files?.[0]?.name;
  photoSurface.querySelector('.modern-photo-action').textContent=name?'Cambiar':'Seleccioná';
  photoSurface.querySelector('.modern-photo-caption').textContent=name||'una fotografía';
 },true);
 $('clearAll')?.addEventListener('click',()=>queueMicrotask(()=>{
  photoSurface.querySelector('.modern-photo-action').textContent='Seleccioná';
  photoSurface.querySelector('.modern-photo-caption').textContent='una fotografía';
 }));
}
// Keep icon buttons in separate blocks just like Diario Show.
for(const id of ['formatUppercase','formatClear']){
 const button=$(id);if(button)button.classList.add('modern-independent');
}
const headline=$('headline');
const size=$('size');
const sizeField=size?.closest('.control-field');
if(sizeField){
 sizeField.classList.add('modern-size-field');
 const out=$('sizeLabel');
 if(out&&out.parentElement!==sizeField)sizeField.append(out);
}
headline?.closest('.control-field')?.classList.add('modern-headline-field');
// BAE's original render now supports the independent uppercase mode.
if(!isCronica&&!$('formatUppercase')){
 const format=$('formatClear')?.parentElement;
 const upper=document.createElement('button');
 upper.type='button';upper.id='formatUppercase';upper.className='modern-independent';
 upper.setAttribute('aria-label','Mostrar texto en mayúsculas');
 upper.setAttribute('aria-pressed','false');upper.title='Mostrar texto en mayúsculas';
 upper.innerHTML='<span class="material-symbols-outlined" aria-hidden="true">match_case</span>';
 format?.insertBefore(upper,$('formatClear'));
 upper.addEventListener('click',()=>{
  upper.setAttribute('aria-pressed',String(upper.getAttribute('aria-pressed')!=='true'));
  headline.classList.toggle('uppercase-preview',upper.getAttribute('aria-pressed')==='true');
  headline.dispatchEvent(new Event('input',{bubbles:true}));
 });
}
// Build mobile tabs / slider track, preserving original desktop layout.
const nav=document.createElement('nav');nav.className='modern-mobile-tabs';
nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Secciones del editor');
const buttons=['preview','controls'].map((name,i)=>{
 const b=document.createElement('button');b.type='button';b.id='modernTab'+name;
 b.setAttribute('role','tab');b.textContent=i?'Formato':'Vista previa';b.dataset.tab=name;nav.append(b);
 return b;
});
const shell=document.createElement('div');shell.className='modern-shell';
const track=document.createElement('div');track.className='modern-track';
main.prepend(nav);main.append(shell);shell.append(track);track.append(panel,preview);
const zoom=$('photoZoom'),zoomBox=zoom?.closest('.preview-zoom');
const toolbar=preview.querySelector('.preview-toolbar'),stage=$('photoStage');
if(zoomBox){
 zoomBox.classList.add('modern-photo-zoom');
 const label=zoomBox.querySelector('label');
 const desktop=document.createElement('span');desktop.className='modern-zoom-desktop';desktop.textContent='Zoom';
 const icon=document.createElement('span');icon.className='modern-zoom-icon material-icons';
 icon.setAttribute('aria-hidden','true');icon.textContent='zoom_in';
 label.replaceChildren(desktop,icon);
}
function positionZoom(){
 if(!zoomBox)return;
 if(narrow.matches&&zoomBox.parentElement!==stage)stage.appendChild(zoomBox)
 else if(zoomBox.parentElement!==stage)stage.appendChild(zoomBox);
}
function progress(range){
 const min=Number(range.min)||0,max=Number(range.max)||100,v=Number(range.value);
 range.style.setProperty('--modern-progress',(max>min?(v-min)/(max-min)*100:0)+'%');
}
function trackThumb(range,host){
 if(!range||!host)return;
 range.addEventListener('pointerdown',()=>{
  host.classList.add('is-thumb-engaged','is-adjusting');
 });
 const stop=()=>host.classList.remove('is-thumb-engaged','is-adjusting');
 window.addEventListener('pointerup',stop);window.addEventListener('pointercancel',stop);
 range.addEventListener('blur',stop);range.addEventListener('input',()=>progress(range));
 progress(range);
}
trackThumb(zoom,zoomBox);
trackThumb(size,sizeField);
const dots=$('dots');
if(dots)trackThumb(dots,dots.closest('.control-field'));
function updateHeight(){
 if(!narrow.matches){shell.style.height='';return}
 const current=main.dataset.mobileTab==='controls'?panel:preview;
 shell.style.height=current.offsetHeight+'px';
}
function selectTab(name){
 main.dataset.mobileTab=name;
 buttons.forEach(b=>{
  const selected=b.dataset.tab===name;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;
 });
 if(narrow.matches){preview.inert=name!=='preview';panel.inert=name!=='controls'}
 else{preview.inert=false;panel.inert=false}
 requestAnimationFrame(updateHeight);
}
buttons.forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab)));
function handleBreakpoint(){positionZoom();selectTab(main.dataset.mobileTab||'preview')}
narrow.addEventListener('change',handleBreakpoint);
window.addEventListener('resize',()=>{updateHeight();progress(zoom);});
if(typeof ResizeObserver!=='undefined'){
 const observer=new ResizeObserver(updateHeight);observer.observe(preview);observer.observe(panel);
}
handleBreakpoint();

/* Tooltip en el lado con espacio disponible, respetando los paneles y el viewport. */
function placeHelpTips(){
 document.querySelectorAll('.help-trigger').forEach(trigger=>{
  const bubble=trigger.querySelector('.help-tooltip'),button=trigger.querySelector('.help-button');
  if(!bubble||!button)return;
  // Alinear el globo al ícono que lo invoca, no al borde del módulo.
  // La dirección se decide usando el viewport real, no el ancho del panel.
  const icon=button.getBoundingClientRect(),gap=12,edge=16;
  const rightSpace=window.innerWidth-edge-icon.right-gap;
  const leftSpace=icon.left-edge-gap;
  const openLeft=rightSpace<220&&leftSpace>rightSpace;
  const available=Math.max(0,openLeft?leftSpace:rightSpace);
  const width=Math.min(260,Math.max(160,Math.min(240,available)));
  bubble.classList.toggle('modern-tip-left',openLeft);
  bubble.style.width=width+'px';
  bubble.style.minWidth=Math.min(160,available)+'px';
  bubble.style.left=openLeft?'auto':'calc(100% + '+gap+'px)';
  bubble.style.right=openLeft?'calc(100% + '+gap+'px)':'auto';
  bubble.style.top='50%';
  bubble.style.transform='translateY(-50%)';
  // Mantenerlo visible verticalmente sin cambiar la alineación horizontal.
  const bounds=bubble.getBoundingClientRect();
  const adjustment=bounds.top<edge?edge-bounds.top:bounds.bottom>window.innerHeight-edge
   ?window.innerHeight-edge-bounds.bottom:0;
  if(adjustment)bubble.style.transform='translateY(calc(-50% + '+Math.round(adjustment)+'px))';
 });
}
window.addEventListener('resize',placeHelpTips);
document.querySelectorAll('.help-trigger').forEach(t=>{
 t.addEventListener('pointerenter',placeHelpTips);
 t.addEventListener('focusin',placeHelpTips);
});
placeHelpTips();

// Inline preview editor: separate markup, same authoritative product state.
const clone=textPanel.cloneNode(true);
clone.removeAttribute('aria-label');clone.classList.add('modern-mirror-card');
clone.querySelectorAll('[id]').forEach(n=>n.id+='Mobile');
clone.querySelectorAll('[for]').forEach(n=>n.setAttribute('for',n.getAttribute('for')+'Mobile'));
clone.querySelectorAll('[aria-controls]').forEach(n=>n.setAttribute('aria-controls',n.getAttribute('aria-controls')+'Mobile'));
const host=document.createElement('div');
host.className='editor-panel modern-preview-text-editor';
host.setAttribute('aria-label','Editar textos desde Vista previa');
host.append(clone);preview.insertBefore(host,preview.querySelector('.preview-actions'));
const mirrorId=id=>$(id+'Mobile');
const mirrorToggle=clone.querySelector('.modern-toggle');
const mirrorBody=clone.querySelector('.modern-body');
mirrorToggle?.addEventListener('click',()=>{
 const expanded=mirrorToggle.getAttribute('aria-expanded')!=='true';
 mirrorToggle.setAttribute('aria-expanded',String(expanded));mirrorBody.hidden=!expanded;
 requestAnimationFrame(updateHeight);
});
function syncMirror(){
 if(!host.isConnected)return;
 const ids=['headline','size',...(isCronica?[]:['quote','enableQuote'])];
 for(const id of ids){
  const source=$(id),mirror=mirrorId(id);
  if(!source||!mirror)continue;
  if(source.type==='checkbox')mirror.checked=source.checked;
  else if(document.activeElement!==mirror&&mirror.value!==source.value)mirror.value=source.value;
 }
 const textValue=$('sizeLabel')?.textContent;
 if(mirrorId('sizeLabel'))mirrorId('sizeLabel').textContent=textValue||size.value;
 if(mirrorId('quote'))mirrorId('quote').hidden=$('quote').hidden;
 for(const id of ['formatUppercase','alignLeft','alignCenter']){
  const source=$(id),mirror=mirrorId(id);
  if(source&&mirror)mirror.setAttribute('aria-pressed',source.getAttribute('aria-pressed'));
 }
 if(mirrorId('headline'))mirrorId('headline').classList.toggle('uppercase-preview',headline.classList.contains('uppercase-preview'));
 progress(size);if(mirrorId('size'))progress(mirrorId('size'));
 progress(zoom);if(dots)progress(dots);
}
for(const id of ['headline','size','quote','enableQuote']){
 const source=$(id),mirror=mirrorId(id);if(!source||!mirror)continue;
 mirror.addEventListener(source.type==='checkbox'?'change':'input',()=>{
  if(source.type==='checkbox')source.checked=mirror.checked;else source.value=mirror.value;
  source.dispatchEvent(new Event(source.type==='checkbox'?'change':'input',{bubbles:true}));
  syncMirror();
 });
}
for(const id of ['alignLeft','alignCenter','formatUppercase']){
 const mirror=mirrorId(id),source=$(id);if(!mirror||!source)continue;
 mirror.addEventListener('click',()=>{source.click();syncMirror()});
}
// Editor contextual de Diseño de placas: miniaturas, logo y firma comparten módulo.
const identitySource=panel.querySelector('.modern-design-group');
const identityMirror=identitySource?.cloneNode(true);
let identityHost=null;
if(identityMirror){
 identityMirror.classList.add('modern-mirror-card');
 identityMirror.querySelectorAll('[id]').forEach(n=>n.id+='IdentityPreview');
 identityMirror.querySelectorAll('[for]').forEach(n=>n.setAttribute('for',n.getAttribute('for')+'IdentityPreview'));
 identityHost=document.createElement('div');
 identityHost.className='editor-panel modern-preview-identity-editor';
 identityHost.setAttribute('aria-label','Diseño de placas desde Vista previa');
 identityHost.hidden=true;identityHost.append(identityMirror);host.after(identityHost);
 const toggle=identityMirror.querySelector('.modern-toggle'),body=identityMirror.querySelector('.modern-body');
 toggle.addEventListener('click',()=>{
  const expanded=toggle.getAttribute('aria-expanded')!=='true';
  toggle.setAttribute('aria-expanded',String(expanded));body.hidden=!expanded;
  requestAnimationFrame(updateHeight);
 });
 identityMirror.addEventListener('click',event=>{
  const choice=event.target.closest('[data-logo],[data-footer-style],[data-page-variant],[data-theme]');
  if(!choice)return;
  const selector=choice.dataset.logo!==undefined?'[data-logo="'+choice.dataset.logo+'"]':
   choice.dataset.footerStyle!==undefined?'[data-footer-style="'+choice.dataset.footerStyle+'"]':
   choice.dataset.pageVariant!==undefined?'[data-page-variant="'+choice.dataset.pageVariant+'"]':
   '[data-theme="'+choice.dataset.theme+'"]';
  identitySource.querySelector(selector)?.click();
  syncIdentityMirror();
 });
}
function syncIdentityMirror(){
 if(!identityMirror||!identitySource)return;
 for(const option of identityMirror.querySelectorAll('[data-logo],[data-footer-style],[data-page-variant],[data-theme]')){
  const selector=option.dataset.logo!==undefined?'[data-logo="'+option.dataset.logo+'"]':
   option.dataset.footerStyle!==undefined?'[data-footer-style="'+option.dataset.footerStyle+'"]':
   option.dataset.pageVariant!==undefined?'[data-page-variant="'+option.dataset.pageVariant+'"]':
   '[data-theme="'+option.dataset.theme+'"]';
  const source=identitySource.querySelector(selector);
  if(source)option.setAttribute('aria-pressed',source.getAttribute('aria-pressed'));
 }
}
function showPreviewContext(which){
 const isLogo=which==='logo';
 stage.querySelector('.modern-logo-hit')?.classList.toggle('is-hotspot-selected',isLogo);
 stage.querySelector('.modern-text-hit')?.classList.toggle('is-hotspot-selected',!isLogo);
 const source=isLogo?identitySource:textPanel;
 const mirrored=isLogo?identityMirror:clone;
 if(!source||!mirrored)return;
 if(narrow.matches){
  host.hidden=isLogo;
  if(identityHost)identityHost.hidden=!isLogo;
  main.dataset.previewContext=which;
  const toggle=mirrored.querySelector('.modern-toggle'),body=mirrored.querySelector('.modern-body');
  toggle.setAttribute('aria-expanded','true');body.hidden=false;
  if(isLogo)syncIdentityMirror();else syncMirror();
  updateHeight();
 }else{
  const toggle=source.querySelector('.modern-toggle'),body=source.querySelector('.modern-body');
  if(toggle&&body){toggle.setAttribute('aria-expanded','true');body.hidden=false}
 }
 const card=narrow.matches?mirrored:source;
 document.querySelectorAll('.modern-context-target').forEach(c=>c.classList.remove('modern-context-target'));
 void card.offsetWidth;card.classList.add('modern-context-target');
 const scrollTarget=narrow.matches?(isLogo?identityHost:host):source;
 if(scrollTarget){
  const center=()=>{
   const rect=scrollTarget.getBoundingClientRect();
   const top=scrollY+rect.top+rect.height/2-innerHeight/2;
   const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
   window.scrollTo({top:Math.max(0,Math.min(max,top)),behavior:'instant'});
  };
  requestAnimationFrame(()=>{updateHeight();requestAnimationFrame(center)});
  if(narrow.matches)setTimeout(center,320);
 }
}

const mirrorHeadline=mirrorId('headline');
for(const [id,marker] of [['formatAccent','*'],['formatItalic','_'],['formatStrike','~'],['formatClear',null]]){
 const btn=mirrorId(id);if(!btn||!mirrorHeadline)continue;
 btn.addEventListener('pointerdown',e=>e.preventDefault());
 btn.addEventListener('click',()=>{
  let a=mirrorHeadline.selectionStart,b=mirrorHeadline.selectionEnd;
  if(a===b){mirrorHeadline.focus();return}
  const selection=mirrorHeadline.value.slice(a,b);
  const replacement=marker?marker+selection+marker:selection.replace(/[\*_~]/g,'');
  mirrorHeadline.setRangeText(replacement,a,b,'select');
  headline.value=mirrorHeadline.value;headline.dispatchEvent(new Event('input',{bubbles:true}));
  mirrorHeadline.focus({preventScroll:true});syncMirror();
 });
}
if(mirrorId('size'))trackThumb(mirrorId('size'),mirrorId('size').closest('.modern-size-field'));
// Tooltips within the mirrored module use their own cloned nodes.
clone.querySelectorAll('.help-trigger').forEach(t=>{
 const b=t.querySelector('.help-button');if(!b)return;
 b.addEventListener('click',e=>{e.stopPropagation();const open=!t.classList.contains('is-open');
  t.classList.toggle('is-open',open);b.setAttribute('aria-expanded',String(open))});
});
function syncAfterRender(){syncMirror();updateHeight()}
window.addEventListener('modern:render',syncAfterRender);
document.addEventListener('click',()=>requestAnimationFrame(syncAfterRender));
syncMirror();
// A transparent hit surface lets the user scroll over the TEXT portion
// of the canvas (touch-action:pan-y), while the photo keeps native reframe drag.
const textHit=document.createElement('div');
textHit.className='modern-text-hit';
textHit.setAttribute('role','button');textHit.setAttribute('tabindex','0');
textHit.setAttribute('aria-label','Editar texto principal');
stage.append(textHit);
let tap=null,allowClick=false;
function onTextPointerDown(e){
 if(!narrow.matches||main.dataset.mobileTab!=='preview'||e.isPrimary===false)return;
 const rect=canvas.getBoundingClientRect();
 const y=(e.clientY-rect.top)/rect.height;
 const photo=parseFloat(stage.style.getPropertyValue('--photo-height'))||60;
 if(y<photo/100)return;
 allowClick=false;tap={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()};
}
function onTextPointerMove(e){
 if(tap&&e.pointerId===tap.id&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>9)tap=null;
}
function onTextPointerUp(e){
 allowClick=Boolean(tap&&tap.id===e.pointerId&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<9
  &&performance.now()-tap.time<550);
 tap=null;
}
function onTextClick(e){
 if(!allowClick||!narrow.matches||main.dataset.mobileTab!=='preview')return;
 allowClick=false;e.preventDefault();showPreviewContext('text');
}
for(const target of [canvas,textHit]){
 target.addEventListener('pointerdown',onTextPointerDown);
 target.addEventListener('pointermove',onTextPointerMove);
 target.addEventListener('pointerup',onTextPointerUp);
 target.addEventListener('pointercancel',()=>{tap=null;allowClick=false});
 target.addEventListener('click',onTextClick);
}
// La zona del logo está por encima del Canvas y de la carga de fotos.
const logoHit=document.createElement('button');
logoHit.type='button';logoHit.className='modern-logo-hit';
logoHit.setAttribute('aria-label','Editar logo en Diseño de placas');
stage.append(logoHit);
logoHit.addEventListener('click',event=>{
 event.preventDefault();event.stopPropagation();showPreviewContext('logo');
});
// En desktop el titular abre Textos, sin poner el foco en el textarea.
textHit.addEventListener('click',event=>{
 if(!narrow.matches){event.preventDefault();showPreviewContext('text')}
});
// Igual que Diario Show: seleccionar logo/titular solo mantiene el punteado
// hasta el siguiente clic fuera de sus zonas. El módulo abierto no se cierra.
document.addEventListener('pointerdown',event=>{
 if(event.target.closest?.('.modern-logo-hit,.modern-text-hit'))return;
 for(const hotspot of [logoHit,textHit]){
  hotspot.classList.remove('is-hotspot-selected');
  hotspot.setAttribute('aria-pressed','false');
 }
});
// Mismas medidas que Diario Show: rectángulos en 1080 × 1440,
 // convertidos a porcentajes relativos a la placa. No cubren la caja blanca.
function positionPreviewHotspots(){
 const bounds=window.__editorialHotspotBounds;
 if(!bounds)return;
 for(const [node,area] of [[logoHit,bounds.logo],[textHit,bounds.text]]){
  if(!area||!Number.isFinite(area.left)||!Number.isFinite(area.top)||!Number.isFinite(area.right)||!Number.isFinite(area.bottom))continue;
  node.style.left=Math.max(0,area.left)/1080*100+'%';
  node.style.top=Math.max(0,area.top)/1440*100+'%';
  node.style.width=Math.max(0,Math.min(1080,area.right)-Math.max(0,area.left))/1080*100+'%';
  node.style.height=Math.max(0,Math.min(1440,area.bottom)-Math.max(0,area.top))/1440*100+'%';
  node.style.right='auto';
  node.style.bottom='auto';
 }
}
window.addEventListener('modern:render',()=>{syncIdentityMirror();positionPreviewHotspots()});
syncIdentityMirror();
positionPreviewHotspots();
textHit.addEventListener('keydown',e=>{
 if(e.key==='Enter'||e.key===' '){
  e.preventDefault();
  showPreviewContext('text');
 }
});
})();
