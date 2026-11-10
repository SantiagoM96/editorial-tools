import { calculatePhotoPlacement, panByPointerDelta } from './photo-geometry';
import { decodePhotoFile } from './photo-decoder';
import {
 createCoverContent, createDefaultPage, createClearedPage, snapshotEditorialPage
} from './document-model';
import { calculateEditorialLayout, fontFor } from './editorial-layout';


(function(){
'use strict';

const el=id=>document.getElementById(id),canvas=el('art'),ctx=canvas.getContext('2d'),W=1080,H=1440;
let image=null,zoom=1,offsetX=0,offsetY=0,dragging=false,lastX=0,lastY=0,photoBottom=820,textAlignment='center',forceUppercase=false,selectedLogo='primary',photoHover=false,pageVariant='cover';
const documentContent=createCoverContent();
function emitContentState(){
 window.dispatchEvent(new CustomEvent('editorial:cronica:content-state',{detail:{...documentContent}}));
}
window.addEventListener('editorial:cronica:content-request',emitContentState);
window.addEventListener('editorial:cronica:content-command',event=>{
 const action=event.detail;
 if(!action||typeof action.field!=='string')return;
 if(action.field==='headline'&&typeof action.value==='string'){
  documentContent.headline=action.value;
 }else if(action.field==='strapText'&&typeof action.value==='string'){
  documentContent.strapText=action.value.slice(0,140).toLocaleUpperCase('es-AR');
 }else if(action.field==='showStrap'&&typeof action.value==='boolean'){
  documentContent.showStrap=action.value;
 }else if(action.field==='size'&&Number.isInteger(action.value)&&action.value>=32&&action.value<=95){
  documentContent.size=String(action.value);
 }else return;
 emitContentState();
 render();
});
const RED='#ed0000',BLACK='#080808',EDGE=80;
const LOGO_WIDTH=75*1.25*1.15,LOGO_HEIGHT=LOGO_WIDTH*191/175;
const logoImages={},logoSources={primary:'../cronica/logos/primario.svg',secondary:'../cronica/logos/secundario.svg',white:'../cronica/logos/blanco.svg'};
const logosReady=Promise.all(Object.entries(logoSources).map(([key,src])=>new Promise(resolve=>{
 const img=new Image();logoImages[key]=img;
 img.onload=()=>{render();resolve()};
 img.onerror=()=>{console.error('No se pudo cargar logo:',src);resolve()};
 img.src=src;
})));
function drawBrandLogo(){
 if(selectedLogo==='none')return;
 const img=logoImages[selectedLogo];
 if(!img||!img.complete||!img.naturalWidth)return;
 ctx.drawImage(img,W-EDGE-LOGO_WIDTH,EDGE,LOGO_WIDTH,LOGO_HEIGHT);
}
// El campo refleja el modo mayúsculas sin alterar el texto que escribió el usuario.
function syncUppercaseUI(){emitTypographyState();}
// El código heredado conserva imagen/zoom/logos como estado canónico y los expone
// mediante snapshots; React es propietario de los botones e inputs.
let previousMediaKey='';
function emitMediaState(force=false){
 const detail={logo:selectedLogo,zoomPercent:Math.round(zoom*100),hasImage:Boolean(image)};
 const key=JSON.stringify(detail);
 // El arrastre del Canvas no cambia controles: evitar renders React por pointermove.
 if(!force&&key===previousMediaKey)return;
 previousMediaKey=key;
 window.dispatchEvent(new CustomEvent('editorial:cronica:media-state',{detail}));
}
window.addEventListener('editorial:cronica:media-request',()=>emitMediaState(true));
window.addEventListener('editorial:cronica:media-command',event=>{
 const action=event.detail;
 if(!action||typeof action.type!=='string')return;
 if(action.type==='set-logo'){
  if(!['none','primary','secondary','white'].includes(action.logo))return;
  selectedLogo=action.logo;
 }else if(action.type==='set-zoom'){
  if(!Number.isInteger(action.percent)||action.percent<100||action.percent>300||action.percent%5!==0)return;
  zoom=action.percent/100;
 }else if(action.type==='upload-photo'){
  if(!(action.file instanceof File))return;
  loadPhoto(action.file);
  return;
 }else return;
 render();
});
function drawStrap(y,isCover){
 if(!documentContent.showStrap)return;
 const content=documentContent.strapText.replace(/\s+/g,' ').trim().toLocaleUpperCase('es-AR'),maxWidth=W-EDGE*2;
 let size=isCover?34:32;
 ctx.textBaseline='middle';
 while(size>16){ctx.font='800 '+size+'px Inter,Arial,sans-serif';if(ctx.measureText(content).width<=maxWidth-44)break;size--}
 const textWidth=ctx.measureText(content).width,barHeight=isCover?52:50;
 const width=isCover?Math.min(maxWidth,Math.ceil(textWidth+44)):W;
 const left=isCover?(W-width)/2:0;
 ctx.fillStyle=RED;ctx.fillRect(left,y,width,barHeight);
 if(content){ctx.font='800 '+size+'px Inter,Arial,sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';
 ctx.fillText(content,W/2,y+barHeight/2,maxWidth-24)}
 ctx.textAlign='left';ctx.textBaseline='alphabetic';
}
function drawText(lines,size,baselines){
 const centered=textAlignment==='center';
 ctx.textBaseline='alphabetic';
 lines.forEach((line,i)=>{
  const total=line.reduce((sum,p)=>sum+p.width,0);
  let x=centered?(W-total)/2:EDGE;
  for(const part of line){
   ctx.font=fontFor(size,part);ctx.fillStyle=part.accent?RED:BLACK;
   ctx.fillText(part.text,x,baselines[i]);
   if(part.strike){const y=baselines[i]-size*.32;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+part.width,y);ctx.stroke()}
   x+=part.width;
  }
 });
}
function drawPhoto(height,includeHover=true){
 photoBottom=Math.max(130,height);
 ctx.fillStyle='#aeb4bc';ctx.fillRect(0,0,W,photoBottom);
 if(image){
  const placement=calculatePhotoPlacement({
   imageWidth:image.width,imageHeight:image.height,canvasWidth:W,
   photoBottom,zoom,offsetX,offsetY
  });
  offsetX=placement.offsetX;offsetY=placement.offsetY;
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,photoBottom);ctx.clip();
  ctx.drawImage(image,placement.x,placement.y,placement.width,placement.height);ctx.restore();
 }else{
  // El aviso de carga se presenta como capa HTML interactiva, fuera del PNG.
  // La capa de hover queda bajo la línea roja y la volanta dibujadas después.
  if(includeHover&&photoHover){
   ctx.fillStyle='rgba(0,0,0,.11)';
   ctx.fillRect(0,0,W,photoBottom);
  }
 }
}
function render(includeHover=true){
 try{
  const {cover,requestedSize,size,lines,baselines,panelTop,barY,imageBottom,showBar}=
   calculateEditorialLayout({
    headline:documentContent.headline,
    requestedSize:Number(documentContent.size),
    forceUppercase,
    showStrap:documentContent.showStrap,
    variant:pageVariant
   },(font,text)=>{ctx.font=font;return ctx.measureText(text).width},W,H,EDGE);
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  drawPhoto(imageBottom,includeHover);
  drawBrandLogo();
  ctx.fillStyle='#fff';ctx.fillRect(0,panelTop,W,H-panelTop);
  // Línea roja permanente en el límite entre fotografía y caja blanca.
  // En portada atraviesa horizontalmente el centro de la volanta.
  ctx.fillStyle=RED;ctx.fillRect(0,panelTop-6.5,W,13);
  if(showBar)drawStrap(barY,cover);
  drawText(lines,size,baselines);
  if(cover){
   // Pie: texto en caja baja y flecha alineados por su centro vertical.
   const footerCenterY=H-EDGE-16;
   ctx.save();
   ctx.fillStyle=RED;ctx.textBaseline='middle';
   ctx.font='500 30px Inter,Arial,sans-serif';
   ctx.textAlign='left';ctx.fillText('cronica.com.ar',EDGE,footerCenterY);
   ctx.font='54px "Material Icons"';ctx.textAlign='right';
   ctx.fillText('arrow_forward',W-EDGE,footerCenterY);
   ctx.restore();
  }
  updatePhotoDropzone();
  emitMediaState();
  el('status').textContent=size<requestedSize?'Texto largo: tamaño ajustado para respetar los márgenes.':'Vista previa activa · Arrastrá la foto para reencuadrarla.';
 }catch(error){el('status').textContent='Error de vista previa: '+error.message;console.error(error)}
}
/* Cada placa conserva sus propios controles, foto, zoom y encuadre durante la edición. */
let carouselPages=[],activePage=0;
function readCurrentPage(){
 return snapshotEditorialPage(documentContent,{
  alignment:textAlignment,forceUppercase,logo:selectedLogo,image,zoom,offsetX,offsetY,variant:pageVariant
 });
}
function newBlankPage(){return createDefaultPage('internal')}
function saveActivePage(){if(carouselPages[activePage])carouselPages[activePage]=readCurrentPage()}
// Contrato de comunicación con los controles React (los datos e imágenes siguen aquí).
// Un solo origen de verdad: carouselPages / activePage / pageVariant.
function loadPage(page){
 pageVariant=page.variant==='cover'?'cover':'internal';
 documentContent.headline=String(page.headline||'');
 documentContent.strapText=String(page.strapText||'').toLocaleUpperCase('es-AR');
 documentContent.showStrap=Boolean(page.showStrap);
 documentContent.size=String(page.size);
 emitContentState();
 forceUppercase=Boolean(page.forceUppercase);syncUppercaseUI();
 selectedLogo=page.logo||'primary';
 textAlignment=page.alignment;image=page.image;zoom=page.zoom;offsetX=page.offsetX;offsetY=page.offsetY;
 dragging=false;
 emitTypographyState();
 render();
}
function renderCarouselNavigation(){
 window.dispatchEvent(new CustomEvent('editorial:cronica:state',{
  detail:{
   pages:carouselPages.map(page=>page.variant==='cover'?'cover':'internal'),
   activePage,
   variant:pageVariant
  }
 }));
}
function selectPage(index){
 if(index===activePage||index<0||index>=carouselPages.length)return;
 saveActivePage();activePage=index;loadPage(carouselPages[index]);renderCarouselNavigation();
}
function addPage(){
 saveActivePage();
 const index=activePage+1;
 carouselPages.splice(index,0,newBlankPage());
 activePage=index;loadPage(carouselPages[index]);renderCarouselNavigation();
}
function removePage(){
 if(activePage===0)return;
 carouselPages.splice(activePage,1);
 activePage=Math.min(activePage,carouselPages.length-1);
 loadPage(carouselPages[activePage]);renderCarouselNavigation();
}
function changeVariant(next){
 if((next!=='cover'&&next!=='internal')||next===pageVariant)return;
 pageVariant=next;
 saveActivePage();renderCarouselNavigation();render();
}
function initializeCarousel(){
 carouselPages=[readCurrentPage()];activePage=0;
 window.addEventListener('editorial:cronica:request-state',renderCarouselNavigation);
 window.addEventListener('editorial:cronica:command',event=>{
  const action=event.detail;
  if(!action||typeof action.type!=='string')return;
  switch(action.type){
   case 'add-page':addPage();break;
   case 'remove-page':removePage();break;
   case 'select-page':if(Number.isInteger(action.index))selectPage(action.index);break;
   case 'set-variant':changeVariant(action.variant);break;
  }
 });
 renderCarouselNavigation();
}

// Los botones de tipografía ya no los manipula el script heredado.
// Su estado de edición continúa siendo el único origen de verdad.
function emitTypographyState(){
 window.dispatchEvent(new CustomEvent('editorial:cronica:typography-state',{
  detail:{uppercase:forceUppercase,alignment:textAlignment}
 }));
}
window.addEventListener('editorial:cronica:typography-request',emitTypographyState);
window.addEventListener('editorial:cronica:typography-command',event=>{
 const action=event.detail;
 if(!action||typeof action.type!=='string')return;
 if(action.type==='toggle-uppercase'){
  forceUppercase=!forceUppercase;
  syncUppercaseUI();
 }else if(action.type==='set-alignment'&&(action.alignment==='left'||action.alignment==='center')){
  textAlignment=action.alignment;
 }else return;
 emitTypographyState();
 render();
});
function updateHoverBorderGeometry(){
 const stage=el('photoStage');
 if(!stage)return;
 const scale=stage.getBoundingClientRect().width/W;
 // Los márgenes y el radio se basan en el lienzo 1080px; el punteado
 // mantiene siempre un grosor de 1 píxel en pantalla.
 stage.style.setProperty('--hover-inset',(50*scale)+'px');
 stage.style.setProperty('--hover-radius',(16*scale)+'px');
}
window.addEventListener('resize',updateHoverBorderGeometry);
function updatePhotoDropzone(){
 const zone=el('photoDropzone'),stage=el('photoStage');
 if(!zone||!stage)return;
 zone.hidden=Boolean(image);
 stage.style.setProperty('--photo-height',(photoBottom/H*100)+'%');
 updateHoverBorderGeometry();
 canvas.style.cursor=image?'grab':'default';
}
function loadPhoto(file){
 if(!file)return;
 setPhotoHover(false);
 if(!file.type.startsWith('image/')){el('status').textContent='Seleccioná un archivo de imagen válido.';return}
 const pageIndex=activePage;
 // El decoder es independiente de Canvas y garantiza revokeObjectURL en éxito/error.
 decodePhotoFile(file).then(img=>{
  if(pageIndex===activePage){image=img;zoom=1;offsetX=0;offsetY=0;render()}
  else if(carouselPages[pageIndex]){
   carouselPages[pageIndex].image=img;carouselPages[pageIndex].zoom=1;
   carouselPages[pageIndex].offsetX=0;carouselPages[pageIndex].offsetY=0;
  }
 }).catch(error=>{
  el('status').textContent='No se pudo abrir esta fotografía';
  console.error('Error al decodificar fotografía:',error);
 });
}
const photoZone=el('photoDropzone'),photoStage=el('photoStage');
function setPhotoHover(active){
 if(photoHover===active)return;
 photoHover=active;
 if(!image)render();
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
photoStage.addEventListener('dragenter',event=>{if(isImageDrag(event)&&isOverPhoto(event)){event.preventDefault();photoStage.classList.add('is-drag-over');setPhotoHover(true)}});
photoStage.addEventListener('dragover',event=>{if(isImageDrag(event)&&isOverPhoto(event)){event.preventDefault();event.dataTransfer.dropEffect='copy';photoStage.classList.add('is-drag-over');setPhotoHover(true)}else{photoStage.classList.remove('is-drag-over');setPhotoHover(false)}});
photoStage.addEventListener('dragleave',event=>{if(!photoStage.contains(event.relatedTarget)){photoStage.classList.remove('is-drag-over');setPhotoHover(false)}});
photoStage.addEventListener('drop',event=>{photoStage.classList.remove('is-drag-over');setPhotoHover(false);if(!isOverPhoto(event))return;event.preventDefault();loadPhoto([...event.dataTransfer.files].find(file=>file.type.startsWith('image/'))||event.dataTransfer.files[0])});
canvas.addEventListener('pointerdown',event=>{if(!image)return;const r=canvas.getBoundingClientRect();if((event.clientY-r.top)*H/r.height>photoBottom)return;dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId)});
canvas.addEventListener('pointermove',event=>{
 if(!dragging)return;
 const next=panByPointerDelta({
  offsetX,offsetY,deltaX:event.clientX-lastX,deltaY:event.clientY-lastY,
  canvasWidth:W,viewportWidth:canvas.getBoundingClientRect().width
 });
 offsetX=next.offsetX;offsetY=next.offsetY;
 lastX=event.clientX;lastY=event.clientY;render();
});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
el('clearAll').addEventListener('click',()=>{
 const initial=createClearedPage(activePage,pageVariant);
 loadPage(initial);saveActivePage();
});
// Exportar una placa o todo el carrusel sin perder el estado de edición.
const exportDialog=el('exportDialog'),exportTrigger=el('download');
let exportBusy=false,exportLastFocus=null;
function showExportDialog(){
 saveActivePage();
 el('exportCurrentDetail').textContent='Página '+(activePage+1)+' · PNG 1080 × 1440';
 el('exportAllDetail').textContent=carouselPages.length+' archivos PNG por separado';
 el('exportFeedback').hidden=true;
 exportLastFocus=document.activeElement;
 exportDialog.hidden=false;
 document.body.style.overflow='hidden';
 el('exportCurrent').focus();
}
function closeExportDialog(){
 if(exportBusy)return;
 exportDialog.hidden=true;
 document.body.style.overflow='';
 if(exportLastFocus&&exportLastFocus.isConnected)exportLastFocus.focus();
}
exportTrigger.addEventListener('click',()=>{
 // Si el carrusel tiene una sola página, descargar el PNG sin abrir el diálogo.
 if(carouselPages.length===1){runExport(false);return}
 showExportDialog();
});
el('exportClose').addEventListener('click',closeExportDialog);
exportDialog.addEventListener('click',event=>{if(event.target===exportDialog)closeExportDialog()});
exportDialog.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();closeExportDialog();return}
 if(event.key==='Tab'){
  const items=[el('exportClose'),el('exportCurrent'),el('exportAll')];
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 }
});
// Marcas de tiempo locales, con segundos diferentes por imagen y exportación.
let lastExportTimestampSecond=0;
function exportTimestamp(index=0){
 const now=Math.floor(Date.now()/1000);
 if(index===0)lastExportTimestampSecond=Math.max(now,lastExportTimestampSecond+1);
 const d=new Date((lastExportTimestampSecond+index)*1000);
 const pad=n=>String(n).padStart(2,'0');
 return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+
  '_'+pad(d.getHours())+'-'+pad(d.getMinutes())+'-'+pad(d.getSeconds());
}
function saveDownloadedBlob(blob,filename){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function pngBlob(){
 return new Promise((resolve,reject)=>{
  try{canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo generar el PNG.')),'image/png')}
  catch(error){reject(error)}
 });
}
async function runExport(all){
 if(exportBusy)return;
 exportBusy=true;
 const feedback=el('exportFeedback');
 feedback.hidden=false;feedback.textContent=all?'Preparando las imágenes...':'Preparando PNG...';
 el('exportCurrent').disabled=true;el('exportAll').disabled=true;el('exportClose').disabled=true;
 exportTrigger.disabled=true;
 const originalIndex=activePage;
 try{
  saveActivePage();
  await Promise.all([logosReady,document.fonts.ready]);
  const timestamp=exportTimestamp(0);
  if(all){
   const count=carouselPages.length,files=[];
   for(let i=0;i<count;i++){
    feedback.textContent='Preparando imagen '+(i+1)+' de '+count+'...';
    activePage=i;loadPage(carouselPages[i]);render(false);
    const blob=await pngBlob();
    files.push({
     name:'Cronica-pagina-'+String(i+1).padStart(2,'0')+'_'+(i===0?timestamp:exportTimestamp(i))+'.png',
     blob
    });
   }
   lastExportTimestampSecond+=Math.max(0,count-1);
   // Descargas individuales: iniciar todas juntas para evitar múltiples ZIP.
   // El navegador puede pedir autorización para descargar varios archivos.
   feedback.textContent='Iniciando '+count+' descargas PNG...';
   for(const file of files)saveDownloadedBlob(file.blob,file.name);
   el('status').textContent='Se iniciaron '+count+' descargas PNG individuales · 1080 × 1440 px. Si faltan archivos, permití las descargas múltiples en el navegador.';
  }else{
   render(false);
   const blob=await pngBlob();
   saveDownloadedBlob(blob,'Cronica-pagina-'+String(originalIndex+1).padStart(2,'0')+'_'+timestamp+'.png');
   el('status').textContent='PNG de página '+(originalIndex+1)+' listo para descargar · 1080 × 1440 px';
  }
  feedback.textContent='Descarga iniciada.';
 }catch(error){
  console.error('Error al exportar:',error);
  feedback.textContent=error.name==='SecurityError'?'La fotografía bloquea la exportación. Cargá otra imagen desde tu dispositivo.':'No se pudo exportar: '+error.message;
  el('status').textContent=feedback.textContent;
  return;
 }finally{
  if(all){activePage=originalIndex;loadPage(carouselPages[originalIndex]);renderCarouselNavigation()}
  exportBusy=false;
  el('exportCurrent').disabled=false;el('exportAll').disabled=false;el('exportClose').disabled=false;
  exportTrigger.disabled=false;
 }
 closeExportDialog();
}
el('exportCurrent').addEventListener('click',()=>runExport(false));
el('exportAll').addEventListener('click',()=>runExport(true));
// Ajustar el ancho de cada globo al espacio libre del panel, con 12 px de margen interior.
function sizeHelpTooltips(){
 const panel=document.querySelector('.editor-panel');
 if(!panel)return;
 const rightLimit=panel.getBoundingClientRect().right-12;
 document.querySelectorAll('.help-trigger').forEach(trigger=>{
  const button=trigger.querySelector('.help-button');
  const available=rightLimit-button.getBoundingClientRect().right-12;
  trigger.style.setProperty('--help-available-width',Math.max(96,Math.floor(available))+'px');
 });
}
window.addEventListener('resize',sizeHelpTooltips);
document.querySelectorAll('.help-trigger').forEach(trigger=>{
 trigger.addEventListener('pointerenter',sizeHelpTooltips);
 trigger.addEventListener('focusin',sizeHelpTooltips);
});
sizeHelpTooltips();
// Ayudas accesibles también mediante toque, teclado y Escape.
document.querySelectorAll('.help-trigger').forEach(trigger=>{
 const button=trigger.querySelector('.help-button');
 button.addEventListener('click',event=>{
  event.stopPropagation();
  const shouldOpen=!trigger.classList.contains('is-open');
  document.querySelectorAll('.help-trigger').forEach(other=>{
   other.classList.remove('is-open');
   other.querySelector('.help-button').setAttribute('aria-expanded','false');
  });
  trigger.classList.toggle('is-open',shouldOpen);
  button.setAttribute('aria-expanded',String(shouldOpen));
 });
});
function closeHelpTooltips(){
 document.querySelectorAll('.help-trigger.is-open').forEach(trigger=>{
  trigger.classList.remove('is-open');
  trigger.querySelector('.help-button').setAttribute('aria-expanded','false');
 });
}
document.addEventListener('click',event=>{
 if(!event.target.closest('.help-trigger'))closeHelpTooltips();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape')closeHelpTooltips();
});
initializeCarousel();syncUppercaseUI();emitTypographyState();render();document.fonts.ready.then(render);
})();