
(function(){
'use strict';
const el=id=>document.getElementById(id),canvas=el('art'),ctx=canvas.getContext('2d'),W=1080,H=1440;
let halftone=null;const halftoneLayer=document.createElement('canvas');halftoneLayer.width=1080;halftoneLayer.height=1236;const halftoneCtx=halftoneLayer.getContext('2d');let importingArticle=false;let photoRevision=0;let selectedTexture='1';const halftoneAssets={};function loadTexture(id,path){const asset=new Image();asset.onload=()=>{halftoneAssets[id]=asset;if(selectedTexture===id){halftone=asset;render()}};asset.onerror=()=>console.error('No se pudo cargar '+path);asset.src=path}loadTexture('1','../bae/halftone-editable.svg?v=2');loadTexture('2','../bae/halftone-2.svg?v=1');let textAlignment='center',forceUppercase=false;let image=null,zoom=1,offsetX=0,offsetY=0,dragging=false,lastX=0,lastY=0,photoBottom=820,photoHover=false;
const GRADIENT_BAR_HEIGHT=24;
const LOGO_MARGIN=80,LOGO_WIDTH=75*1.25*1.15,LOGO_HEIGHT=LOGO_WIDTH*275/253;
let selectedLogo='primary';
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
 ctx.drawImage(img,W-LOGO_MARGIN-LOGO_WIDTH,LOGO_MARGIN,LOGO_WIDTH,LOGO_HEIGHT);
}
function syncLogoChoices(){
 document.querySelectorAll('.logo-choice').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.logo===selectedLogo)));
}
document.querySelectorAll('.logo-choice').forEach(button=>button.addEventListener('click',()=>{
 selectedLogo=button.dataset.logo;syncLogoChoices();render();
}));
syncLogoChoices();
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
 if(image){
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
 ctx.fillText('diarioshow.com.ar',W/2,footerBaseline);
 ctx.textAlign='left';
 photoBottom=Math.max(180,Math.min(H,gradientTop));
 const overlay=el('importOverlay');if(overlay)overlay.style.height=(photoBottom/H*100)+'%';
 updatePhotoStage();
 el('dotsLabel').textContent=el('dots').value+'%';
 el('sizeLabel').textContent=size;
 el('zoomLabel').textContent=Math.round(zoom*100)+' %';
 el('photoZoom').value=Math.round(zoom*100);
 el('status').textContent=iconY<120?'Texto demasiado largo: reducí el tamaño.':'Vista previa activa · Arrastrá la foto para reencuadrarla.';
}

function render(includeHover=true){
try{
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
if(image){
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
 for(const part of line.parts){
  ctx.font=((line.quote||part.italic)?'italic ':'')+'700 '+size+'px "Poppins",Arial,sans-serif';
  ctx.textAlign='left';ctx.fillStyle=(line.quote||part.accent)?colors.accent:colors.text;
  ctx.fillText(part.text,x,baselines[i]);
  if(part.strike&&!line.quote){const y=baselines[i]-size*.32;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.max(2,size*.045);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+part.width,y);ctx.stroke()}
  x+=part.width;
 }
}
ctx.fillStyle=colors.text;ctx.font='500 30px "Inter",Arial,sans-serif';ctx.textAlign='center';ctx.fillText('diarioshow.com.ar',W/2,footerBaseline);ctx.textAlign='left';
const overlay=el('importOverlay');if(overlay){overlay.style.height=(photoBottom/H*100)+'%';}updatePhotoStage();el('dotsLabel').textContent=el('dots').value+'%';el('sizeLabel').textContent=size;el('zoomLabel').textContent=Math.round(zoom*100)+' %';el('photoZoom').value=Math.round(zoom*100);el('status').textContent=boxTop<=80?'Texto demasiado largo: reducí el tamaño.':'Vista previa activa · Arrastrá la foto para reencuadrarla.';
}catch(error){el('status').textContent='Error de vista previa: '+error.message;console.error(error)}
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
const variantButtons=[...document.querySelectorAll('.ds-variant-option')];
function setVariant(value){
 if(!palette[value])return;
 // Primera vista de la tercera variante: ejemplo sin reemplazar contenido editado.
 if(['quote','quote-blue'].includes(value)&&el('headline').value==='*Mauro Icardi* consiguió la *eximición de prisión* tras el escándalo con Wanda Nara'){
  el('headline').value='OJALÁ A LA GENTE LE DIERA TANTO MIEDO TENER UN HIJO GOLPEADOR COMO TENER UN HIJO GAY';
  el('quoteAuthor').value='La Joaqui';
 }
 el('theme').value=value;
 variantButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.variant===value)));
 const isQuote=['quote','quote-blue'].includes(value);
 el('quoteAuthorField').hidden=!isQuote;
 el('quoteAuthorInputField').hidden=!el('showQuoteAuthor').checked;
 el('articleImportField').hidden=isQuote;
 el('photoStage').classList.toggle('is-quote-variant',isQuote);
 photoHover=false;
 render();
}
variantButtons.forEach(button=>button.addEventListener('click',()=>setVariant(button.dataset.variant)));
el('theme').addEventListener('change',render);
function updatePhotoStage(){
 const stage=el('photoStage'),zone=el('photoDropzone');if(!stage||!zone)return;
 stage.style.setProperty('--photo-height',(photoBottom/H*100)+'%');
 const scale=stage.getBoundingClientRect().width/W;
 stage.style.setProperty('--hover-inset',(50*scale)+'px');
 stage.style.setProperty('--hover-radius',(16*scale)+'px');
 zone.hidden=Boolean(image)||importingArticle;
 canvas.style.cursor=image?'grab':'default';
}
window.addEventListener('resize',updatePhotoStage);
function loadPhoto(file){
 if(!file)return;
 if(!file.type.startsWith('image/')){el('status').textContent='Seleccioná un archivo de imagen válido.';return}
 // La selección más reciente tiene prioridad, incluso frente a otras cargas pendientes.
 const revision=++photoRevision;
 const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{
  if(revision===photoRevision){image=img;zoom=1;offsetX=0;offsetY=0;render()}
  URL.revokeObjectURL(url);
 };
 img.onerror=()=>{
  if(revision===photoRevision)el('status').textContent='No se pudo abrir esta fotografía';
  URL.revokeObjectURL(url);
 };
 img.src=url;
}
el('file').addEventListener('change',event=>{loadPhoto(event.target.files[0]);event.target.value=''});
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
 loadPhoto([...event.dataTransfer.files].find(file=>file.type.startsWith('image/'))||event.dataTransfer.files[0]);
});
el('dismissBrowserZoomTip').addEventListener('click',()=>{el('browserZoomTip').hidden=true;});
el('photoZoom').addEventListener('input',event=>{zoom=Number(event.target.value)/100;render()});
canvas.addEventListener('pointerdown',event=>{if(!image)return;const r=canvas.getBoundingClientRect();if((event.clientY-r.top)*H/r.height>photoBottom)return;dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId)});
canvas.addEventListener('pointermove',event=>{if(!dragging)return;const ratio=W/canvas.getBoundingClientRect().width;offsetX+=(event.clientX-lastX)*ratio;offsetY+=(event.clientY-lastY)*ratio;lastX=event.clientX;lastY=event.clientY;render()});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
el('clearAll').addEventListener('click',()=>{
 el('articleUrl').value='';el('headline').value='';el('quoteAuthor').value='La Joaqui';el('showQuoteAuthor').checked=true;el('quoteAuthorInputField').hidden=false;el('file').value='';
 selectedTexture='1';halftone=halftoneAssets['1']||null;document.querySelectorAll('.texture-option').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.texture==='1')));
 setVariant('pink');
 forceUppercase=false;syncUppercaseUI();
 el('size').value='70';el('dots').value='5';textAlignment='center';
 el('alignLeft').setAttribute('aria-pressed','false');el('alignCenter').setAttribute('aria-pressed','true');
 photoRevision++;image=null;zoom=1;offsetX=0;offsetY=0;dragging=false;photoHover=false;selectedLogo='primary';syncLogoChoices();photoStage.classList.remove('is-drag-over');
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
 const panel=document.querySelector('.editor-panel');if(!panel)return;
 const rightLimit=panel.getBoundingClientRect().right-12;
 document.querySelectorAll('.help-trigger').forEach(trigger=>{
  const button=trigger.querySelector('.help-button');
  const space=Math.floor(rightLimit-button.getBoundingClientRect().right-12);
  trigger.style.setProperty('--help-available-width',Math.max(85,space)+'px');
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
window.DiarioShowEditor={setImporting(active){importingArticle=active;render()},getPhotoRevision(){return photoRevision},setImage(img){photoRevision++;image=img;zoom=1;offsetX=0;offsetY=0;render()},refresh:render};render();document.fonts.ready.then(render);
})();