
(function(){
'use strict';
const $=id=>document.getElementById(id);
const article=$('articleUrl'),button=$('importArticle'),status=$('importStatus');
const timeout=ms=>AbortSignal.timeout(ms);
function fixEncoding(s){s=String(s||'');if(!/[ÃÂâ][\x80-\xBF\xA0-\xFF]/.test(s))return s;try{const bytes=Uint8Array.from([...s].map(c=>c.charCodeAt(0)));const fixed=new TextDecoder('utf-8',{fatal:true}).decode(bytes);return fixed.includes('�')?s:fixed}catch{return s}}
function cleanTitle(value){
 return fixEncoding(String(value||'').replace(/\s*[|\-–—]\s*(?:Diario\s*Show|Cr[oó]nica(?:\.com\.ar)?)\s*$/i,'').trim());
}
function isCandidateTitle(value){
 const title=cleanTitle(value);
 return title.length>12 && !/^(diario show|cr[oó]nica|últimas noticias|noticias de|inicio\b|error\b|just a moment|access denied|forbidden)/i.test(title);
}
function normalizeImage(url,base){
 if(url&&typeof url==='object')url=url.url||url.contentUrl||url['@id']||'';
 if(typeof url!=='string')return '';
 try{const u=new URL(url.trim(),base);return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}
}
function uniqueImages(items,base){
 const seen=new Set();
 return items.flatMap(item=>{
  const url=normalizeImage(item,base);
  if(!url||seen.has(url)||/\/(?:favicon|logo|avatar|icon|pixel|tracking)[\W_.-]/i.test(url))return [];
  seen.add(url);return [url];
 });
}
function getMeta(html,base){
 const doc=new DOMParser().parseFromString(html,'text/html');
 const meta=key=>doc.querySelector('meta[property="'+key+'"],meta[name="'+key+'"]')?.getAttribute('content')?.trim()||'';
 const headlines=[],images=[];
 // El JSON-LD de NewsArticle suele contener la fotografía principal original.
 function collect(value){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value)){value.forEach(collect);return}
  const type=[].concat(value['@type']||[]).join(' ');
  if(/NewsArticle|Article/i.test(type)){
   headlines.push(value.headline||'');
   const media=value.image||value.thumbnailUrl;
   if(Array.isArray(media))images.push(...media);
   else if(media)images.push(media);
  }
  if(value['@graph'])collect(value['@graph']);
 }
 for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){
  try{collect(JSON.parse(script.textContent||'null'))}catch{}
 }
 headlines.push(meta('og:title'),meta('twitter:title'),doc.querySelector('h1')?.textContent||'',doc.title||'');
 images.push(meta('og:image:secure_url'),meta('og:image'),meta('twitter:image'),meta('twitter:image:src'));
 for(const img of doc.querySelectorAll('article img, figure img, .article-image img, .image img')){
  images.push(img.getAttribute('data-src'),img.getAttribute('src'),img.getAttribute('data-original'));
 }
 return {title:headlines.map(cleanTitle).find(isCandidateTitle)||'',images:uniqueImages(images,base)};
}
async function fetchText(url){const res=await fetch(url,{signal:timeout(10000)});if(!res.ok)throw Error('HTTP '+res.status);return res.text()}
async function extract(url){
 const result={title:'',images:[]},errors=[];
 const merge=data=>{
  if(!result.title&&isCandidateTitle(data.title))result.title=cleanTitle(data.title);
  result.images=uniqueImages([...result.images,...(data.images||[]),data.image],url);
 };
 // Primero se intenta la información estructurada de la noticia para evitar
 // que la miniatura genérica de un servicio sustituya a la foto periodística.
 const services=[
  async()=>getMeta(await fetchText('https://api.allorigins.win/raw?url='+encodeURIComponent(url)),url),
  async()=>getMeta(await fetchText('https://corsproxy.io/?url='+encodeURIComponent(url)),url),
  async()=>{
   const payload=JSON.parse(await fetchText('https://api.microlink.io?url='+encodeURIComponent(url)));
   if(payload.status!=='success')throw Error(payload.message||'Microlink sin datos');
   const data=payload.data||{};
   return {title:data.title||'',images:uniqueImages([data.image?.url,data.image?.src,null],url)};
  },
  async()=>{
   const txt=await fetchText('https://r.jina.ai/'+url);
   const title=txt.match(/^Title:\s*(.+)$/mi)?.[1]||txt.match(/^#\s+(.+)$/m)?.[1]||'';
   const candidates=[...txt.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)].map(m=>m[1]);
   return {title,images:uniqueImages(candidates,url)};
  }
 ];
 // Consultas paralelas: un proxy caído no bloquea la respuesta de los demás.
 const responses=await Promise.all(services.map(async service=>{
  try{return {data:await service()}}catch(error){return {error:error.message||String(error)}}
 }));
 for(const response of responses){
  if(response.data)merge(response.data);
  else errors.push(response.error);
 }
 if(!result.title)throw Error('No se pudo leer el titular de esta noticia. '+errors.join('; '));
 return result;
}
function validateExportableImage(img){
 const test=document.createElement('canvas');test.width=2;test.height=2;
 const testCtx=test.getContext('2d');testCtx.drawImage(img,0,0,2,2);
 testCtx.getImageData(0,0,1,1);
 return img;
}
async function fetchImage(url){
 const endpoints=[
  url,
  'https://wsrv.nl/?url='+encodeURIComponent(url)+'&output=jpg',
  'https://api.allorigins.win/raw?url='+encodeURIComponent(url),
  'https://corsproxy.io/?url='+encodeURIComponent(url)
 ];
 const attempt=async endpoint=>{
  const res=await fetch(endpoint,{signal:timeout(9000)});
  if(!res.ok)throw Error('HTTP '+res.status);
  const blob=await res.blob();
  // Algunos proxies devuelven octet-stream aunque la respuesta sea una foto.
  if(!blob.size||(!blob.type.startsWith('image/')&&blob.type!=='application/octet-stream'))throw Error('Respuesta sin imagen');
  const objectURL=URL.createObjectURL(blob);
  try{
   const img=new Image();img.src=objectURL;
   await img.decode();
   return validateExportableImage(img);
  }finally{URL.revokeObjectURL(objectURL)}
 };
 // Probamos vías alternativas simultáneamente: una caída de proxy no bloquea
 // los demás ni retrasa la descarga de la fotografía válida.
 try{return await Promise.any(endpoints.map(attempt))}
 catch{throw Error('No se pudo descargar una versión exportable de la foto. Cargala manualmente.')}
}
button.addEventListener('click',async()=>{
let url;try{
 url=new URL(article.value.trim());
 const host=url.hostname.toLowerCase();
 const legacy=['www.diarioshow.com','diarioshow.com'].includes(host);
 const cronica=['www.cronica.com.ar','cronica.com.ar'].includes(host)&&/^\/diarioshow(?:\/|$)/i.test(url.pathname);
 if(url.protocol!=='https:'||(!legacy&&!cronica))throw Error('Ingresá una noticia HTTPS de cronica.com.ar/diarioshow/ o diarioshow.com');
 if(/^\/(?:diarioshow)?\/?$/i.test(url.pathname)||/^\/diarioshow\/(?:farandula|internacional|la-pavada|por-la-red)\/?$/i.test(url.pathname))throw Error('Pegá una URL de noticia individual, no una sección.');
}catch(e){status.textContent=e.message;return}
button.disabled=true;$('importOverlay').hidden=false;window.DiarioShowEditor.setImporting(true);status.textContent='Buscando el título y la fotografía…';
try{
const data=await extract(url.href);
$('headline').value=data.title;
 // No modificar controles de citas eliminados del editor.
 // La imagen nueva sustituye a la anterior y a su placeholder.
 const editor=window.DiarioShowEditor;
 editor.setImage(null);
 const expectedRevision=editor.getPhotoRevision();
if(data.images.length){
 status.textContent='Título importado. Descargando fotografía…';
 try{
  let imported=false;
  for(const imageUrl of data.images.slice(0,8)){
   try{
    const img=await fetchImage(imageUrl);
    if(editor.getPhotoRevision()!==expectedRevision){
     status.textContent='Se conservó la fotografía seleccionada manualmente.';
     imported=true;break;
    }
    editor.setImage(img);
    status.textContent='Título y fotografía importados correctamente.';
    imported=true;break;
   }catch(error){console.warn('Foto candidata descartada:',error.message)}
  }
  if(!imported)status.textContent='Título importado, pero no se pudo descargar la fotografía. Podés cargarla manualmente.';
 }catch(error){status.textContent='Título importado, pero hubo un problema con la fotografía: '+error.message}
}else status.textContent='Título importado. No se encontró una fotografía principal.';
}catch(e){status.textContent='No se pudo importar la noticia. '+e.message}
finally{button.disabled=false;$('importOverlay').hidden=true;window.DiarioShowEditor.setImporting(false)}
});
})();
