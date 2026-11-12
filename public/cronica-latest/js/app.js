
(function(){
'use strict';

const el=id=>document.getElementById(id),canvas=el('art'),ctx=canvas.getContext('2d'),W=1080,H=1440;
let image=null,zoom=1,offsetX=0,offsetY=0,dragging=false,lastX=0,lastY=0,photoBottom=820,textAlignment='center',forceUppercase=false,selectedLogo='primary',photoHover=false,pageVariant='cover';
const RED='#ed0000',BLACK='#080808',EDGE=80;
// Volantas un 30 % más altas; las mismas medidas se usan en preview y PNG.
const COVER_STRAP_HEIGHT=68,INTERNAL_STRAP_HEIGHT=65;
let footerStyle='carousel';
document.addEventListener('editorial:footer-style',event=>{footerStyle=event.detail.style;render()});
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
function syncUppercaseUI(){
 el('formatUppercase').setAttribute('aria-pressed',String(forceUppercase));
 el('headline').classList.toggle('uppercase-preview',forceUppercase);
}
function syncLogoChoices(){
 document.querySelectorAll('.logo-choice').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.logo===selectedLogo)));
}
function parseRich(text){
 const out=[];let state={accent:false,italic:false,strike:false},buffer='';
 const flush=()=>{if(buffer){out.push({text:buffer,...state});buffer=''}};
 for(const c of String(text)){
  const key=c==='*'?'accent':c==='_'?'italic':c==='~'?'strike':null;
  if(key){flush();state={...state,[key]:!state[key]}}else buffer+=c
 }
 flush();return out;
}
function fontFor(size,part){return (part.italic?'italic ':'')+'700 '+size+'px Asap,Arial,sans-serif'}
function wrappedLines(text,size){
 const result=[];
 for(const paragraph of String(text).split('\n')){
  let line=[],width=0;
  for(const span of parseRich(paragraph)){
   for(const part of span.text.match(/\S+|\s+/g)||[]){
    ctx.font=fontFor(size,span);
    let partWidth=ctx.measureText(part).width;
    if(width+partWidth>W-EDGE*2&&width>0&&part.trim()){result.push(line);line=[];width=0}
    if(!line.length&&!part.trim())continue;
    // Descomponer palabras excepcionalmente largas para respetar los márgenes.
    if(partWidth>W-EDGE*2&&part.trim()){
     for(const char of part){
      ctx.font=fontFor(size,span);
      const cw=ctx.measureText(char).width;
      if(width+cw>W-EDGE*2&&width){result.push(line);line=[];width=0}
      line.push({...span,text:char,width:cw});width+=cw;
     }
    }else{line.push({...span,text:part,width:partWidth});width+=partWidth}
   }
  }
  if(line.length)result.push(line);
 }
 return result;
}
function drawStrap(y,isCover){
 if(!el('showStrap').checked)return;
 const content=el('strapText').value.replace(/\s+/g,' ').trim().toLocaleUpperCase('es-AR'),maxWidth=W-EDGE*2;
 let size=isCover?40:38;
 ctx.textBaseline='middle';
 while(size>16){ctx.font='800 '+size+'px Inter,Arial,sans-serif';if(ctx.measureText(content).width<=maxWidth-44)break;size--}
 const textWidth=ctx.measureText(content).width,barHeight=isCover?COVER_STRAP_HEIGHT:INTERNAL_STRAP_HEIGHT;
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
  const scale=Math.max(W/image.width,photoBottom/image.height)*zoom,iw=image.width*scale,ih=image.height*scale;
  const maxX=Math.max(0,(iw-W)/2),maxY=Math.max(0,(ih-photoBottom)/2);
  offsetX=Math.max(-maxX,Math.min(maxX,offsetX));offsetY=Math.max(-maxY,Math.min(maxY,offsetY));
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,photoBottom);ctx.clip();
  ctx.drawImage(image,(W-iw)/2+offsetX,(photoBottom-ih)/2+offsetY,iw,ih);ctx.restore();
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
  if(pageVariant==='blank'){
   // Placa neutra completa; no se dibuja foto, logo, volanta ni textos.
   ctx.clearRect(0,0,W,H);
   ctx.fillStyle='#aeb4bc';ctx.fillRect(0,0,W,H);
   photoBottom=H;
   window.__editorialHotspotBounds={text:{left:0,top:0,right:0,bottom:0},logo:{left:0,top:0,right:0,bottom:0}};
   updatePhotoDropzone();
   el('sizeLabel').textContent=el('size').value;
   el('zoomLabel').textContent=Math.round(zoom*100)+' %';
   el('photoZoom').value=Math.round(zoom*100);
   el('status').textContent='Sin diseño · Elegí Portada o Interior para aplicar una composición.';
   return;
  }
  const cover=pageVariant==='cover',requestedSize=Number(el('size').value);
  const footerBaseline=H-EDGE,footerTop=footerBaseline-28;
  const availableBottom=cover?footerTop-50:H-EDGE;
  const desired=forceUppercase?el('headline').value.toLocaleUpperCase('es-AR'):el('headline').value;
  let size=requestedSize,lines=wrappedLines(desired,size);
  const lineHeight=()=>Math.round(size*1.09);
  function textTop(){return availableBottom-(lines.length?size*0.85+(lines.length-1)*lineHeight():0)}
  const showBar=el('showStrap').checked;
  const barHeight=showBar?(cover?COVER_STRAP_HEIGHT:INTERNAL_STRAP_HEIGHT):0;
  const requiredGap=cover?80:80;
  while(size>32&&textTop()-(showBar?barHeight+requiredGap:80)<230){
    size-=2;lines=wrappedLines(desired,size);
  }
  const gap=lineHeight(),baselines=lines.map((_,i)=>availableBottom-(lines.length-1-i)*gap);
  const top=lines.length?baselines[0]-size:availableBottom;
  let panelTop,barY;
  if(cover){
   // La distancia desde el borde inferior de la volanta hasta el texto es 50 px.
   // Sin volanta, se mide desde el borde inferior de la línea roja de 13 px.
   panelTop=Math.max(160,top-(showBar?50+COVER_STRAP_HEIGHT/2:56.5));
   barY=panelTop-COVER_STRAP_HEIGHT/2;
  }else{
   panelTop=Math.max(160,top-50-(showBar?barHeight:0));
   barY=panelTop;
  }
  const imageBottom=cover?panelTop:panelTop;
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
  // Ubicaciones en píxeles reales de la placa, usadas solo por el overlay HTML.
  // La unión de renglones evita seleccionar toda la caja blanca.
  const richWidths=lines.map(line=>line.reduce((total,part)=>total+part.width,0));
  const left=textAlignment==='center'?Math.min(...richWidths.map(w=>(W-w)/2)):EDGE;
  const right=textAlignment==='center'?Math.max(...richWidths.map(w=>(W+w)/2)):Math.max(...richWidths.map(w=>EDGE+w));
  // Mismo padding que Diario Show: 14 px internos + 12 px externos,
  // 1.05x del cuerpo arriba y .28x debajo de la línea base, más 10 px.
  const textRect={left:Math.max(0,left-26),top:Math.max(0,(baselines[0]??availableBottom)-size*1.05-10),
   right:Math.min(W,right+26),bottom:Math.min(H,(baselines.at(-1)??availableBottom)+size*.28+10)};
  const logoRect={left:W-EDGE-LOGO_WIDTH-54,top:EDGE-54,
   right:W-EDGE+54,bottom:EDGE+LOGO_HEIGHT+54};
  window.__editorialHotspotBounds={text:textRect,logo:logoRect};

  if(cover){
   // Pie: texto en caja baja y flecha alineados por su centro vertical.
   const footerCenterY=H-EDGE-16;
   ctx.save();
   ctx.fillStyle=RED;ctx.textBaseline='middle';
   ctx.font='500 30px Inter,Arial,sans-serif';
   ctx.textAlign=footerStyle==='center'?'center':'left';
   ctx.fillText('cronica.com.ar',footerStyle==='center'?W/2:EDGE,footerCenterY);
   if(footerStyle==='carousel'){
    ctx.font='54px "Material Icons"';ctx.textAlign='right';
    ctx.fillText('arrow_forward',W-EDGE,footerCenterY);
   }
   ctx.restore();
  }
  updatePhotoDropzone();
  el('sizeLabel').textContent=el('size').value;
  el('zoomLabel').textContent=Math.round(zoom*100)+' %';el('photoZoom').value=Math.round(zoom*100);
  el('status').textContent=size<requestedSize?'Texto largo: tamaño ajustado para respetar los márgenes.':'Vista previa activa · Arrastrá la foto para reencuadrarla.';
 }catch(error){el('status').textContent='Error de vista previa: '+error.message;console.error(error)}
finally{window.dispatchEvent(new Event('modern:render'))}
}
/* Cada placa conserva sus propios controles, foto, zoom y encuadre durante la edición. */
let carouselPages=[],activePage=0;
function readCurrentPage(){
 return {headline:el('headline').value,strapText:el('strapText').value.toLocaleUpperCase('es-AR'),showStrap:el('showStrap').checked,
  size:el('size').value,alignment:textAlignment,forceUppercase,logo:selectedLogo,image,zoom,offsetX,offsetY,variant:pageVariant};
}
// Textos de orientación que muestran cómo aprovechar portada, volanta y placas internas.
const COVER_STRAP="RESUMÍ ACÁ EL TEMA";
// Ejemplo común para una nueva diapositiva: funciona tanto en Portada como en Interior.
const DEFAULT_STRAP=COVER_STRAP;
const COVER_HEADLINE="Escribí un título claro y directo. *Destacá el dato principal* y dejá los detalles para las siguientes placas.";
const INTERNAL_HEADLINE="En esta placa podés ampliar la información. Explicá qué pasó, quiénes están involucrados y por qué es importante. Usá frases cortas y una idea por vez para facilitar la lectura.";
function newBlankPage(){
 return {headline:INTERNAL_HEADLINE,strapText:DEFAULT_STRAP,showStrap:true,size:'52',alignment:'left',forceUppercase:false,logo:'primary',
  image:null,zoom:1,offsetX:0,offsetY:0,variant:'blank'};
}
function saveActivePage(){if(carouselPages[activePage])carouselPages[activePage]=readCurrentPage()}
function syncVariantUI(){
 // La variante controla también el DOM de Formato y sus espejos mobile.
 document.documentElement.dataset.cronicaVariant=pageVariant;
 document.querySelectorAll('.cronica-variant-option').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pageVariant===pageVariant)));
}
function loadPage(page){
 pageVariant=['blank','cover','internal'].includes(page.variant)?page.variant:'blank';syncVariantUI();
 el('headline').value=page.headline;el('strapText').value=String(page.strapText||'').toLocaleUpperCase('es-AR');
 el('showStrap').checked=page.showStrap;el('strapField').hidden=!page.showStrap;el('size').value=page.size;
 forceUppercase=Boolean(page.forceUppercase);syncUppercaseUI();
 selectedLogo=page.logo||'primary';syncLogoChoices();
 textAlignment=page.alignment;image=page.image;zoom=page.zoom;offsetX=page.offsetX;offsetY=page.offsetY;
 el('file').value='';dragging=false;
 el('alignLeft').setAttribute('aria-pressed',String(page.alignment==='left'));
 el('alignCenter').setAttribute('aria-pressed',String(page.alignment==='center'));
 render();
}
function renderCarouselNavigation(){
 const list=el('carouselPages');list.replaceChildren();
 carouselPages.forEach((page,index)=>{
  const button=document.createElement('button');button.type='button';
  button.setAttribute('aria-current',index===activePage?'page':'false');
  const variant=['blank','cover','internal'].includes(page.variant)?page.variant:'blank';
  const variantName={blank:'Sin diseño',cover:'Portada',internal:'Interior'}[variant];
  button.setAttribute('aria-label','Página '+(index+1)+', '+variantName.toLowerCase());
  button.setAttribute('title','Página '+(index+1)+' · '+variantName);
  button.className='carousel-page-thumb';
  button.dataset.variant=variant;
  // Se clona la miniatura real del selector, sin recrear sus colores ni
  // su composición. El aro de selección pertenece únicamente a este botón.
  const original=document.querySelector('.cronica-variant-option[data-page-variant="'+variant+'"] .cronica-variant-thumbnail');
  const composition=document.createElement('span');
  composition.className='carousel-design-copy editor-panel';
  composition.setAttribute('aria-hidden','true');
  if(original)composition.appendChild(original.cloneNode(true));
  const number=document.createElement('span');
  number.className='carousel-page-number';
  number.textContent=String(index+1);
  button.append(composition,number);
  button.addEventListener('click',()=>selectPage(index));list.appendChild(button);
 });
 // Una miniatura punteada al final permite añadir una diapositiva sin
 // abandonar la navegación. Usa exactamente el mismo controlador existente.
 const addTile=document.createElement('button');
 addTile.type='button';addTile.className='carousel-add-placeholder';
 addTile.setAttribute('aria-label','Agregar nueva diapositiva');
 addTile.setAttribute('title','Agregar nueva diapositiva');
 const addIcon=document.createElement('span');
 addIcon.className='material-icons';addIcon.setAttribute('aria-hidden','true');
 addIcon.textContent='add';
 addTile.append(addIcon);
 addTile.addEventListener('click',()=>el('addPage').click());
 list.appendChild(addTile);
 const indicator=el('pageIndicator');
 const count=document.createElement('span');
 count.className='carousel-indicator-count';
 count.textContent=(activePage+1)+' de '+carouselPages.length;
 const type=document.createElement('span');
 type.className='carousel-indicator-type is-'+pageVariant;
 type.textContent={blank:'Sin diseño',cover:'Portada',internal:'Interior'}[pageVariant];
 indicator.replaceChildren(count,type);
 el('removePage').disabled=activePage===0;
 // Con espacio libre, la miniatura punteada es el botón de agregar.
 // Cuando desborda, el botón fijo se incorpora junto al de eliminar;
 // la fila sigue desplazándose horizontalmente por debajo de las acciones.
 const recalc=()=>{
  const host=list.closest('.cronica-preview-pages');
  if(!host)return;
  host.classList.toggle('carousel-is-overflowing',list.scrollWidth>list.clientWidth+2);
 };
 requestAnimationFrame(recalc);
 if(!list.dataset.resizeObserved&&typeof ResizeObserver!=='undefined'){
  list.dataset.resizeObserved='true';
  new ResizeObserver(recalc).observe(list);
 }
 // En la barra horizontal de la preview, mantener siempre a la vista
 // la página seleccionada sin desplazar verticalmente todo el documento.
 requestAnimationFrame(()=>{
  const active=list.querySelector('[aria-current="page"]');
  if(!active||!list.clientWidth)return;
  const left=active.offsetLeft-list.offsetLeft;
  const right=left+active.offsetWidth;
  if(left<list.scrollLeft)list.scrollLeft=Math.max(0,left-4);
  else if(right>list.scrollLeft+list.clientWidth)
   list.scrollLeft=right-list.clientWidth+4;
 });
}
function selectPage(index){
 if(index===activePage||index<0||index>=carouselPages.length)return;
 saveActivePage();activePage=index;loadPage(carouselPages[index]);renderCarouselNavigation();
}
function installCarouselDragScroll(){
 const track=el('carouselPages');
 let drag=null,suppressClick=false;
 track.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch'||event.button!==0)return;
  drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,scrollX:track.scrollLeft,moved:false};
 });
 track.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
  if(!drag.moved&&Math.abs(dx)<5)return;
  if(!drag.moved&&Math.abs(dy)>Math.abs(dx))return;
  if(!drag.moved){drag.moved=true;track.classList.add('is-dragging');track.setPointerCapture(event.pointerId)}
  track.scrollLeft=drag.scrollX-dx;
  event.preventDefault();
 });
 const stop=event=>{
  if(!drag||drag.id!==event.pointerId)return;
  if(drag.moved){suppressClick=true;track.classList.remove('is-dragging');}
  drag=null;
 };
 track.addEventListener('pointerup',stop);
 track.addEventListener('pointercancel',stop);
 track.addEventListener('lostpointercapture',stop);
 track.addEventListener('click',event=>{
  if(!suppressClick)return;
  suppressClick=false;event.preventDefault();event.stopImmediatePropagation();
 },true);
 // Cada interacción nueva sin arrastre debe poder seleccionar las miniaturas.
 track.addEventListener('pointerdown',()=>{suppressClick=false},true);
}
function initializeCarousel(){
 installCarouselDragScroll();
 carouselPages=[readCurrentPage()];activePage=0;renderCarouselNavigation();
 el('addPage').addEventListener('click',()=>{
  saveActivePage();const index=activePage+1;carouselPages.splice(index,0,newBlankPage());
  activePage=index;loadPage(carouselPages[index]);renderCarouselNavigation();
 });
 el('removePage').addEventListener('click',()=>{
  if(activePage===0)return;
  carouselPages.splice(activePage,1);activePage=Math.min(activePage,carouselPages.length-1);
  loadPage(carouselPages[activePage]);renderCarouselNavigation();
 });
}

document.querySelectorAll('.cronica-variant-option').forEach(button=>button.addEventListener('click',()=>{
 const next=button.dataset.pageVariant;
 if(next===pageVariant)return;
 const previous=pageVariant;
 pageVariant=next;
 // Una placa sin diseño no muestra volanta. Al aplicar Portada o Interior,
 // el usuario comienza con la volanta activa y su texto de ejemplo.
 if(previous==='blank'&&next!=='blank'){
  el('showStrap').checked=true;
  if(!el('strapText').value.trim())el('strapText').value=DEFAULT_STRAP;
  el('strapField').hidden=false;
 }
 syncVariantUI();saveActivePage();renderCarouselNavigation();render();
}));
document.querySelectorAll('.logo-choice').forEach(button=>button.addEventListener('click',()=>{selectedLogo=button.dataset.logo;syncLogoChoices();render()}));
el('showStrap').addEventListener('change',()=>{el('strapField').hidden=!el('showStrap').checked;render()});
for(const id of ['headline','size'])el(id).addEventListener('input',render);
el('strapText').addEventListener('input',()=>{
 const field=el('strapText'),start=field.selectionStart,end=field.selectionEnd;
 const value=field.value.toLocaleUpperCase('es-AR');
 if(field.value!==value){
  field.value=value;
  // Conservar cursor y selección al normalizar las letras.
  if(start!==null&&end!==null)field.setSelectionRange(start,end);
 }
 render();
});
el('formatUppercase').addEventListener('click',()=>{forceUppercase=!forceUppercase;syncUppercaseUI();render()});
for(const [id,value] of [['alignLeft','left'],['alignCenter','center']])el(id).addEventListener('click',()=>{
 textAlignment=value;el('alignLeft').setAttribute('aria-pressed',String(value==='left'));
 el('alignCenter').setAttribute('aria-pressed',String(value==='center'));render();
});
for(const [id,marker] of [['formatAccent','*'],['formatItalic','_'],['formatStrike','~']]){const button=el(id);button.addEventListener('mousedown',e=>e.preventDefault());button.addEventListener('click',()=>{const field=el('headline'),a=field.selectionStart,b=field.selectionEnd;if(a===b){field.focus();return}const selected=field.value.slice(a,b);field.setRangeText(marker+selected+marker,a,b,'select');field.setSelectionRange(a+1,b+1);field.focus();render()})}

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
 stage.style.setProperty('--photo-height',(photoBottom/H*100)+'%');
 updateHoverBorderGeometry();
 canvas.style.cursor=image?'grab':'default';
}
function loadPhoto(file){
 if(!file)return;
 setPhotoHover(false);
 if(!file.type.startsWith('image/')){el('status').textContent='Seleccioná un archivo de imagen válido.';return}
 const pageIndex=activePage,url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{
  if(pageIndex===activePage){image=img;zoom=1;offsetX=0;offsetY=0;render()}
  else if(carouselPages[pageIndex]){carouselPages[pageIndex].image=img;carouselPages[pageIndex].zoom=1;carouselPages[pageIndex].offsetX=0;carouselPages[pageIndex].offsetY=0}
  URL.revokeObjectURL(url);
 };
 img.onerror=()=>{el('status').textContent='No se pudo abrir esta fotografía';URL.revokeObjectURL(url)};
 img.src=url;
}
el('file').addEventListener('change',event=>{loadPhoto(event.target.files[0]);event.target.value=''});
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
el('photoZoom').addEventListener('input',event=>{zoom=Number(event.target.value)/100;render()});
canvas.addEventListener('pointerdown',event=>{if(!image)return;const r=canvas.getBoundingClientRect();if((event.clientY-r.top)*H/r.height>photoBottom)return;dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId)});
canvas.addEventListener('pointermove',event=>{if(!dragging)return;const ratio=W/canvas.getBoundingClientRect().width;offsetX+=(event.clientX-lastX)*ratio;offsetY+=(event.clientY-lastY)*ratio;lastX=event.clientX;lastY=event.clientY;render()});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
el('clearAll').addEventListener('click',()=>{
 const initial=newBlankPage();initial.variant=pageVariant;if(pageVariant==='cover'){initial.headline=COVER_HEADLINE;initial.strapText=COVER_STRAP;initial.showStrap=true;initial.size='64';initial.alignment='center'}
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
/* El aviso sigue el borde derecho real del canvas. Se desplaza hacia
   adentro cuando faltarían menos de 24px al borde de la pantalla. */
function positionBrowserZoomTip(){
 const tip=el('browserZoomTip');
 const stage=el('photoStage');
 if(!tip||!stage||tip.hidden||document.documentElement.clientWidth<=700)return;
 const stageRect=stage.getBoundingClientRect();
 const tipWidth=tip.getBoundingClientRect().width;
 const viewportWidth=document.documentElement.clientWidth;
 // A la derecha de la placa (+24px), hasta que toca el límite de 20px.
 // Al reducir el viewport se superpone a la placa, sin cambiar el layout.
 const left=Math.min(stageRect.right+24,viewportWidth-tipWidth-20);
 const top=stageRect.top+24;
 tip.style.setProperty('--zoom-tip-x',left+'px');
 tip.style.setProperty('--zoom-tip-y',top+'px');
}
let zoomTipPositionFrame=0;
function scheduleBrowserZoomTipPosition(){
 if(zoomTipPositionFrame)return;
 zoomTipPositionFrame=window.requestAnimationFrame(()=>{
  zoomTipPositionFrame=0;
  positionBrowserZoomTip();
 });
}
window.addEventListener('resize',scheduleBrowserZoomTipPosition);
window.addEventListener('scroll',scheduleBrowserZoomTipPosition,{passive:true});
if(typeof ResizeObserver!=='undefined'){
 const zoomTipResizeObserver=new ResizeObserver(scheduleBrowserZoomTipPosition);
 zoomTipResizeObserver.observe(el('photoStage'));
 zoomTipResizeObserver.observe(el('browserZoomTip'));
 zoomTipResizeObserver.observe(el('browserZoomTip').closest('.preview'));
}
el('dismissBrowserZoomTip').addEventListener('click',()=>{el('browserZoomTip').hidden=true;});
scheduleBrowserZoomTipPosition();
initializeCarousel();syncUppercaseUI();render();document.fonts.ready.then(render);
})();