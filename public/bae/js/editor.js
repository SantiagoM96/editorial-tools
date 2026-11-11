
(function(){
'use strict';
const el=id=>document.getElementById(id),canvas=el('art'),ctx=canvas.getContext('2d'),W=1080,H=1440;
let halftone=null;const halftoneLayer=document.createElement('canvas');halftoneLayer.width=1080;halftoneLayer.height=1236;const halftoneCtx=halftoneLayer.getContext('2d');let importingArticle=false;let selectedTexture='1';const halftoneAssets={};function loadTexture(id,path){const asset=new Image();asset.onload=()=>{halftoneAssets[id]=asset;if(selectedTexture===id){halftone=asset;render()}};asset.onerror=()=>console.error('No se pudo cargar '+path);asset.src=path}loadTexture('1','../bae/halftone-2.svg?v=1');loadTexture('2','./textures/punteado-grises-ajustados.svg?v=1');let textAlignment='left',forceUppercase=false;let image=null,photoName=null,zoom=1,offsetX=0,offsetY=0,dragging=false,lastX=0,lastY=0,photoBottom=820;
const LOGO_MARGIN=80,LOGO_WIDTH=123.75*1.15,LOGO_HEIGHT=LOGO_WIDTH*192/358;
let selectedLogo='primary';
const logoImages={},logoSources={primary:'./logos/primario.svg',white:'./logos/blanco.svg'};
for(const [key,src] of Object.entries(logoSources)){
 const img=new Image();logoImages[key]=img;
 img.onload=()=>render();
 img.onerror=()=>console.error('No se pudo cargar el logo de BAE:',src);
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
const palette={dark:{bg:'#171717',text:'#fff',accent:'#D82626'},white:{bg:'#fff',text:'#171717',accent:'#D82626'},red:{bg:'#D82626',text:'#fff',accent:'#fff'}};
function parseRich(text){const out=[];let style={accent:false,italic:false,strike:false},buffer='';const flush=()=>{if(buffer){out.push({text:buffer,...style});buffer=''}};for(const c of String(text)){const field=c==='*'?'accent':c==='_'?'italic':c==='~'?'strike':null;if(field){flush();style={...style,[field]:!style[field]}}else buffer+=c}flush();return out}
function wrapRich(text,size,quote=false){const result=[];for(const paragraph of String(text).split('\n')){const spans=quote?[{text:paragraph,italic:true,accent:false,strike:false}]:parseRich(paragraph);let line=[],width=0;for(const span of spans){for(const part of span.text.match(/\S+|\s+/g)||[]){const font=(span.italic?'italic ':'')+size+'px "DM Serif Display",Georgia,serif';ctx.font=font;const partWidth=ctx.measureText(part).width;if(width+partWidth>920&&width>0&&part.trim()){result.push({parts:line,quote});line=[];width=0}if(!line.length&&!part.trim())continue;line.push({...span,text:part,width:partWidth});width+=partWidth}}if(line.length)result.push({parts:line,quote})}return result}
function render(){
try{
const colors=palette[el('theme').value]||palette.dark,size=Number(el('size').value),lineHeight=Math.round(size*1.12*0.8*1.10),main=wrapRich(forceUppercase?el('headline').value.toLocaleUpperCase('es-AR'):el('headline').value,size),quotes=el('enableQuote').checked?wrapRich(el('quote').value,size,true):[];
// Coordenadas en píxeles reales del PNG (1080 × 1440), no píxeles CSS.
// Piso de la firma exactamente a 80 px del borde inferior.
ctx.textBaseline='alphabetic';
ctx.font='30px Arial';
const footerMetrics=ctx.measureText('baenegocios.com');
const footerAscent=footerMetrics.actualBoundingBoxAscent||29;
const footerDescent=footerMetrics.actualBoundingBoxDescent||0;
const footerBaseline=H-80-footerDescent;
const footerTop=footerBaseline-footerAscent;
// Construir las líneas en orden visual y posicionarlas desde abajo.
const lines=[...main,...quotes];
const lineMetrics=lines.map(line=>{
 ctx.font=(line.quote?'italic ':'')+size+'px "DM Serif Display",Georgia,serif';
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
photoBottom=boxTop-16;
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
ctx.save();ctx.beginPath();ctx.rect(0,boxTop,W,H-boxTop);ctx.clip();
ctx.globalAlpha=Number(el('dots').value)/100;if(halftone){
 if(selectedTexture==='2'){
  // Zoom 200 % del SVG original, reducción del 50 % respecto al tamaño anterior (400 %).
  // Renderizar directamente el vector evita ampliar píxeles de un canvas intermedio.
  const scale=2,drawW=1080*scale;
  const previousFilter=ctx.filter;
  ctx.filter=el('theme').value==='white'?'none':'invert(1)';
  // Equivalente al recorte original con origen en 115: anclado a boxTop.
  ctx.drawImage(halftone,(W-drawW)/2,boxTop-115*scale,drawW,1235.84*scale);
  ctx.filter=previousFilter;
 }else{
  // Textura 1: conservar exactamente el render y el recorte anteriores.
  halftoneCtx.clearRect(0,0,1080,1236);
  halftoneCtx.globalCompositeOperation='source-over';
  halftoneCtx.drawImage(halftone,0,0,1080,1235.84);
  halftoneCtx.globalCompositeOperation='source-in';
  halftoneCtx.fillStyle=el('theme').value==='dark'?'#ffffff':'#000000';
  halftoneCtx.fillRect(0,0,1080,1236);
  halftoneCtx.globalCompositeOperation='source-over';
  ctx.drawImage(halftoneLayer,0,115,1080,1121,0,boxTop,1080,1121);
 }
}ctx.restore();
ctx.fillStyle=el('theme').value==='white'?'#D82626':'#ffffff';ctx.fillRect(0,boxTop-16,W,16);
const centered=textAlignment==='center';
ctx.textAlign=centered?'center':'left';ctx.textBaseline='alphabetic';
for(let i=0;i<lines.length;i++){
 const line=lines[i],total=line.parts.reduce((sum,p)=>sum+p.width,0);
 let x=centered?(W-total)/2:80;
 for(const part of line.parts){
  ctx.font=((line.quote||part.italic)?'italic ':'')+size+'px "DM Serif Display",Georgia,serif';
  ctx.textAlign='left';ctx.fillStyle=(line.quote||part.accent)?colors.accent:colors.text;
  ctx.fillText(part.text,x,baselines[i]);
  if(part.strike&&!line.quote){const y=baselines[i]-size*.32;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.max(2,size*.045);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+part.width,y);ctx.stroke()}
  x+=part.width;
 }
}
ctx.fillStyle=colors.text;ctx.font='30px Arial';ctx.textAlign='center';ctx.fillText('baenegocios.com',W/2,footerBaseline);ctx.textAlign='left';
const overlay=el('importOverlay');if(overlay){overlay.style.height=(photoBottom/H*100)+'%';}updatePhotoStage();el('dotsLabel').textContent=el('dots').value+'%';el('sizeLabel').textContent=size;el('zoomLabel').textContent=Math.round(zoom*100)+' %';el('photoZoom').value=Math.round(zoom*100);el('status').textContent=boxTop<=80?'Texto demasiado largo: reducí el tamaño.':'Vista previa activa · Arrastrá la foto para reencuadrarla.';
 }catch(error){el('status').textContent='Error de vista previa: '+error.message;console.error(error)}
 finally{window.dispatchEvent(new Event('editorial:bae:render'));}
 }
// Algunos navegadores restauran el valor anterior del slider aunque el HTML diga 5.
function resetDefaultHalftone(){el('dots').value='5';el('dotsLabel').textContent='5%';render()}
resetDefaultHalftone();
window.addEventListener('pageshow',event=>{if(event.persisted)resetDefaultHalftone()});
el('enableQuote').addEventListener('change',()=>{el('quote').hidden=!el('enableQuote').checked;render()});for(const id of ['headline','quote','enableQuote','size','dots'])el(id).addEventListener('input',render);for(const [id,value] of [['alignLeft','left'],['alignCenter','center']])el(id).addEventListener('click',()=>{textAlignment=value;el('alignLeft').setAttribute('aria-pressed',String(value==='left'));el('alignCenter').setAttribute('aria-pressed',String(value==='center'));render()});for(const [id,marker] of [['formatAccent','*'],['formatItalic','_'],['formatStrike','~']]){const button=el(id);button.addEventListener('mousedown',e=>e.preventDefault());button.addEventListener('click',()=>{const field=el('headline'),a=field.selectionStart,b=field.selectionEnd;if(a===b){field.focus();return}const selected=field.value.slice(a,b);field.setRangeText(marker+selected+marker,a,b,'select');field.setSelectionRange(a+1,b+1);field.focus();render()})}

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
const themeSwatches=[...document.querySelectorAll('.theme-swatch')];themeSwatches.forEach(button=>button.addEventListener('click',()=>{el('theme').value=button.dataset.theme;themeSwatches.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));el('theme').dispatchEvent(new Event('change',{bubbles:true}))}));
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
function updatePhotoPicker(){
 const action=el('baePhotoAction'),caption=el('baePhotoCaption');
 if(!action||!caption)return;
 action.textContent=image?'Cambiar':'Seleccioná';
 caption.textContent=image?(photoName||'Fotografía importada'):'una fotografía';
 caption.title=image?(photoName||''):'';
}
function loadPhoto(file){
 if(!file)return;
 if(!file.type.startsWith('image/')){el('status').textContent='Seleccioná un archivo de imagen válido.';return}
 const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{image=img;photoName=file.name;zoom=1;offsetX=0;offsetY=0;updatePhotoPicker();render();URL.revokeObjectURL(url)};
 img.onerror=()=>{el('status').textContent='No se pudo abrir esta fotografía';URL.revokeObjectURL(url)};
 img.src=url;
}
el('file').addEventListener('change',event=>{loadPhoto(event.target.files[0]);event.target.value=''});
const photoStage=el('photoStage'),photoZone=el('photoDropzone');
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
el('photoZoom').addEventListener('input',event=>{zoom=Number(event.target.value)/100;render()});
canvas.addEventListener('pointerdown',event=>{if(!image)return;const r=canvas.getBoundingClientRect();if((event.clientY-r.top)*H/r.height>photoBottom)return;dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId)});
canvas.addEventListener('pointermove',event=>{if(!dragging)return;const ratio=W/canvas.getBoundingClientRect().width;offsetX+=(event.clientX-lastX)*ratio;offsetY+=(event.clientY-lastY)*ratio;lastX=event.clientX;lastY=event.clientY;render()});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
el('clearAll').addEventListener('click',()=>{
 el('articleUrl').value='';el('headline').value='';el('quote').value='';el('enableQuote').checked=false;el('quote').hidden=true;el('file').value='';
 selectedTexture='1';halftone=halftoneAssets['1']||null;document.querySelectorAll('.texture-option').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.texture==='1')));
 el('theme').value='dark';document.querySelectorAll('.theme-swatch').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.theme==='dark')));
 el('size').value='70';el('dots').value='5';textAlignment='left';forceUppercase=false;el('headline').classList.remove('uppercase-preview');const upper=el('baeUppercase');if(upper)upper.setAttribute('aria-pressed','false');
 el('alignLeft').setAttribute('aria-pressed','true');el('alignCenter').setAttribute('aria-pressed','false');
 image=null;photoName=null;zoom=1;offsetX=0;offsetY=0;dragging=false;selectedLogo='primary';syncLogoChoices();updatePhotoPicker();photoStage.classList.remove('is-drag-over');
 el('importStatus').textContent='Pegá una URL de BAE Negocios.';
 render();
});
el('download').addEventListener('click',()=>{
 const button=el('download');
 button.disabled=true;
 try{
  render();
  canvas.toBlob(blob=>{
   button.disabled=false;
   if(!blob){el('status').textContent='No se pudo generar el PNG. Probá cargar la fotografía manualmente.';return}
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='BAE-posteo.png';document.body.appendChild(a);a.click();a.remove();
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
window.BAEEditor={setImporting(active){importingArticle=active;render()},setImage(img){image=img;photoName=null;zoom=1;offsetX=0;offsetY=0;updatePhotoPicker();render()},setUppercase(value){forceUppercase=Boolean(value);el('headline').classList.toggle('uppercase-preview',forceUppercase);render()},refresh:render};render();document.fonts.ready.then(render);
})();