import { calculatePhotoPlacement, panByPointerDelta } from './photo-geometry';
import { decodePhotoFile } from './photo-decoder';
import {
 createCoverContent, createDefaultPage, createClearedPage, snapshotEditorialPage
} from './document-model';
import { calculateEditorialLayout, CANVAS_WIDTH, CANVAS_HEIGHT, CONTENT_EDGE } from './editorial-layout';
import { drawPhotoLayer } from './layers/photo-layer';
import { drawLogoLayer } from './layers/logo-layer';
import { drawStrapLayer } from './layers/strap-layer';
import { drawHeadlineLayer } from './layers/headline-layer';
import { prepareCanvasSurface, drawTextPanelLayer } from './layers/surface-layer';
import { drawCoverFooterLayer } from './layers/footer-layer';
import { EditorialCarouselStore } from './carousel-store';
import { PngExportService, canvasToPngBlob, downloadPng } from './png-export-service';
import { PhotoLoadCoordinator } from './photo-load-coordinator';
import { createRenderScheduler } from './render-scheduler';


(function(){
'use strict';

const el=id=>document.getElementById(id),canvas=el('art'),ctx=canvas.getContext('2d'),W=CANVAS_WIDTH,H=CANVAS_HEIGHT;
let image=null,photoName=null,zoom=1,offsetX=0,offsetY=0,dragging=false,lastX=0,lastY=0,photoBottom=820,textAlignment='center',forceUppercase=false,selectedLogo='primary',logoPosition='right',footerStyle='carousel',photoHover=false,pageVariant='cover',photoDecodeFailed=false;
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
// Diseño/firma son datos canónicos por página; React consume eventos tipados.
function emitDesignState(){
 window.dispatchEvent(new CustomEvent('editorial:cronica:design-state',{detail:{logoPosition,footerStyle}}));
}
window.addEventListener('editorial:cronica:design-request',emitDesignState);
window.addEventListener('editorial:cronica:design-command',event=>{
 const action=event.detail;
 if(!action||typeof action.type!=='string')return;
 if(action.type==='set-logo-position'){
  if(action.position!=='left'&&action.position!=='right')return;
  logoPosition=action.position;
 }else if(action.type==='set-footer-style'){
  if(action.style!=='center'&&action.style!=='carousel')return;
  footerStyle=action.style;
 }else return;
 emitDesignState();render();
});
const EDGE=CONTENT_EDGE;
const logoImages={},logoSources={primary:'../cronica/logos/primario.svg',secondary:'../cronica/logos/secundario.svg',white:'../cronica/logos/blanco.svg'};
const logosReady=Promise.all(Object.entries(logoSources).map(([key,src])=>new Promise(resolve=>{
 const img=new Image();logoImages[key]=img;
 img.onload=()=>{render();resolve()};
 img.onerror=()=>{console.error('No se pudo cargar logo:',src);resolve()};
 img.src=src;
})));
// El campo refleja el modo mayúsculas sin alterar el texto que escribió el usuario.
function syncUppercaseUI(){emitTypographyState();}
// El código heredado conserva imagen/zoom/logos como estado canónico y los expone
// mediante snapshots; React es propietario de los botones e inputs.
let previousMediaKey='';
function emitMediaState(force=false){
 const detail={logo:selectedLogo,zoomPercent:Math.round(zoom*100),hasImage:Boolean(image),photoName};
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
function render(includeHover=true){
 try{
  document.documentElement.dataset.cronicaVariant=pageVariant;
  if(pageVariant==='blank'){
   ctx.clearRect(0,0,W,H);
   ctx.fillStyle='#aeb4bc';ctx.fillRect(0,0,W,H);
   photoBottom=H;
   updatePhotoDropzone();
   emitMediaState();
   el('status').textContent='Sin diseño · Elegí Portada o Interior para aplicar una composición.';
   return;
  }
  const {cover,requestedSize,size,lines,baselines,panelTop,barY,imageBottom,showBar}=
   calculateEditorialLayout({
    headline:documentContent.headline,
    requestedSize:Number(documentContent.size),
    forceUppercase,
    showStrap:documentContent.showStrap,
    variant:pageVariant
   },(font,text)=>{ctx.font=font;return ctx.measureText(text).width},W,H,EDGE);
  // Orden de capas idéntico al original: fondo > fotografía > logo >
  // panel > línea roja > volanta > titular > pie de portada.
  prepareCanvasSurface(ctx,W,H);
  photoBottom=Math.max(130,imageBottom);
  const placement=drawPhotoLayer(ctx,{
   image,photoBottom,zoom,offsetX,offsetY,photoHover,includeHover,canvasWidth:W
  });
  offsetX=placement.offsetX;offsetY=placement.offsetY;
  drawLogoLayer(ctx,selectedLogo,logoImages,W,EDGE,logoPosition);
  drawTextPanelLayer(ctx,panelTop,W,H);
  if(showBar)drawStrapLayer(ctx,{
   strapText:documentContent.strapText,isCover:cover,y:barY,canvasWidth:W,edge:EDGE
  });
  drawHeadlineLayer(ctx,lines,size,baselines,textAlignment,W,EDGE);
  if(cover)drawCoverFooterLayer(ctx,W,H,EDGE,footerStyle);
  updatePhotoDropzone();
  emitMediaState();
  if(!photoDecodeFailed)el('status').textContent=size<requestedSize?'Texto largo: tamaño ajustado para respetar los márgenes.':'Vista previa activa · Arrastrá la foto para reencuadrarla.';
 }catch(error){el('status').textContent='Error de vista previa: '+error.message;console.error(error)}
}
/* Única fuente de verdad de páginas; los campos activos siguen como proyección Canvas. */
const carouselStore=new EditorialCarouselStore(readCurrentPage());
const photoLoads=new PhotoLoadCoordinator();
function readCurrentPage(){
 return snapshotEditorialPage(documentContent,{
  alignment:textAlignment,forceUppercase,logo:selectedLogo,logoPosition,footerStyle,image,photoName,zoom,offsetX,offsetY,variant:pageVariant
 });
}
function saveActivePage(){carouselStore.saveActive(readCurrentPage())}
// Los controles React consumen snapshots del store, no guardan fotografías.
function loadPage(page){
 photoDecodeFailed=false;
 pageVariant=['blank','cover','internal'].includes(page.variant)?page.variant:'internal';
 documentContent.headline=String(page.headline||'');
 documentContent.strapText=String(page.strapText||'').toLocaleUpperCase('es-AR');
 documentContent.showStrap=Boolean(page.showStrap);
 documentContent.size=String(page.size);
 emitContentState();
 forceUppercase=Boolean(page.forceUppercase);syncUppercaseUI();
 selectedLogo=page.logo||'primary';
 logoPosition=page.logoPosition||'right';footerStyle=page.footerStyle||'carousel';emitDesignState();
 textAlignment=page.alignment;image=page.image;photoName=page.photoName??null;zoom=page.zoom;offsetX=page.offsetX;offsetY=page.offsetY;
 dragging=false;
 emitTypographyState();
 render();
}
function renderCarouselNavigation(){
 window.dispatchEvent(new CustomEvent('editorial:cronica:state',{
  detail:carouselStore.snapshot
 }));
}
function selectPage(index){
 const page=carouselStore.select(index,readCurrentPage());
 if(!page)return;
 loadPage(page);renderCarouselNavigation();
}
function addPage(){
 const page=carouselStore.insertAfterActive(readCurrentPage());
 loadPage(page);renderCarouselNavigation();
}
function removePage(){
 const oldPageId=carouselStore.activePageId;
 const page=carouselStore.removeActive();
 if(!page)return;
 photoLoads.cancel(oldPageId);
 loadPage(page);renderCarouselNavigation();
}
function changeVariant(next){
 if(!['blank','cover','internal'].includes(next)||next===pageVariant)return;
 pageVariant=next;
 carouselStore.setActiveVariant(next,readCurrentPage());
 renderCarouselNavigation();render();
}
function initializeCarousel(){
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
 zone.hidden=Boolean(image)||pageVariant==='blank';
 // El Canvas solo entra en el orden del Tab cuando la foto se puede reencuadrar.
 canvas.tabIndex=image&&pageVariant!=='blank'?0:-1;
 if(image&&document.activeElement===zone)canvas.focus({preventScroll:true});
 stage.style.setProperty('--photo-height',(photoBottom/H*100)+'%');
 updateHoverBorderGeometry();
 canvas.style.cursor=image?'grab':'default';
}
function loadPhoto(file){
 if(!file)return;
 photoDecodeFailed=false;
 setPhotoHover(false);
 if(!file.type.startsWith('image/')){el('status').textContent='Seleccioná un archivo de imagen válido.';return}
 const pageId=carouselStore.activePageId;
 const signal=photoLoads.begin(pageId);
 // No aplicar el resultado de cargas anteriores, ni asignarlo por índice:
 // los índices cambian al insertar/eliminar páginas durante la decodificación.
 decodePhotoFile(file,signal).then(img=>{
  if(!photoLoads.isCurrent(pageId,signal))return;
  const target=carouselStore.getPageById(pageId);
  if(!target)return;
  if(pageId===carouselStore.activePageId){
    photoDecodeFailed=false;
    image=img;photoName=file.name;zoom=1;offsetX=0;offsetY=0;render();
  }else{
   target.image=img;target.photoName=file.name;target.zoom=1;target.offsetX=0;target.offsetY=0;
  }
 }).catch(error=>{
  // AbortError y errores de una página ya descartada no deben reemplazar el
  // estado informativo de la página que se está editando.
  if(!photoLoads.isCurrent(pageId,signal))return;
  if(error?.name==='AbortError')return;
  if(pageId===carouselStore.activePageId){
    photoDecodeFailed=true;
    el('status').textContent='No se pudo abrir esta fotografía';
  }
  console.error('Error al decodificar fotografía:',error);
 }).finally(()=>photoLoads.finish(pageId,signal));
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
const dragRenderer=createRenderScheduler(()=>render());
canvas.addEventListener('pointerdown',event=>{if(!image||exportBusy)return;const r=canvas.getBoundingClientRect();if((event.clientY-r.top)*H/r.height>photoBottom)return;dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId)});
canvas.addEventListener('pointermove',event=>{
 if(!dragging||exportBusy)return;
 const next=panByPointerDelta({
  offsetX,offsetY,deltaX:event.clientX-lastX,deltaY:event.clientY-lastY,
  canvasWidth:W,viewportWidth:canvas.getBoundingClientRect().width
 });
 offsetX=next.offsetX;offsetY=next.offsetY;
 lastX=event.clientX;lastY=event.clientY;
 dragRenderer.schedule();
});
function finishPointerDrag(){
 if(!dragging)return;
 dragging=false;
 // El último movimiento se pinta sin esperar al siguiente frame.
 dragRenderer.flush();
}
canvas.addEventListener('pointerup',finishPointerDrag);
canvas.addEventListener('pointercancel',finishPointerDrag);
canvas.addEventListener('keydown',event=>{
 if(!image||exportBusy)return;
 const step=event.shiftKey?40:10;
 switch(event.key){
  case 'ArrowLeft':offsetX-=step;break;
  case 'ArrowRight':offsetX+=step;break;
  case 'ArrowUp':offsetY-=step;break;
  case 'ArrowDown':offsetY+=step;break;
  default:return;
 }
 event.preventDefault();
 dragRenderer.cancel();
 render();
});
el('clearAll').addEventListener('click',()=>{
 photoLoads.cancel(carouselStore.activePageId);
 dragRenderer.cancel();
 const initial=createClearedPage(carouselStore.activeIndex,pageVariant);
 loadPage(initial);saveActivePage();
});
// Exportar una placa o todo el carrusel sin perder el estado de edición.
const exportDialog=el('exportDialog'),exportTrigger=el('download');
let exportBusy=false,exportLastFocus=null;
function showExportDialog(){
 saveActivePage();
 el('exportCurrentDetail').textContent='Página '+(carouselStore.activeIndex+1)+' · PNG 1080 × 1440';
 el('exportAllDetail').textContent=carouselStore.pageCount+' archivos PNG por separado';
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
 if(carouselStore.pageCount===1){runExport(false);return}
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
// Servicio desacoplado: prepara los PNG sin conocer el modal, y siempre
// restaura la selección original, incluso si fallan fuentes o canvas.toBlob.
const pngExporter=new PngExportService({
 activeIndex:()=>carouselStore.activeIndex,
 pageCount:()=>carouselStore.pageCount,
 saveActivePage,
 waitForAssets:()=>Promise.all([logosReady,document.fonts.ready]),
 visitPage:index=>{
  const page=carouselStore.visitForExport(index);
  loadPage(page);
 },
 renderWithoutHover:()=>render(false),
 encodePng:()=>canvasToPngBlob(canvas),
 download:downloadPng,
 progress:message=>{el('exportFeedback').textContent=message},
 restorePage:index=>{
  const page=carouselStore.visitForExport(index);
  loadPage(page);
  renderCarouselNavigation();
 }
});
async function runExport(all){
 if(exportBusy)return;
 dragRenderer.cancel();
 dragging=false;
 exportBusy=true;
 const feedback=el('exportFeedback');
 feedback.hidden=false;feedback.textContent=all?'Preparando las imágenes...':'Preparando PNG...';
 el('exportCurrent').disabled=true;el('exportAll').disabled=true;el('exportClose').disabled=true;
 exportTrigger.disabled=true;
 try{
  const {count,originalIndex}=await pngExporter.export(all);
  if(all){
   el('status').textContent='Se iniciaron '+count+' descargas PNG individuales · 1080 × 1440 px. Si faltan archivos, permití las descargas múltiples en el navegador.';
  }else{
   el('status').textContent='PNG de página '+(originalIndex+1)+' listo para descargar · 1080 × 1440 px';
  }
  feedback.textContent='Descarga iniciada.';
 }catch(error){
  console.error('Error al exportar:',error);
  feedback.textContent=error.name==='SecurityError'?'La fotografía bloquea la exportación. Cargá otra imagen desde tu dispositivo.':'No se pudo exportar: '+error.message;
  el('status').textContent=feedback.textContent;
  return;
 }finally{
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