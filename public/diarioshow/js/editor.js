
(function(){
'use strict';
const el=id=>document.getElementById(id),canvas=el('art'),ctx=canvas.getContext('2d'),W=1080,H=1440;
let halftone=null;const halftoneLayer=document.createElement('canvas');halftoneLayer.width=1080;halftoneLayer.height=1236;const halftoneCtx=halftoneLayer.getContext('2d');let importingArticle=false;let photoRevision=0;let selectedTexture='1';const halftoneAssets={};function loadTexture(id,path){const asset=new Image();asset.onload=()=>{halftoneAssets[id]=asset;if(selectedTexture===id){halftone=asset;render()}};asset.onerror=()=>console.error('No se pudo cargar '+path);asset.src=path}loadTexture('1','../bae/halftone-editable.svg?v=2');loadTexture('2','../bae/halftone-2.svg?v=1');let textAlignment='center',forceUppercase=false,pageBlank=false;let image=null,zoom=1,offsetX=0,offsetY=0,dragging=false,lastX=0,lastY=0,photoBottom=820,photoHover=false;
// Foto compartida: dos recortes independientes dentro del área fotográfica.
let photoLayout='single',activePhotoSide='left';
// Regiones exactas aproximadas de cada línea de titular, en coordenadas del PNG.
let headlineHitRegions=[];
const splitPhotos={left:{image:null,zoom:1,x:0,y:0,revision:0},right:{image:null,zoom:1,x:0,y:0,revision:0}};
function activePhoto(){return splitPhotos[activePhotoSide]}
function syncPhotoZoom(){const current=photoLayout==='split'?activePhoto().zoom:zoom;const slider=el('photoZoom');slider.value=Math.round(current*100);el('zoomLabel').textContent=Math.round(current*100)+' %';const min=Number(slider.min),max=Number(slider.max);slider.style.setProperty('--ds-zoom-progress',(max>min?(Number(slider.value)-min)/(max-min)*100:0)+'%')}
function drawSplitPhotos(height){
 for(const side of ['left','right']){
  const photo=splitPhotos[side],left=side==='left'?0:W/2,width=W/2;
  if(!photo.image)continue;
  const img=photo.image,scale=Math.max(width/img.width,height/img.height)*photo.zoom;
  const iw=img.width*scale,ih=img.height*scale;
  const maxX=Math.max(0,(iw-width)/2),maxY=Math.max(0,(ih-height)/2);
  photo.x=Math.max(-maxX,Math.min(maxX,photo.x));photo.y=Math.max(-maxY,Math.min(maxY,photo.y));
  ctx.save();ctx.beginPath();ctx.rect(left,0,width,height);ctx.clip();
  ctx.drawImage(img,left+(width-iw)/2+photo.x,(height-ih)/2+photo.y,iw,ih);
  ctx.restore();
 }
}
function setPhotoSide(side){if(photoLayout!=='split'||!splitPhotos[side])return;activePhotoSide=side;syncPhotoZoom();updatePhotoStage()}
function setPhotoLayout(mode){
 if(!['single','split'].includes(mode))return;
 // Las variantes editoriales 3 y 4 admiten exclusivamente una fotografía.
 if(mode==='split'&&['quote','quote-blue'].includes(el('theme').value))return;
 photoLayout=mode;
 document.querySelectorAll('[data-photo-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.photoLayout===mode)));
 el('splitPhotoFields').hidden=mode!=='split';el('splitPhotoZones').hidden=mode!=='split';
 el('singlePhotoField').hidden=mode==='split';
 if(mode==='split')activePhotoSide='left';
 el('photoStage').classList.remove('hover-left','hover-right');
 el('splitPhotoZones').querySelectorAll('.split-photo-zone').forEach(zone=>zone.classList.remove('is-hovered'));
 syncPhotoZoom();render();
}
document.querySelectorAll('[data-photo-layout]').forEach(b=>b.addEventListener('click',()=>setPhotoLayout(b.dataset.photoLayout)));
// Shift + clic en la cabecera de Formato: cerrar todos si la cabecera
// estaba abierta, abrir todos si estaba cerrada. No altera módulos ocultos
// por la variante ni reconstruye los controles editoriales.
document.addEventListener('click',event=>{
 if(!event.shiftKey)return;
 const toggle=event.target.closest?.('#dsMobileControlsPanel > .ds-control-card > .ds-control-card-toggle');
 if(!toggle)return;
 event.preventDefault();
 event.stopImmediatePropagation();
 const expand=toggle.getAttribute('aria-expanded')!=='true';
 document.querySelectorAll('#dsMobileControlsPanel > .ds-control-card:not([hidden])').forEach(card=>{
  const button=card.querySelector(':scope > .ds-control-card-toggle');
  const body=card.querySelector(':scope > .ds-control-card-body');
  if(!button||!body)return;
  button.setAttribute('aria-expanded',String(expand));
  body.hidden=!expand;
 });
 flashContextCard(toggle.closest('.ds-control-card'));
 // Shift se interpreta como navegación por teclado y puede activar :focus-visible
 // aunque el gesto haya sido con mouse: evitar ese segundo marco rosa.
 // Mantener el foco para activaciones reales de teclado (click.detail === 0).
 if(event.detail>0)toggle.blur();
 if(typeof updateMobileSlideHeight==='function')requestAnimationFrame(updateMobileSlideHeight);
},true);
// Fusionar identidad en Diseño de placas sin duplicar IDs ni perder listeners.
const designCard=document.querySelector('#dsMobileControlsPanel .ds-plate-design-group');
const identityCard=document.querySelector('#dsMobileControlsPanel .ds-content-group');
if(designCard&&identityCard){
 const designBody=designCard.querySelector(':scope > .ds-control-card-body');
 const identityBody=identityCard.querySelector(':scope > .ds-control-card-body');
 for(const node of [...identityBody.children])designBody.append(node);
 identityCard.remove();
}
// Cambio 45 — Diario Show: «Mostrar autor de la cita» vive en Diseño
// de placas; el input condicionado permanece arriba de todo en Textos.
// Se mueven los nodos reales: ningún ID ni listener se duplica.
if(designCard){
 const designBody=designCard.querySelector(':scope > .ds-control-card-body');
 const textBody=document.querySelector('#dsMobileControlsPanel .ds-texts-group > .ds-control-card-body');
 const authorField=el('quoteAuthorField');
 const switchLabel=authorField?.querySelector('.ds-author-toggle');
 if(designBody&&textBody&&authorField&&switchLabel){
  const switchField=document.createElement('div');
  switchField.className='control-field ds-author-switch-field';
  switchField.id='quoteAuthorToggleField';
  switchField.hidden=true;
  switchField.append(switchLabel);
  designBody.append(switchField);
  textBody.prepend(authorField);
 }
}
// Secciones plegables: solo se oculta el contenido, sin reiniciar controles.
document.querySelectorAll('.ds-control-card-toggle').forEach(button=>{
 button.addEventListener('click',()=>{
  const body=el(button.getAttribute('aria-controls'));
  const expanded=button.getAttribute('aria-expanded')!=='true';
  button.setAttribute('aria-expanded',String(expanded));
  body.hidden=!expanded;
 });
});

const GRADIENT_BAR_HEIGHT=24;
const LOGO_MARGIN=80,LOGO_WIDTH=75*1.25*1.15,LOGO_HEIGHT=LOGO_WIDTH*275/253;
let selectedLogo='primary',logoPosition='right',footerStyle='center';
function drawFooter(color,baseline){
 ctx.save();ctx.fillStyle=color;ctx.font='500 30px "Inter",Arial,sans-serif';
 ctx.textAlign=footerStyle==='center'?'center':'left';
 ctx.fillText('diarioshow.com.ar',footerStyle==='center'?W/2:80,baseline);
 if(footerStyle==='carousel'){
  // Igual que la portada de Crónica: Material Icons arrow_forward de 54px,
  // alineado al margen derecho de 80px y centrado verticalmente en el pie.
  ctx.font='54px "Material Icons"';
  ctx.textAlign='right';
  ctx.textBaseline='middle';
  ctx.fillText('arrow_forward',W-80,H-80-16);
 }
 ctx.restore();
}
document.querySelectorAll('[data-footer-style]').forEach(button=>button.addEventListener('click',()=>{
 footerStyle=button.dataset.footerStyle;
 document.querySelectorAll('[data-footer-style]').forEach(option=>option.setAttribute('aria-pressed',String(option.dataset.footerStyle===footerStyle)));
 render();
}));
const logoImages={},logoSources={primary:'./logos/primario.svg'};
for(const [key,src] of Object.entries(logoSources)){
 const img=new Image();logoImages[key]=img;
 img.onload=()=>render();
 img.onerror=()=>console.error('No se pudo cargar el logo de Diario Show:',src);
 img.src=src;
}
function drawBrandLogo(){
 if(selectedLogo==='none')return;
 const img=logoImages[selectedLogo];
 if(!img||!img.complete||!img.naturalWidth)return;
 ctx.drawImage(img,logoPosition==='left'?LOGO_MARGIN:W-LOGO_MARGIN-LOGO_WIDTH,LOGO_MARGIN,LOGO_WIDTH,LOGO_HEIGHT);
}
function syncLogoChoices(){
 document.querySelectorAll('.logo-choice').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.logo===selectedLogo)));
}
document.querySelectorAll('.logo-choice').forEach(button=>button.addEventListener('click',()=>{
 selectedLogo=button.dataset.logo;syncLogoChoices();render();
}));
syncLogoChoices();
function syncLogoPosition(){
 document.querySelectorAll('[data-logo-position]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.logoPosition===logoPosition)));
}
document.querySelectorAll('[data-logo-position]').forEach(button=>button.addEventListener('click',()=>{
 logoPosition=button.dataset.logoPosition;syncLogoPosition();render();
}));
syncLogoPosition();
const quoteMarkImage=new Image();
quoteMarkImage.onload=()=>render();
quoteMarkImage.onerror=()=>console.warn('No se pudieron cargar las comillas SVG');
quoteMarkImage.src='./logos/comillas.svg';
const palette={quote:{bg:'#E6008D',text:'#FFFFFF',accent:'#FFFFFF'},'quote-blue':{bg:'#00A6D9',text:'#FFFFFF',accent:'#FFFFFF'},pink:{bg:'#ffffff',text:'#7749A6',accent:'#E6008D',gradientStart:'#E6008D',gradientEnd:'#7749A6'},blue:{bg:'#ffffff',text:'#7749A6',accent:'#00A6D9',gradientStart:'#7749A6',gradientEnd:'#397FC6'}};
// Igual que en Crónica: el modo mayúsculas afecta solo la presentación.
function syncUppercaseUI(){
 el('formatUppercase').setAttribute('aria-pressed',String(forceUppercase));
 el('headline').classList.toggle('uppercase-preview',forceUppercase);
}
function headlineForPreview(){
 return forceUppercase?el('headline').value.toLocaleUpperCase('es-AR'):el('headline').value;
}
function parseRich(text){const out=[];let style={accent:false,italic:false,strike:false},buffer='';const flush=()=>{if(buffer){out.push({text:buffer,...style});buffer=''}};for(const c of String(text)){const field=c==='*'?'accent':c==='_'?'italic':c==='~'?'strike':null;if(field){flush();style={...style,[field]:!style[field]}}else buffer+=c}flush();return out}
function wrapRich(text,size,quote=false){const result=[];for(const paragraph of String(text).split('\n')){const spans=quote?[{text:paragraph,italic:true,accent:false,strike:false}]:parseRich(paragraph);let line=[],width=0;for(const span of spans){for(const part of span.text.match(/\S+|\s+/g)||[]){const font=(span.italic?'italic ':'')+'700 '+size+'px "Poppins",Arial,sans-serif';ctx.font=font;const partWidth=ctx.measureText(part).width;if(width+partWidth>920&&width>0&&part.trim()){result.push({parts:line,quote});line=[];width=0}if(!line.length&&!part.trim())continue;line.push({...span,text:part,width:partWidth});width+=partWidth}}if(line.length)result.push({parts:line,quote})}return result}

/* Variante 3: cita editorial. El degradé cubre parte de la fotografía
   y la distribución vertical mantiene márgenes reales de 80 y espacios de 50 px. */
function renderQuoteVariant(size,footerBaseline,footerTop,includeHover=true){
 const main=wrapRich(headlineForPreview(),size);
 const author=el('showQuoteAuthor').checked?el('quoteAuthor').value.trim():'';
 const hasAuthor=Boolean(author);
 const authorSize=36;
 ctx.font='600 '+authorSize+'px "Poppins",Arial,sans-serif';
 const authorMetrics=ctx.measureText(author||' ');
 const authorAscent=authorMetrics.actualBoundingBoxAscent||authorSize;
 const authorDescent=authorMetrics.actualBoundingBoxDescent||8;
 const authorBaseline=footerTop-50-authorDescent;
 const authorTop=hasAuthor?authorBaseline-authorAscent:footerTop;
 const lineHeight=Math.round(size*1.12*0.8*1.10);
 const lineMetrics=main.map(line=>{
  ctx.font='700 '+size+'px "Poppins",Arial,sans-serif';
  const m=ctx.measureText(line.parts.map(p=>p.text).join('')||' ');
  return {ascent:m.actualBoundingBoxAscent||size,descent:m.actualBoundingBoxDescent||Math.ceil(size*.2)};
 });
 const baselines=new Array(main.length);
 if(main.length){
  const last=main.length-1;
  baselines[last]=authorTop-50-lineMetrics[last].descent;
  for(let i=last-1;i>=0;i--)baselines[i]=baselines[i+1]-lineHeight;
 }
 const firstTop=main.length?baselines[0]-lineMetrics[0].ascent:authorTop-50;
 const quoteHeight=76,quoteWidth=100;
 const iconY=firstTop-quoteHeight-30;
 const gradientTop=Math.max(180,iconY-100);
 // La fotografía ocupa todo el lienzo; el degradé se superpone sin crear caja opaca.
 ctx.clearRect(0,0,W,H);
 ctx.fillStyle='#aeb4bc';ctx.fillRect(0,0,W,H);
 if(photoLayout==='split')drawSplitPhotos(H);
 else if(image){
  const base=Math.max(W/image.width,H/image.height),scale=base*zoom;
  const iw=image.width*scale,ih=image.height*scale;
  const maxX=Math.max(0,(iw-W)/2),maxY=Math.max(0,(ih-H)/2);
  offsetX=Math.max(-maxX,Math.min(maxX,offsetX));
  offsetY=Math.max(-maxY,Math.min(maxY,offsetY));
  ctx.drawImage(image,(W-iw)/2+offsetX,(H-ih)/2+offsetY,iw,ih);
 }
 // La sombra del hover va sobre TODA la foto, antes del degradé, sin línea de corte.
 if(includeHover&&photoHover&&!image){
  ctx.fillStyle='rgba(0,0,0,.11)';
  ctx.fillRect(0,0,W,H);
 }
 // Prueba de degradé: un solo fucsia institucional, del 0 al 100 % de opacidad.
 // La mezcla de cuatro tonos anterior se conserva en el historial de GitHub.
 const gradient=ctx.createLinearGradient(0,gradientTop,0,H);
 const isBlue=el('theme').value==='quote-blue';
 gradient.addColorStop(0,isBlue?'rgba(0,166,217,0)':'rgba(230,0,141,0)');
 gradient.addColorStop(1,isBlue?'rgba(0,166,217,1)':'rgba(230,0,141,1)');
 ctx.fillStyle=gradient;
 ctx.fillRect(0,gradientTop,W,H-gradientTop);
 drawBrandLogo();
 if(quoteMarkImage.complete&&quoteMarkImage.naturalWidth){
  ctx.drawImage(quoteMarkImage,(W-quoteWidth)/2,iconY,quoteWidth,quoteHeight);
 }
 const centered=textAlignment==='center';
 ctx.textBaseline='alphabetic';
 for(let i=0;i<main.length;i++){
  const line=main[i],total=line.parts.reduce((sum,p)=>sum+p.width,0);
  let x=centered?(W-total)/2:80;
  if(total>0)headlineHitRegions.push({left:x-14,right:x+total+14,top:baselines[i]-size*1.05,bottom:baselines[i]+size*.28});
  for(const part of line.parts){
   ctx.font=(part.italic?'italic ':'')+'700 '+size+'px "Poppins",Arial,sans-serif';
   ctx.textAlign='left';ctx.fillStyle='#FFFFFF';ctx.fillText(part.text,x,baselines[i]);
   if(part.strike){
    ctx.strokeStyle='#FFFFFF';ctx.lineWidth=Math.max(2,Math.round(size*.045));
    const y=baselines[i]-Math.round(size*.32);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+part.width,y);ctx.stroke();
   }
   x+=part.width;
  }
 }
 ctx.fillStyle='#FFFFFF';ctx.textAlign='center';
 ctx.font='600 '+authorSize+'px "Poppins",Arial,sans-serif';
 if(hasAuthor)ctx.fillText(author,W/2,authorBaseline);
 ctx.font='500 30px "Inter",Arial,sans-serif';
 drawFooter('#FFFFFF',footerBaseline);
 ctx.textAlign='left';
 photoBottom=Math.max(180,Math.min(H,gradientTop));
 const overlay=el('importOverlay');if(overlay)overlay.style.height=(photoBottom/H*100)+'%';
 updatePhotoStage();
 el('dotsLabel').textContent=el('dots').value+'%';
 el('sizeLabel').textContent=size;
 syncPhotoZoom();
 
 el('status').textContent=iconY<120?'Texto demasiado largo: reducí el tamaño.':'Vista previa activa · Arrastrá la foto para reencuadrarla.';
}

function syncSizeSliderTrack(){
 const slider=el('size');
 if(!slider)return;
 const min=Number(slider.min),max=Number(slider.max),value=Number(slider.value);
 const progress=max>min?Math.max(0,Math.min(100,((value-min)/(max-min))*100)):0;
 slider.style.setProperty('--ds-size-progress',progress+'%');
}
syncSizeSliderTrack();
el('size').addEventListener('input',syncSizeSliderTrack);
// Pequeño rebote visual al modificar el número, sin desplazar el layout.
let sizeValueBounce;
el('size').addEventListener('input',()=>{
 const output=el('sizeLabel');
 if(!sizeControl?.classList.contains('is-adjusting')||window.matchMedia('(prefers-reduced-motion: reduce)').matches||!output.animate)return;
 sizeValueBounce?.cancel();
 sizeValueBounce=output.animate([
  {transform:'translateY(0) scale(1.22)',offset:0},
  {transform:'translateY(-3px) scale(1.29)',offset:.42},
  {transform:'translateY(0) scale(1.22)',offset:1}
 ],{duration:155,easing:'ease-out'});
});
const sizeControl=el('size').closest('.ds-inline-type-size');
const setSizeAdjusting=active=>sizeControl?.classList.toggle('is-adjusting',Boolean(active));
// Solo activar el thumb si el puntero cae dentro de su círculo real.
// El input completo conserva la selección por clic y el arrastre nativos.
const sizeSlider=el('size');
let sizeThumbPointerId=null;
function isPointerOnSizeThumb(event){
 const rect=sizeSlider.getBoundingClientRect();
 const min=Number(sizeSlider.min),max=Number(sizeSlider.max);
 const t=max>min?(Number(sizeSlider.value)-min)/(max-min):0;
 const radius=7.5;
 const x=rect.left+radius+t*Math.max(0,rect.width-radius*2);
 const y=rect.top+rect.height/2;
 return Math.abs(event.clientX-x)<=radius+3&&Math.abs(event.clientY-y)<=radius+4;
}
function syncSizeThumbHover(event){
 if(sizeThumbPointerId!==null)return;
 sizeControl?.classList.toggle('is-thumb-hover',isPointerOnSizeThumb(event));
}
sizeSlider.addEventListener('pointerenter',syncSizeThumbHover);
sizeSlider.addEventListener('pointermove',syncSizeThumbHover);
sizeSlider.addEventListener('pointerleave',()=>{if(sizeThumbPointerId===null)sizeControl?.classList.remove('is-thumb-hover')});
sizeSlider.addEventListener('pointerdown',event=>{
 setSizeAdjusting(true);
 const onThumb=isPointerOnSizeThumb(event);
 sizeThumbPointerId=onThumb?event.pointerId:null;
 sizeControl?.classList.toggle('is-thumb-engaged',onThumb);
 sizeControl?.classList.toggle('is-thumb-hover',onThumb);
});
function stopSizeInteraction(){
 setSizeAdjusting(false);
 sizeThumbPointerId=null;
 sizeControl?.classList.remove('is-thumb-engaged','is-thumb-hover');
}
window.addEventListener('pointerup',stopSizeInteraction);
window.addEventListener('pointercancel',stopSizeInteraction);
el('size').addEventListener('blur',stopSizeInteraction);
el('size').addEventListener('keydown',event=>{
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key))setSizeAdjusting(true);
});
el('size').addEventListener('keyup',()=>setSizeAdjusting(false));
function render(includeHover=true){
try{
 if(pageBlank){ctx.clearRect(0,0,W,H);ctx.fillStyle='#aeb4bc';ctx.fillRect(0,0,W,H);photoBottom=H;return;}
headlineHitRegions=[];
const colors=palette[el('theme').value]||palette.pink,size=Number(el('size').value),lineHeight=Math.round(size*1.12*0.8*1.10),main=wrapRich(headlineForPreview(),size),quotes=[];
// Coordenadas en píxeles reales del PNG (1080 × 1440), no píxeles CSS.
// Piso de la firma exactamente a 80 px del borde inferior.
ctx.textBaseline='alphabetic';
ctx.font='500 30px "Inter",Arial,sans-serif';
const footerMetrics=ctx.measureText('diarioshow.com.ar');
const footerAscent=footerMetrics.actualBoundingBoxAscent||29;
const footerDescent=footerMetrics.actualBoundingBoxDescent||0;
const footerBaseline=H-80-footerDescent;
const footerTop=footerBaseline-footerAscent;
if(['quote','quote-blue'].includes(el('theme').value)){
 renderQuoteVariant(size,footerBaseline,footerTop,includeHover);
 return;
}
// Construir las líneas en orden visual y posicionarlas desde abajo.
const lines=[...main,...quotes];
const lineMetrics=lines.map(line=>{
 ctx.font=(line.quote?'italic ':'')+'700 '+size+'px "Poppins",Arial,sans-serif';
 const m=ctx.measureText(line.parts.map(p=>p.text).join('')||' ');
 return {ascent:m.actualBoundingBoxAscent||size,descent:m.actualBoundingBoxDescent||Math.ceil(size*.2)};
});
const baselines=new Array(lines.length);
if(lines.length){
 const last=lines.length-1;
 baselines[last]=footerTop-50-lineMetrics[last].descent;
 for(let i=last-1;i>=0;i--){
  const groupGap=!lines[i].quote&&lines[i+1].quote?20:0;
  baselines[i]=baselines[i+1]-lineHeight-groupGap;
 }
}
const firstBaseline=baselines[0]??footerTop-50;
const firstAscent=lineMetrics[0]?.ascent??size;
const boxTop=Math.max(80,firstBaseline-firstAscent-50);
photoBottom=boxTop-GRADIENT_BAR_HEIGHT;
ctx.clearRect(0,0,W,H);
ctx.fillStyle='#aeb4bc';ctx.fillRect(0,0,W,photoBottom);
if(photoLayout==='split')drawSplitPhotos(photoBottom);
else if(image){
const base=Math.max(W/image.width,photoBottom/image.height),scale=base*zoom,iw=image.width*scale,ih=image.height*scale;
const maxX=Math.max(0,(iw-W)/2),maxY=Math.max(0,(ih-photoBottom)/2);
offsetX=Math.max(-maxX,Math.min(maxX,offsetX));offsetY=Math.max(-maxY,Math.min(maxY,offsetY));
ctx.save();ctx.beginPath();ctx.rect(0,0,W,photoBottom);ctx.clip();ctx.drawImage(image,(W-iw)/2+offsetX,(photoBottom-ih)/2+offsetY,iw,ih);ctx.restore();
} // El aviso de carga es HTML interactivo, no forma parte del PNG.
drawBrandLogo();
ctx.fillStyle=colors.bg;ctx.fillRect(0,boxTop,W,H-boxTop);
// Variantes Diario Show: caja blanca sin semitonos y barra de 24 px (50 % más alta que la anterior).
// La caja y la barra se desplazan juntas cuando el texto necesita más líneas.
const gradient=ctx.createLinearGradient(0,0,W,0);
gradient.addColorStop(0,colors.gradientStart);gradient.addColorStop(1,colors.gradientEnd);
ctx.fillStyle=gradient;ctx.fillRect(0,boxTop-GRADIENT_BAR_HEIGHT,W,GRADIENT_BAR_HEIGHT);
const centered=textAlignment==='center';
ctx.textAlign=centered?'center':'left';ctx.textBaseline='alphabetic';
for(let i=0;i<lines.length;i++){
 const line=lines[i],total=line.parts.reduce((sum,p)=>sum+p.width,0);
 let x=centered?(W-total)/2:80;
 if(!line.quote&&total>0)headlineHitRegions.push({left:x-14,right:x+total+14,top:baselines[i]-size*1.05,bottom:baselines[i]+size*.28});
 for(const part of line.parts){
  ctx.font=((line.quote||part.italic)?'italic ':'')+'700 '+size+'px "Poppins",Arial,sans-serif';
  ctx.textAlign='left';ctx.fillStyle=(line.quote||part.accent)?colors.accent:colors.text;
  ctx.fillText(part.text,x,baselines[i]);
  if(part.strike&&!line.quote){const y=baselines[i]-size*.32;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.max(2,size*.045);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+part.width,y);ctx.stroke()}
  x+=part.width;
 }
}
drawFooter(colors.text,footerBaseline);
const overlay=el('importOverlay');if(overlay){overlay.style.height=(photoBottom/H*100)+'%';}updatePhotoStage();el('dotsLabel').textContent=el('dots').value+'%';el('sizeLabel').textContent=size;syncPhotoZoom();el('status').textContent=boxTop<=80?'Texto demasiado largo: reducí el tamaño.':'Vista previa activa · Arrastrá la foto para reencuadrarla.';
}catch(error){el('status').textContent='Error de vista previa: '+error.message;console.error(error)}
finally{syncMobileTextEditor();updatePreviewHitOverlays();if(document.getElementById('dsMobileContentEditor'))syncPreviewContentEditor();window.dispatchEvent(new Event('modern:render'))}
}
// Algunos navegadores restauran el valor anterior del slider aunque el HTML diga 5.
function resetDefaultHalftone(){el('dots').value='5';el('dotsLabel').textContent='5%';render()}
resetDefaultHalftone();
window.addEventListener('pageshow',event=>{if(event.persisted)resetDefaultHalftone()});
syncUppercaseUI();
el('formatUppercase').addEventListener('click',()=>{forceUppercase=!forceUppercase;syncUppercaseUI();render()});
el('showQuoteAuthor').addEventListener('change',()=>{
 el('quoteAuthorInputField').hidden=!el('showQuoteAuthor').checked;
 render();
});
for(const id of ['headline','size','dots','quoteAuthor'])el(id).addEventListener('input',render);for(const [id,value] of [['alignLeft','left'],['alignCenter','center']])el(id).addEventListener('click',()=>{textAlignment=value;el('alignLeft').setAttribute('aria-pressed',String(value==='left'));el('alignCenter').setAttribute('aria-pressed',String(value==='center'));render()});for(const [id,marker] of [['formatAccent','*'],['formatItalic','_'],['formatStrike','~']]){const button=el(id);button.addEventListener('mousedown',e=>e.preventDefault());button.addEventListener('click',()=>{const field=el('headline'),a=field.selectionStart,b=field.selectionEnd;if(a===b){field.focus();return}const selected=field.value.slice(a,b);field.setRangeText(marker+selected+marker,a,b,'select');field.setSelectionRange(a+1,b+1);field.focus();render()})}

const clearFormatButton=el('formatClear');
clearFormatButton.addEventListener('mousedown',event=>event.preventDefault());
clearFormatButton.addEventListener('click',()=>{
 const field=el('headline'),value=field.value,start=field.selectionStart,end=field.selectionEnd;
 if(start===end){field.focus();return}
 const marks=new Set(['*','_','~']);
 let left=start,right=end;
 while(left>0&&right<value.length&&marks.has(value[left-1])&&value[left-1]===value[right]){left--;right++}
 const cleaned=value.slice(left,right).replace(/[*_~]/g,'');
 field.setRangeText(cleaned,left,right,'select');
 field.setSelectionRange(left,left+cleaned.length);
 field.focus();render();
});
document.querySelectorAll('.texture-option').forEach(button=>button.addEventListener('click',()=>{selectedTexture=button.dataset.texture;halftone=halftoneAssets[selectedTexture]||null;document.querySelectorAll('.texture-option').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render()}));
// Selector accesible de variante, sin librerías externas.
const variantButtons=[...document.querySelectorAll('.ds-variant-option[data-variant]')];
function setVariant(value){
 if(!palette[value])return;
 pageBlank=false;document.documentElement.dataset.editorPlateVariant=value;
 // Primera vista de la tercera variante: ejemplo sin reemplazar contenido editado.
 if(['quote','quote-blue'].includes(value)&&el('headline').value==='Una artista sorprendió con un *anuncio inesperado* y emocionó a sus seguidores'){
  el('headline').value='ESTOY VIVIENDO UNA ETAPA LLENA DE *NUEVOS DESAFÍOS*';
  el('quoteAuthor').value='Una artista invitada';
 }
 el('theme').value=value;
 el('photoLayoutOptions').dataset.variant=value;
 variantButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.variant===value)));
 const isQuote=['quote','quote-blue'].includes(value);
 // La distribución compartida solo existe para las variantes 1 y 2.
 // En 3 y 4 vuelve el módulo original de una fotografía y su preview completa.
 el('photoLayoutOptions').closest('.ds-photo-layout-group').hidden=isQuote;
 el('quotePhotoBody').closest('.ds-quote-photo-group').hidden=!isQuote;
 // El mismo input original cambia de contenedor: conserva estilos y listeners.
 const singleUpload=el('singlePhotoField');
 const destination=el(isQuote?'quotePhotoBody':'photoUploadArea');
 if(singleUpload.parentElement!==destination){
  if(isQuote)destination.appendChild(singleUpload);
  else destination.insertBefore(singleUpload,el('splitPhotoFields'));
 }
 if(isQuote&&photoLayout!=='single')setPhotoLayout('single');
 el('quoteAuthorField').hidden=!isQuote;
 const authorToggleField=el('quoteAuthorToggleField');
 if(authorToggleField)authorToggleField.hidden=!isQuote;
 document.querySelectorAll('.ds-footer-style-field').forEach(field=>field.hidden=isQuote);
 el('quoteAuthorInputField').hidden=!el('showQuoteAuthor').checked;
 // Importar noticias no corresponde a las variantes de cita 3 y 4.
 // Ocultar la tarjeta completa, nunca dejar una cabecera con cuerpo vacío.
 const importGroup=el('articleImportField').closest('.ds-import-group');
 importGroup.hidden=isQuote;
 el('articleImportField').hidden=isQuote;
 el('photoStage').classList.toggle('is-quote-variant',isQuote);
 photoHover=false;
 render();
}
variantButtons.forEach(button=>button.addEventListener('click',()=>setVariant(button.dataset.variant)));
el('theme').addEventListener('change',render);
// Posición exacta de los dos botones amarillos en coordenadas del canvas.
// No dependen de hover, carga fotográfica ni cambios de pestaña.
function updatePreviewHitOverlays(){
 const logoHit=document.getElementById('dsLogoHitButton');
 const textHit=document.getElementById('dsHeadlineHitButton');
 if(!logoHit||!textHit)return;
 function place(node,l,t,r,b){
  node.style.left=(Math.max(0,l)/W*100)+'%';
  node.style.top=(Math.max(0,t)/H*100)+'%';
  node.style.width=(Math.min(W,r)-Math.max(0,l))/W*100+'%';
  node.style.height=(Math.min(H,b)-Math.max(0,t))/H*100+'%';
 }
 const logoX=logoPosition==='left'?LOGO_MARGIN:W-LOGO_MARGIN-LOGO_WIDTH;
 const halo=54;
 place(logoHit,logoX-halo,LOGO_MARGIN-halo,logoX+LOGO_WIDTH+halo,LOGO_MARGIN+LOGO_HEIGHT+halo);
 logoHit.setAttribute('aria-label','Editar Identidad gráfica y logo Diario Show');
 const regions=headlineHitRegions;
 const l=regions.length?Math.min(...regions.map(x=>x.left)):80;
 const r=regions.length?Math.max(...regions.map(x=>x.right)):W-80;
 const t=regions.length?Math.min(...regions.map(x=>x.top)):H-420;
 const b=regions.length?Math.max(...regions.map(x=>x.bottom)):H-200;
 place(textHit,Math.max(0,l-12),Math.max(0,t-10),Math.min(W,r+12),Math.min(H,b+10));
}
function updatePhotoStage(){
 const stage=el('photoStage'),zone=el('photoDropzone');if(!stage||!zone)return;
 const split=photoLayout==='split';
 stage.classList.toggle('split-mode',split);
 stage.style.setProperty('--photo-height',(photoBottom/H*100)+'%');
 const scale=stage.getBoundingClientRect().width/W;
 stage.style.setProperty('--hover-inset',(50*scale)+'px');
 stage.style.setProperty('--hover-radius',(16*scale)+'px');
 zone.hidden=split||Boolean(image)||importingArticle;
 const splitZone=el('splitPhotoZones');
 splitZone.hidden=!split;
 for(const side of ['left','right']){
  const node=splitZone.querySelector('[data-side="'+side+'"]');
  node.classList.toggle('has-photo',Boolean(splitPhotos[side].image));
  node.classList.toggle('is-active',activePhotoSide===side);
  node.setAttribute('aria-pressed',String(activePhotoSide===side));
 }
 canvas.style.cursor=split?(activePhoto().image?'grab':'default'):(image?'grab':'default');
}
window.addEventListener('resize',updatePhotoStage);
function loadPhoto(file,side=photoLayout==='split'?activePhotoSide:null){
 if(!file)return;
 if(!file.type.startsWith('image/')){el('status').textContent='Seleccioná un archivo de imagen válido.';return}
 const target=side?splitPhotos[side]:null;
 const revision=++photoRevision;
 if(target)target.revision=revision;
 const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{
  if(target){
   if(target.revision===revision){target.image=img;target.zoom=1;target.x=0;target.y=0;setPhotoSide(side);render()}
  }else if(revision===photoRevision){image=img;zoom=1;offsetX=0;offsetY=0;render()}
  URL.revokeObjectURL(url);
 };
 img.onerror=()=>{el('status').textContent='No se pudo abrir esta fotografía';URL.revokeObjectURL(url)};
 img.src=url;
}
// Mantener el campo punteado sincronizado con los archivos cargados.
function updatePhotoPicker(id,filename){
 const picker=el(id).closest('.ds-photo-picker');
 if(!picker)return;
 picker.classList.toggle('has-photo',Boolean(filename));
 picker.querySelector('.ds-photo-picker-action').textContent=filename?'Cambiar':'Seleccioná';
 const defaultCaption=id==='fileLeft'?'una foto izquierda':id==='fileRight'?'una foto derecha':'una fotografía';
 picker.querySelector('.ds-photo-picker-caption').textContent=filename?filename:defaultCaption;
 picker.querySelector('.ds-photo-picker-clickable').title=filename||'Seleccioná '+defaultCaption;
}
for(const id of ['file','fileLeft','fileRight']){
 const input=el(id),picker=input.closest('.ds-photo-picker');
 if(!picker)continue;
 picker.addEventListener('dragenter',event=>{event.preventDefault();picker.classList.add('is-drag-over')});
 picker.addEventListener('dragover',event=>{event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='copy';picker.classList.add('is-drag-over')});
 picker.addEventListener('dragleave',event=>{if(!picker.contains(event.relatedTarget))picker.classList.remove('is-drag-over')});
 picker.addEventListener('drop',event=>{
  event.preventDefault();picker.classList.remove('is-drag-over');
  const file=[...event.dataTransfer.files].find(file=>file.type.startsWith('image/'));
  if(!file)return;
  loadPhoto(file,id==='fileLeft'?'left':id==='fileRight'?'right':null);
  updatePhotoPicker(id,file.name);
 });
}

el('file').addEventListener('change',event=>{const file=event.target.files[0];if(file){loadPhoto(file,null);updatePhotoPicker('file',file.name)}event.target.value=''});
for(const [id,side] of [['fileLeft','left'],['fileRight','right']]){
 el(id).addEventListener('change',event=>{const file=event.target.files[0];if(file){loadPhoto(file,side);updatePhotoPicker(id,file.name)}event.target.value=''});
}
for(const zone of el('splitPhotoZones').querySelectorAll('[data-side]')){
 const side=zone.dataset.side;
 zone.addEventListener('pointerenter',()=>{if(photoLayout==='split'){zone.classList.add('is-hovered');photoStage.classList.toggle('hover-left',side==='left');photoStage.classList.toggle('hover-right',side==='right')}});
 zone.addEventListener('pointerleave',()=>{zone.classList.remove('is-hovered');photoStage.classList.remove('hover-left','hover-right')});
 zone.addEventListener('click',()=>{setPhotoSide(side);if(!splitPhotos[side].image)el(side==='left'?'fileLeft':'fileRight').click()});
 zone.addEventListener('dblclick',()=>{setPhotoSide(side);el(side==='left'?'fileLeft':'fileRight').click()});
 zone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setPhotoSide(side);el(side==='left'?'fileLeft':'fileRight').click()}});
}
const photoStage=el('photoStage'),photoZone=el('photoDropzone');
const supportsPointerHover=window.matchMedia('(hover:hover) and (pointer:fine)');
function setPhotoHover(active){
 const next=Boolean(active&&supportsPointerHover.matches&&!image&&!importingArticle&&['quote','quote-blue'].includes(el('theme').value));
 if(photoHover===next)return;
 photoHover=next;
 render();
}
photoZone.addEventListener('pointerenter',()=>setPhotoHover(true));
photoZone.addEventListener('pointerleave',()=>setPhotoHover(false));
photoZone.addEventListener('focus',()=>setPhotoHover(true));
photoZone.addEventListener('blur',()=>setPhotoHover(false));
photoZone.addEventListener('click',()=>el('file').click());
photoZone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();el('file').click()}});
function isImageDrag(event){
 const dt=event.dataTransfer;
 return Boolean(dt&&([...dt.types].includes('Files')||[...dt.items||[]].some(item=>item.kind==='file'&&item.type.startsWith('image/'))));
}
function isOverPhoto(event){
 const r=photoStage.getBoundingClientRect();
 return event.clientY>=r.top&&event.clientY<=r.top+r.height*(photoBottom/H);
}
photoStage.addEventListener('dragenter',event=>{
 if(isImageDrag(event)&&isOverPhoto(event)){event.preventDefault();photoStage.classList.add('is-drag-over')}
});
photoStage.addEventListener('dragover',event=>{
 if(isImageDrag(event)&&isOverPhoto(event)){event.preventDefault();event.dataTransfer.dropEffect='copy';photoStage.classList.add('is-drag-over')}
 else photoStage.classList.remove('is-drag-over');
});
photoStage.addEventListener('dragleave',event=>{
 if(!photoStage.contains(event.relatedTarget))photoStage.classList.remove('is-drag-over');
});
photoStage.addEventListener('drop',event=>{
 photoStage.classList.remove('is-drag-over');
 if(!isImageDrag(event)||!isOverPhoto(event))return;
 event.preventDefault();
 if(photoLayout==='split'){const r=photoStage.getBoundingClientRect();const side=event.clientX<r.left+r.width/2?'left':'right';setPhotoSide(side);loadPhoto([...event.dataTransfer.files].find(file=>file.type.startsWith('image/'))||event.dataTransfer.files[0],side)}else loadPhoto([...event.dataTransfer.files].find(file=>file.type.startsWith('image/'))||event.dataTransfer.files[0],null);
});
el('photoZoom').addEventListener('input',event=>{if(photoLayout==='split')activePhoto().zoom=Number(event.target.value)/100;else zoom=Number(event.target.value)/100;render()});
// Los botones visibles del logo y del titular viven SOBRE el canvas.
 // El gesto sobre fotografía permanece exclusivamente en el canvas.
 canvas.addEventListener('pointerdown',event=>{
  const r=canvas.getBoundingClientRect();
  if((event.clientY-r.top)*H/r.height>photoBottom)return;
  if(photoLayout==='split'){
   const side=event.clientX<r.left+r.width/2?'left':'right';setPhotoSide(side);
   if(!activePhoto().image)return;
  }else if(!image)return;
  dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);
 });
 canvas.addEventListener('pointermove',event=>{
  if(photoLayout==='split'){
   const r=canvas.getBoundingClientRect();
   const x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;
   const hovering=y>=0&&y<photoBottom/H&&x>=0&&x<=1;
   photoStage.classList.toggle('hover-left',hovering&&x<.5);
   photoStage.classList.toggle('hover-right',hovering&&x>=.5);
  }
  if(!dragging)return;
  const ratio=W/canvas.getBoundingClientRect().width;
  if(photoLayout==='split'){activePhoto().x+=(event.clientX-lastX)*ratio;activePhoto().y+=(event.clientY-lastY)*ratio}
  else{offsetX+=(event.clientX-lastX)*ratio;offsetY+=(event.clientY-lastY)*ratio}
  lastX=event.clientX;lastY=event.clientY;render();
 });
 canvas.addEventListener('pointerleave',()=>photoStage.classList.remove('hover-left','hover-right'));
 canvas.addEventListener('pointerup',()=>{dragging=false});
 canvas.addEventListener('pointercancel',()=>{dragging=false});
el('clearAll').addEventListener('click',()=>{
 el('articleUrl').value='';el('headline').value='Una artista sorprendió con un *anuncio inesperado* y emocionó a sus seguidores';el('quoteAuthor').value='Una artista invitada';el('showQuoteAuthor').checked=true;el('quoteAuthorInputField').hidden=false;el('file').value='';for(const id of ['file','fileLeft','fileRight']){el(id).value='';updatePhotoPicker(id,null)}
 selectedTexture='1';halftone=halftoneAssets['1']||null;document.querySelectorAll('.texture-option').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.texture==='1')));
 setVariant('pink');
 forceUppercase=false;syncUppercaseUI();
 el('size').value='70';syncSizeSliderTrack();el('dots').value='5';textAlignment='center';
 el('alignLeft').setAttribute('aria-pressed','false');el('alignCenter').setAttribute('aria-pressed','true');
 photoRevision++;image=null;zoom=1;offsetX=0;offsetY=0;for(const p of Object.values(splitPhotos)){p.image=null;p.zoom=1;p.x=0;p.y=0;p.revision=photoRevision}setPhotoLayout('single');dragging=false;photoHover=false;selectedLogo='primary';logoPosition='right';syncLogoChoices();syncLogoPosition();photoStage.classList.remove('is-drag-over');
 el('importStatus').textContent='Pegá una URL de Diario Show.';
 render();
});
el('download').addEventListener('click',()=>{
 const button=el('download');
 button.disabled=true;
 try{
  render(false);
  canvas.toBlob(blob=>{
   render();
   button.disabled=false;
   if(!blob){el('status').textContent='No se pudo generar el PNG. Probá cargar la fotografía manualmente.';return}
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='Diario-Show-posteo.png';document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
   el('status').textContent='PNG listo para descargar · 1080 × 1440 px';
  },'image/png');
 }catch(error){
  button.disabled=false;
  console.error('Error al exportar PNG:',error);
  el('status').textContent=error.name==='SecurityError'?'La fotografía importada bloquea la exportación. Volvé a importar la URL o cargá la foto manualmente.':'No se pudo exportar: '+error.message;
 }
});
// Tooltips: ajustar ancho dentro del panel; hover, teclado, toque y Escape.
function sizeHelpTooltips(){
 document.querySelectorAll('.help-trigger').forEach(trigger=>{
  const bubble=trigger.querySelector('.help-tooltip'),button=trigger.querySelector('.help-button');
  if(!bubble||!button)return;
  const rect=button.getBoundingClientRect(),panel=trigger.closest('.editor-panel')?.getBoundingClientRect();
  const margin=16,gap=12,preferred=240;
  const rightEdge=Math.min(window.innerWidth-margin,(panel?.right??window.innerWidth)-margin);
  const leftEdge=Math.max(margin,(panel?.left??0)+margin);
  const rightSpace=rightEdge-rect.right-gap,leftSpace=rect.left-leftEdge-gap;
  const useLeft=rightSpace<preferred&&leftSpace>rightSpace;
  const available=Math.max(160,useLeft?leftSpace:rightSpace);
  const width=Math.min(260,Math.max(160,Math.min(preferred,available)));
  bubble.style.width=width+'px';bubble.style.maxWidth='calc(100vw - 32px)';
  bubble.style.left=useLeft?'auto':'calc(100% + 12px)';
  bubble.style.right=useLeft?'calc(100% + 12px)':'auto';
  bubble.classList.toggle('is-left',useLeft);
  bubble.style.top='50%';bubble.style.transform='translateY(-50%)';
  const size=bubble.getBoundingClientRect();
  const offset=size.top<margin?margin-size.top:size.bottom>window.innerHeight-margin?window.innerHeight-margin-size.bottom:0;
  if(offset)bubble.style.transform='translateY(calc(-50% + '+Math.round(offset)+'px))';
 });
}
window.addEventListener('resize',sizeHelpTooltips);
document.querySelectorAll('.help-trigger').forEach(trigger=>{
 trigger.addEventListener('pointerenter',sizeHelpTooltips);
 trigger.addEventListener('focusin',sizeHelpTooltips);
 const button=trigger.querySelector('.help-button');
 button.addEventListener('click',event=>{
  event.stopPropagation();
  const open=!trigger.classList.contains('is-open');
  document.querySelectorAll('.help-trigger').forEach(other=>{
   other.classList.remove('is-open');other.querySelector('.help-button').setAttribute('aria-expanded','false');
  });
  trigger.classList.toggle('is-open',open);
  button.setAttribute('aria-expanded',String(open));
 });
});
function closeHelpTooltips(){
 document.querySelectorAll('.help-trigger.is-open').forEach(trigger=>{
  trigger.classList.remove('is-open');
  trigger.querySelector('.help-button').setAttribute('aria-expanded','false');
 });
}
document.addEventListener('click',event=>{if(!event.target.closest('.help-trigger'))closeHelpTooltips()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeHelpTooltips()});
sizeHelpTooltips();
// Textos en la vista previa: una copia visual, un único estado editorial.
// El módulo original permanece intacto y todas las acciones editan sus controles.
const mobileTextHost=el('dsMobileTextEditor');
const originalTextModule=document.querySelector('#dsMobileControlsPanel .ds-texts-group');
const mobileTextModule=originalTextModule.cloneNode(true);
mobileTextModule.querySelectorAll('[id]').forEach(node=>node.id+='Mobile');
mobileTextModule.querySelectorAll('[for]').forEach(node=>node.setAttribute('for',node.getAttribute('for')+'Mobile'));
mobileTextModule.querySelectorAll('[aria-controls]').forEach(node=>node.setAttribute('aria-controls',node.getAttribute('aria-controls')+'Mobile'));
mobileTextHost.appendChild(mobileTextModule);
// En Vista previa Textos permanece desplegado por defecto y puede contraerse.
// La copia de Formato conserva su estado y comportamiento independiente.
const mobileTextToggle=mobileTextModule.querySelector('.ds-control-card-toggle');
mobileTextToggle.setAttribute('aria-expanded','true');
mobileTextModule.querySelector('#ds-texts-group-bodyMobile').hidden=false;
const mirrorId=id=>el(id+'Mobile');
function syncMobileTextEditor(){
 if(!document.querySelector('#dsMobileTextEditor .ds-texts-group'))return;
 for(const id of ['headline','quoteAuthor']){
  const source=el(id),mirror=mirrorId(id);
  if(document.activeElement!==mirror&&mirror.value!==source.value)mirror.value=source.value;
 }
 for(const id of ['size']){
  const source=el(id),mirror=mirrorId(id);
  if(document.activeElement!==mirror&&mirror.value!==source.value)mirror.value=source.value;
  mirror.style.setProperty('--ds-size-progress',source.style.getPropertyValue('--ds-size-progress'));
  mirrorId('sizeLabel').textContent=el('sizeLabel').textContent;
 }
 mirrorId('headline').classList.toggle('uppercase-preview',el('headline').classList.contains('uppercase-preview'));
 const mirroredAuthorSwitch=mirrorId('showQuoteAuthor');
 if(mirroredAuthorSwitch)mirroredAuthorSwitch.checked=el('showQuoteAuthor').checked;
 mirrorId('quoteAuthorField').hidden=el('quoteAuthorField').hidden;
 mirrorId('quoteAuthorInputField').hidden=el('quoteAuthorInputField').hidden;
 for(const id of ['alignLeft','alignCenter','formatUppercase']){
  mirrorId(id).setAttribute('aria-pressed',el(id).getAttribute('aria-pressed'));
 }
}
for(const id of ['headline','quoteAuthor']){
 mirrorId(id).addEventListener('input',event=>{
  const source=el(id);source.value=event.target.value;
  source.dispatchEvent(new Event('input',{bubbles:true}));
 });
}
mirrorId('showQuoteAuthor')?.addEventListener('change',event=>{
 const source=el('showQuoteAuthor');source.checked=event.target.checked;
 source.dispatchEvent(new Event('change',{bubbles:true}));
 syncMobileTextEditor();
});
for(const id of ['alignLeft','alignCenter','formatUppercase']){
 mirrorId(id).addEventListener('click',()=>{
  el(id).dispatchEvent(new MouseEvent('click',{bubbles:true}));
  syncMobileTextEditor();
 });
}
for(const id of ['formatAccent','formatItalic','formatStrike','formatClear']){
 const button=mirrorId(id);
 button.addEventListener('mousedown',event=>event.preventDefault());
 button.addEventListener('click',()=>{
  const original=el('headline'),mirror=mirrorId('headline');
  original.value=mirror.value;
  const start=mirror.selectionStart,end=mirror.selectionEnd;
  original.setSelectionRange(start,end);
  el(id).dispatchEvent(new MouseEvent('click',{bubbles:true}));
  syncMobileTextEditor();
  mirror.value=original.value;
  mirror.setSelectionRange(original.selectionStart,original.selectionEnd);
  mirror.focus({preventScroll:true});
 });
}
const mirrorSize=mirrorId('size'),mirrorSizeBox=mirrorSize.closest('.ds-inline-type-size');
function updateMirrorSizeState(active){
 mirrorSizeBox.classList.toggle('is-adjusting',active);
}
mirrorSize.addEventListener('input',()=>{
 const original=el('size');
 original.value=mirrorSize.value;
 original.dispatchEvent(new Event('input',{bubbles:true}));
 mirrorId('sizeLabel').textContent=mirrorSize.value;
 if(mirrorSizeBox.classList.contains('is-adjusting')&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const label=mirrorId('sizeLabel');
  label.getAnimations().forEach(animation=>animation.cancel());
  label.animate([{transform:'translateY(0) scale(1.22)'},{transform:'translateY(-3px) scale(1.29)'},{transform:'translateY(0) scale(1.22)'}],{duration:155,easing:'ease-out'});
 }
});
let mirrorThumbHeld=null;
function mirrorThumbHit(event){
 const rect=mirrorSize.getBoundingClientRect(),min=Number(mirrorSize.min),max=Number(mirrorSize.max);
 const t=max>min?(Number(mirrorSize.value)-min)/(max-min):0;
 const x=rect.left+7.5+t*Math.max(0,rect.width-15),y=rect.top+rect.height/2;
 return Math.abs(event.clientX-x)<=10.5&&Math.abs(event.clientY-y)<=11.5;
}
mirrorSize.addEventListener('pointermove',event=>{
 if(mirrorThumbHeld!==null)return;
 mirrorSizeBox.classList.toggle('is-thumb-hover',mirrorThumbHit(event));
});
mirrorSize.addEventListener('pointerleave',()=>{if(mirrorThumbHeld===null)mirrorSizeBox.classList.remove('is-thumb-hover')});
mirrorSize.addEventListener('pointerdown',event=>{
 updateMirrorSizeState(true);
 const onThumb=mirrorThumbHit(event);
 mirrorThumbHeld=onThumb?event.pointerId:null;
 mirrorSizeBox.classList.toggle('is-thumb-hover',onThumb);
 mirrorSizeBox.classList.toggle('is-thumb-engaged',onThumb);
});
function stopMirrorSize(){
 updateMirrorSizeState(false);mirrorThumbHeld=null;
 mirrorSizeBox.classList.remove('is-thumb-hover','is-thumb-engaged');
}
window.addEventListener('pointerup',stopMirrorSize);
window.addEventListener('pointercancel',stopMirrorSize);
mirrorSize.addEventListener('blur',stopMirrorSize);
mirrorSize.addEventListener('keydown',event=>{
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key))updateMirrorSizeState(true);
});
mirrorSize.addEventListener('keyup',()=>updateMirrorSizeState(false));
const mobileTextAccordion=mobileTextModule.querySelector('.ds-control-card-toggle');
mobileTextAccordion.addEventListener('click',()=>{
 const body=mirrorId('ds-texts-group-body'),expanded=mobileTextAccordion.getAttribute('aria-expanded')!=='true';
 mobileTextAccordion.setAttribute('aria-expanded',String(expanded));
 body.hidden=!expanded;
 requestAnimationFrame(updateMobileSlideHeight);
});
mobileTextModule.querySelectorAll('.help-trigger').forEach(trigger=>{
 const button=trigger.querySelector('.help-button');
 trigger.addEventListener('pointerenter',sizeHelpTooltips);
 trigger.addEventListener('focusin',sizeHelpTooltips);
 button.addEventListener('click',event=>{
  event.stopPropagation();
  const open=!trigger.classList.contains('is-open');
  document.querySelectorAll('.help-trigger').forEach(other=>{
   other.classList.remove('is-open');
   other.querySelector('.help-button').setAttribute('aria-expanded','false');
  });
  trigger.classList.toggle('is-open',open);
  button.setAttribute('aria-expanded',String(open));
 });
});
syncMobileTextEditor();

// Zoom de fotografía mobile: misma pista, thumb y microanimación que tamaño.
const mobileZoom=el('photoZoom'),mobileZoomBox=mobileZoom.closest('.preview-zoom');
let zoomThumbHeld=null,zoomValueBounce;
function mobileZoomHit(event){
 const rect=mobileZoom.getBoundingClientRect(),min=Number(mobileZoom.min),max=Number(mobileZoom.max);
 const t=max>min?(Number(mobileZoom.value)-min)/(max-min):0;
 // Mobile: valor mínimo abajo, máximo arriba. Desktop conserva el rango horizontal.
 const vertical=zoomControl.parentElement===el('photoStage');
 const x=vertical?rect.left+rect.width/2:rect.left+7.5+t*Math.max(0,rect.width-15);
 const y=vertical?rect.bottom-7.5-t*Math.max(0,rect.height-15):rect.top+rect.height/2;
 return Math.abs(event.clientX-x)<=10.5&&Math.abs(event.clientY-y)<=11.5;
}
mobileZoom.addEventListener('pointermove',event=>{
 if(zoomThumbHeld!==null)return;
 mobileZoomBox.classList.toggle('is-thumb-hover',mobileZoomHit(event));
});
mobileZoom.addEventListener('pointerleave',()=>{if(zoomThumbHeld===null)mobileZoomBox.classList.remove('is-thumb-hover')});
mobileZoom.addEventListener('pointerdown',event=>{
 mobileZoomBox.classList.add('is-adjusting');
 const onThumb=mobileZoomHit(event);
 zoomThumbHeld=onThumb?event.pointerId:null;
 mobileZoomBox.classList.toggle('is-thumb-hover',onThumb);
 mobileZoomBox.classList.toggle('is-thumb-engaged',onThumb);
});
function stopMobileZoom(){
 zoomThumbHeld=null;mobileZoomBox.classList.remove('is-adjusting','is-thumb-hover','is-thumb-engaged');
}
window.addEventListener('pointerup',stopMobileZoom);
window.addEventListener('pointercancel',stopMobileZoom);
mobileZoom.addEventListener('blur',stopMobileZoom);
mobileZoom.addEventListener('keydown',event=>{
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key))mobileZoomBox.classList.add('is-adjusting');
});
mobileZoom.addEventListener('keyup',()=>mobileZoomBox.classList.remove('is-adjusting'));
mobileZoom.addEventListener('input',()=>{
 if(!mobileZoomBox.classList.contains('is-adjusting')||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const label=el('zoomLabel');
 zoomValueBounce?.cancel();
 zoomValueBounce=label.animate([
  {transform:'translateY(0) scale(1.22)'},
  {transform:'translateY(-3px) scale(1.29)'},
  {transform:'translateY(0) scale(1.22)'}
 ],{duration:155,easing:'ease-out'});
});

// Edición directa del titular. Sin portales, sin focos repetidos y sin
// alterar el tamaño del teclado o los paddings del documento.
function openMobileHeadlineEditor(){
 // El primer toque sobre el titular solo muestra Textos y baja hasta el módulo.
 // El textarea se enfoca recién cuando el usuario toca el campo para editar.
 setPreviewContext('text');
 const accordion=mobileTextModule.querySelector('.ds-control-card-toggle');
 const body=mirrorId('ds-texts-group-body');
 accordion.setAttribute('aria-expanded','true');
 body.hidden=false;
 syncMobileTextEditor();
 scrollToPreviewContext('text');
}
// Módulo Contenido reflejado en Vista previa. Conserva los handlers originales
// mediante proxy, mientras el módulo fuente sigue siempre disponible en Formato.
const previewContentHost=document.createElement('div');
previewContentHost.id='dsMobileContentEditor';
previewContentHost.className='ds-mobile-content-editor editor-panel';
previewContentHost.hidden=true;
previewContentHost.setAttribute('aria-label','Diseño de placas de la placa');
const sourceContent=document.querySelector('#dsMobileControlsPanel .ds-plate-design-group');
const previewContentCard=sourceContent.cloneNode(true);
previewContentCard.querySelectorAll('[id]').forEach(node=>node.id+='Preview');
previewContentCard.querySelectorAll('[for]').forEach(node=>node.setAttribute('for',node.getAttribute('for')+'Preview'));
previewContentCard.querySelectorAll('[aria-controls]').forEach(node=>node.setAttribute('aria-controls',node.getAttribute('aria-controls')+'Preview'));
previewContentHost.appendChild(previewContentCard);
mobileTextHost.after(previewContentHost);
const previewContentToggle=previewContentCard.querySelector('.ds-control-card-toggle');
const previewContentBody=previewContentCard.querySelector('.ds-control-card-body');
previewContentToggle.addEventListener('click',()=>{
 const expanded=previewContentToggle.getAttribute('aria-expanded')!=='true';
 previewContentToggle.setAttribute('aria-expanded',String(expanded));
 previewContentBody.hidden=!expanded;
 requestAnimationFrame(updateMobileSlideHeight);
});
previewContentCard.addEventListener('click',event=>{
 const choice=event.target.closest('[data-logo],[data-logo-position],[data-footer-style],[data-variant]');
 if(choice){
  const source=choice.dataset.logo!==undefined?
   sourceContent.querySelector('[data-logo="'+choice.dataset.logo+'"]'):
   choice.dataset.logoPosition!==undefined?
   sourceContent.querySelector('[data-logo-position="'+choice.dataset.logoPosition+'"]'):
   choice.dataset.variant!==undefined?
   sourceContent.querySelector('[data-variant="'+choice.dataset.variant+'"]'):
   sourceContent.querySelector('[data-footer-style="'+choice.dataset.footerStyle+'"]');
  source?.click();syncPreviewContentEditor();
  return;
 }

});
function syncPreviewContentEditor(){
 if(!previewContentHost.isConnected)return;
 for(const button of previewContentCard.querySelectorAll('[data-logo],[data-logo-position],[data-footer-style],[data-variant]')){
  const selector=button.dataset.logo!==undefined?
   '[data-logo="'+button.dataset.logo+'"]':button.dataset.logoPosition!==undefined?
   '[data-logo-position="'+button.dataset.logoPosition+'"]':button.dataset.variant!==undefined?
   '[data-variant="'+button.dataset.variant+'"]':'[data-footer-style="'+button.dataset.footerStyle+'"]';
  const source=sourceContent.querySelector(selector);
  if(source)button.setAttribute('aria-pressed',source.getAttribute('aria-pressed'));
 }

}
// Desplazar hasta el pie DESPUÉS de actualizar el alto del carrusel móvil.
// El contenido contextual permanece en el DOM, sin enfocar ni seleccionar texto.
// Un único pulso fucsia para todos los módulos del editor.
// Cada despliegue cambia el destino, incluso cuando se abre desde el panel
// lateral; el resaltado dura solo su animación y vuelve al gris normal.
function flashContextCard(card){
 if(!card)return;
 document.querySelectorAll('.ds-control-card.is-preview-context-target').forEach(node=>{
  node.classList.remove('is-preview-context-target');
  node.getAnimations().forEach(animation=>animation.cancel());
 });
 void card.offsetWidth;
 card.classList.add('is-preview-context-target');
}
function flashPreviewContextCard(context){
 flashContextCard(mobileTabViewport.matches
  ?(context==='logo'?previewContentCard:mobileTextModule)
  :(context==='logo'?sourceContent:originalTextModule));
}
function markDesktopContext(context){
 if(!mobileTabViewport.matches)flashPreviewContextCard(context);
}
// El pulso se activa al ABRIR y al CERRAR: el listener de cada
// acordeón ya actualizó aria-expanded cuando llega el evento delegado.
// Mantener fijo el borde evita desplazamientos del contenido.
document.addEventListener('click',event=>{
 const toggle=event.target.closest?.('.ds-control-card-toggle');
 if(!toggle)return;
 const card=toggle.closest('.ds-control-card');
 if(!card)return;
 flashContextCard(card);
});
function scrollToPreviewContext(context){
 const target=mobileTabViewport.matches
  ?(context==='logo'?previewContentHost:mobileTextHost)
  :(context==='logo'?sourceContent:originalTextModule);
 if(!target||target.hidden)return;
 // Centrar el módulo activo en el viewport, no forzar scroll hasta el pie.
 // El alto del slider mobile se sincroniza antes de medir el módulo.
 const center=()=>{
  const rect=target.getBoundingClientRect();
  const intended=window.scrollY+rect.top+rect.height/2-window.innerHeight/2;
  const limit=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
  window.scrollTo({top:Math.max(0,Math.min(limit,intended)),behavior:'instant'});
 };
 requestAnimationFrame(()=>{
  updateMobileSlideHeight();
  requestAnimationFrame(()=>{
   center();
   requestAnimationFrame(center);
  });
 });
 // El viewport móvil anima su altura durante 240 ms. Al finalizar,
 // volver a centrar en función del tamaño definitivo, sin activar inputs.
 if(mobileTabViewport.matches)window.setTimeout(()=>{
  if(mobileTabMain.dataset.previewContext===context)center();
 },300);
}
// El área inferior de Vista previa funciona como un SOLO módulo contextual.
// Únicamente los botones visibles sobre el logo y el titular cambian su contenido;
// abrir/cerrar un acordeón o cambiar de pestaña no altera la selección.
let selectedPreviewContext='text';
function setPreviewContext(next){
 if(next!=='logo'&&next!=='text')return;
 // Solo las dos zonas activas cambian el contexto. Se conservan ambos
 // módulos montados; hidden controla cuál ocupa el único espacio inferior.
 selectedPreviewContext=next;
 const isText=next==='text';
 if(!isText&&mobileTextHost.contains(document.activeElement)){
  // Soltar foco antes de ocultar el input, sin trasladar el editor ni el teclado.
  document.activeElement.blur();
 }
 mobileTextHost.hidden=!isText;
 previewContentHost.hidden=isText;
 mobileTextHost.classList.toggle('is-selected-preview-module',isText);
 previewContentHost.classList.toggle('is-selected-preview-module',!isText);
 // Evitar estados inert persistentes que impiden volver a pulsar Textos.
 mobileTextHost.inert=false;
 previewContentHost.inert=false;
 mobileTextHost.setAttribute('aria-hidden',String(!isText));
 previewContentHost.setAttribute('aria-hidden',String(isText));
 mobileTabMain.dataset.previewContext=next;
 // La selección visual de la placa solo cambia por clic en sus zonas.
 updateMobileSlideHeight();
}
function showMobileContentEditor(){
 if(!mobileTabViewport.matches){
  const accordion=sourceContent.querySelector('.ds-control-card-toggle');
  const body=sourceContent.querySelector('.ds-control-card-body');
  accordion.setAttribute('aria-expanded','true');body.hidden=false;
  markDesktopContext('logo');
  scrollToPreviewContext('logo');
  return;
 }
 setPreviewContext('logo');
 previewContentToggle.setAttribute('aria-expanded','true');
 previewContentBody.hidden=false;
 syncPreviewContentEditor();
 scrollToPreviewContext('logo');
}
// Estado inicial: Textos abierto. El estado se aplica al montar las pestañas.
// Dos botones DOM permanentes, por encima de adjuntar fotos y del canvas.
const hitLayer=el('photoStage');
function makePreviewHit(id,label,handler,context){
 const button=document.createElement('button');
 button.type='button';button.id=id;button.className='ds-preview-hit-button';
 button.setAttribute('aria-label',label);button.title=label;
 let touchStart=null;
 button.addEventListener('pointerdown',event=>{
  event.stopPropagation();
  touchStart={id:event.pointerId,x:event.clientX,y:event.clientY,started:performance.now()};
 });
 button.addEventListener('pointermove',event=>{
  if(touchStart&&event.pointerId===touchStart.id&&
     Math.hypot(event.clientX-touchStart.x,event.clientY-touchStart.y)>9)touchStart=null;
 });
 button.addEventListener('pointercancel',event=>{touchStart=null;event.stopPropagation()});
 button.addEventListener('pointerup',event=>{
  event.stopPropagation();
  if(!touchStart||event.pointerId!==touchStart.id)return;
  const valid=Math.hypot(event.clientX-touchStart.x,event.clientY-touchStart.y)<=9
   &&performance.now()-touchStart.started<550;
  touchStart=null;
  // Actualizar el contexto con el tap; el click posterior desplaza al módulo,
  // sin abrir el teclado ni seleccionar el texto.
  if(valid&&mobileTabViewport.matches)setPreviewContext(context);
 });
 button.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  // Selección persistente SOLO sobre la placa, independiente del módulo
  // inferior. Un clic fuera de las dos zonas elimina el punteado.
  document.querySelectorAll('#photoStage>.ds-preview-hit-button').forEach(node=>{
   const selected=node===button;
   node.classList.toggle('is-hotspot-selected',selected);
   node.setAttribute('aria-pressed',String(selected));
  });
  handler();
  flashPreviewContextCard(context);
 });
 hitLayer.appendChild(button);
 return button;
}
makePreviewHit('dsLogoHitButton','Editar logo en Diseño de placas',showMobileContentEditor,'logo');
makePreviewHit('dsHeadlineHitButton','Editar Texto principal',()=>{
 if(mobileTabViewport.matches)openMobileHeadlineEditor();
 else{
  const accordion=originalTextModule.querySelector('.ds-control-card-toggle');
  const body=originalTextModule.querySelector('.ds-control-card-body');
  accordion.setAttribute('aria-expanded','true');body.hidden=false;
  markDesktopContext('text');
  scrollToPreviewContext('text');
 }
},'text');
updatePreviewHitOverlays();
// El punteado de la placa termina al tocar cualquier área que no sea
// una de sus dos zonas táctiles (incluido el fondo oscuro entre ellas).
document.addEventListener('pointerdown',event=>{
 if(event.target.closest?.('#photoStage>.ds-preview-hit-button'))return;
 document.querySelectorAll('#photoStage>.ds-preview-hit-button').forEach(button=>{
  button.classList.remove('is-hotspot-selected');
  button.setAttribute('aria-pressed','false');
 });
});

// En mobile el zoom se monta junto a la placa, no en la barra superior.
// Reubicar el mismo control (sin duplicarlo) conserva el valor y los listeners.
const zoomControl=el('dsPhotoZoomControl');
function positionMobilePhotoZoom(){
 // Una única instancia de Zoom, situada a la izquierda de la placa tanto
 // en escritorio como en mobile. La toolbar solo contiene el mensaje.
 if(zoomControl.parentElement!==el('photoStage'))el('photoStage').appendChild(zoomControl);
 mobileZoomBox.classList.remove('is-thumb-hover','is-thumb-engaged');
}
// Navegación mobile: paneles adyacentes desplazados como una sola superficie.
const mobileTabViewport=window.matchMedia('(max-width:700px)');
const mobileTabMain=document.querySelector('main');
const mobileSlideViewport=el('dsMobileViewport');
const mobileTabs=[
 {name:'preview',button:el('dsMobilePreviewTab'),panel:el('dsMobilePreviewPanel')},
 {name:'controls',button:el('dsMobileControlsTab'),panel:el('dsMobileControlsPanel')}
];
function updateMobileSlideHeight(){
 if(!mobileTabViewport.matches){
  mobileSlideViewport.style.height='';
  return;
 }
 const active=mobileTabs.find(tab=>tab.name===mobileTabMain.dataset.mobileTab)||mobileTabs[0];
 mobileSlideViewport.style.height=active.panel.offsetHeight+'px';
}
function selectMobileTab(name,focus=false){
 const active=mobileTabs.find(tab=>tab.name===name)||mobileTabs[0];
 mobileTabMain.dataset.mobileTab=active.name;
 mobileTabs.forEach(tab=>{
  const selected=tab===active;
  tab.button.setAttribute('aria-selected',String(selected));
  tab.button.tabIndex=selected?0:-1;
  if(mobileTabViewport.matches){
   tab.panel.setAttribute('role','tabpanel');
   tab.panel.inert=!selected;
  }else{
   tab.panel.removeAttribute('role');
   tab.panel.inert=false;
  }
 });
 if(focus)active.button.focus();
 // El canvas nunca se desmonta, y sigue dibujándose al editar.
 if(active.name==='preview'&&mobileTabViewport.matches){
  requestAnimationFrame(()=>{updatePhotoStage();render();updateMobileSlideHeight()});
 }else{
  requestAnimationFrame(updateMobileSlideHeight);
 }
}
mobileTabs.forEach((tab,index)=>{
 tab.button.addEventListener('click',()=>selectMobileTab(tab.name));
 tab.button.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?mobileTabs.length-1:
   (index+(event.key==='ArrowRight'?1:-1)+mobileTabs.length)%mobileTabs.length;
  selectMobileTab(mobileTabs[next].name,true);
 });
});
function syncMobileTabViewport(){
 positionMobilePhotoZoom();
 selectMobileTab(mobileTabMain.dataset.mobileTab||'preview');
 requestAnimationFrame(()=>{updatePhotoStage();updateMobileSlideHeight()});
}
mobileTabViewport.addEventListener('change',syncMobileTabViewport);
window.addEventListener('resize',updateMobileSlideHeight);
if(typeof ResizeObserver!=='undefined'){
 const slideResizeObserver=new ResizeObserver(updateMobileSlideHeight);
 mobileTabs.forEach(tab=>slideResizeObserver.observe(tab.panel));
}
syncMobileTabViewport();
setPreviewContext('text');
window.DiarioShowEditor={
 getPageState(){return {variant:pageBlank?'blank':el('theme').value,theme:el('theme').value,
 headline:el('headline').value,quoteAuthor:el('quoteAuthor').value,showQuoteAuthor:el('showQuoteAuthor').checked,
 size:el('size').value,dots:el('dots').value,alignment:textAlignment,uppercase:forceUppercase,
 image,zoom,offsetX,offsetY,photoLayout,activePhotoSide,
 splitPhotos:{left:{...splitPhotos.left},right:{...splitPhotos.right}},
 selectedLogo,logoPosition,footerStyle,selectedTexture};},
 setPageState(s){
  setVariant(s.theme||'pink');
  pageBlank=s.variant==='blank';document.documentElement.dataset.editorPlateVariant=s.variant;
  el('headline').value=s.headline||'';el('quoteAuthor').value=s.quoteAuthor||'';
  el('showQuoteAuthor').checked=Boolean(s.showQuoteAuthor);
  el('quoteAuthorInputField').hidden=!s.showQuoteAuthor;
  el('size').value=s.size||'70';el('dots').value=s.dots||'5';
  textAlignment=s.alignment||'center';
  el('alignLeft').setAttribute('aria-pressed',String(textAlignment==='left'));
  el('alignCenter').setAttribute('aria-pressed',String(textAlignment==='center'));
  forceUppercase=Boolean(s.uppercase);syncUppercaseUI();
  image=s.image||null;zoom=s.zoom||1;offsetX=s.offsetX||0;offsetY=s.offsetY||0;
  if(s.splitPhotos)for(const side of ['left','right'])Object.assign(splitPhotos[side],s.splitPhotos[side]);
  setPhotoLayout(s.photoLayout||'single');activePhotoSide=s.activePhotoSide||'left';
  selectedLogo=s.selectedLogo||'primary';syncLogoChoices();
  logoPosition=s.logoPosition||'right';syncLogoPosition();footerStyle=s.footerStyle||'center';
  document.querySelectorAll('[data-footer-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.footerStyle===footerStyle)));
  selectedTexture=s.selectedTexture||'1';halftone=halftoneAssets[selectedTexture]||null;
  document.querySelectorAll('.texture-option').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.texture===selectedTexture)));
  el('sizeLabel').textContent=el('size').value;el('dotsLabel').textContent=el('dots').value+'%';
  render();el('headline').dispatchEvent(new Event('input',{bubbles:true}));
 },
 setBlank(active){pageBlank=Boolean(active);document.documentElement.dataset.editorPlateVariant=pageBlank?'blank':el('theme').value;render();},
 setImporting(active){importingArticle=active;render()},getPhotoRevision(){return photoRevision},setImage(img){photoRevision++;if(photoLayout==='split'){const p=splitPhotos[activePhotoSide];p.image=img;p.zoom=1;p.x=0;p.y=0;p.revision=photoRevision}else{image=img;zoom=1;offsetX=0;offsetY=0}render()},refresh:render};render();document.fonts.ready.then(render);
})();