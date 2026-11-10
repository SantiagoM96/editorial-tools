
(function(){
'use strict';
const $=id=>document.getElementById(id);
const article=$('articleUrl'),button=$('importArticle'),status=$('importStatus');
const timeout=ms=>AbortSignal.timeout(ms);
function fixEncoding(s){s=String(s||'');if(!/[ÃÂâ][\x80-\xBF\xA0-\xFF]/.test(s))return s;try{const bytes=Uint8Array.from([...s].map(c=>c.charCodeAt(0)));const fixed=new TextDecoder('utf-8',{fatal:true}).decode(bytes);return fixed.includes('�')?s:fixed}catch{return s}}
function getMeta(html,base){
const doc=new DOMParser().parseFromString(html,'text/html');
const meta=key=>doc.querySelector('meta[property="'+key+'"],meta[name="'+key+'"]')?.getAttribute('content')?.trim()||'';
const cleanTitle=value=>fixEncoding(String(value||'').replace(/\s*[|\-–]\s*(?:Diario\s*Show|Cr[oó]nica(?:\.com\.ar)?)\s*$/i,'').trim());
let ldTitle='',ldImage='';
for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){
 try{
  const json=JSON.parse(script.textContent||'null');
  const candidates=Array.isArray(json)?json:(json?.['@graph']||[json]);
  for(const item of candidates){
   if(!item||!/(NewsArticle|Article)/i.test(String(item['@type']||'')))continue;
   ldTitle=ldTitle||item.headline||'';
   const media=item.image;
   ldImage=ldImage||(Array.isArray(media)?media[0]?.url||media[0]?.contentUrl||media[0]:media?.url||media?.contentUrl||media)||'';
  }
 }catch{}
}
const title=cleanTitle(meta('og:title')||meta('twitter:title')||ldTitle||doc.querySelector('h1')?.textContent||doc.title||'');
let image=meta('og:image:secure_url')||meta('og:image')||meta('twitter:image')||ldImage||doc.querySelector('article img[data-src],article img[src], .image img[data-src], .image img[src], .media img[src], img[data-src]')?.getAttribute('data-src')||doc.querySelector('article img[src], .image img[src], .media img[src]')?.getAttribute('src')||'';
try{image=image?new URL(image,base).href:''}catch{image=''}
return {title,image};
}
async function fetchText(url){const res=await fetch(url,{signal:timeout(10000)});if(!res.ok)throw Error('HTTP '+res.status);return res.text()}
async function extract(url){
const services=[
async()=>{const response=JSON.parse(await fetchText('https://api.microlink.io?url='+encodeURIComponent(url)));if(response.status!=='success')throw Error(response.message||'Microlink sin datos');return {title:fixEncoding(response.data?.title||''),image:response.data?.image?.url||''}},
async()=>getMeta(await fetchText('https://api.allorigins.win/raw?url='+encodeURIComponent(url)),url),
async()=>getMeta(await fetchText('https://corsproxy.io/?url='+encodeURIComponent(url)),url),
async()=>{const txt=await fetchText('https://r.jina.ai/'+url);const title=fixEncoding(txt.match(/^Title:\s*(.+)$/mi)?.[1]||txt.match(/^#\s+(.+)$/m)?.[1]||'');const images=[...txt.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)].map(m=>m[1]);return {title,image:images.find(u=>!/(logo|icon|avatar|favicon|pixel|tracking)/i.test(u))||images[0]||''}}
];
const errors=[],result={title:'',image:''};
for(const service of services){try{const data=await service();if(data.title&&!result.title)result.title=fixEncoding(data.title).replace(/\s*[|\-–]\s*(?:Diario\s*Show|Cr[oó]nica(?:\.com\.ar)?)\s*$/i,'').trim();if(data.image&&!result.image)result.image=data.image;if(result.title&&result.image)break}catch(e){errors.push(e.message)}}
if(result.title)return result;
throw Error('No fue posible obtener el título. '+errors.join('; '));
}
function validateExportableImage(img){
 const test=document.createElement('canvas');test.width=2;test.height=2;
 const testCtx=test.getContext('2d');testCtx.drawImage(img,0,0,2,2);
 testCtx.getImageData(0,0,1,1);
 return img;
}
async function fetchImage(url){
 const options=[
  url,
  'https://wsrv.nl/?url='+encodeURIComponent(url)+'&output=jpg',
  'https://api.allorigins.win/raw?url='+encodeURIComponent(url),
  'https://corsproxy.io/?url='+encodeURIComponent(url)
 ];
 for(const endpoint of options){
  try{
   const res=await fetch(endpoint,{signal:timeout(12000)});
   if(!res.ok)continue;
   const blob=await res.blob();
   if(!blob.type.startsWith('image/'))continue;
   const objectURL=URL.createObjectURL(blob);
   try{
    const img=new Image();img.src=objectURL;await img.decode();
    return validateExportableImage(img);
   }finally{URL.revokeObjectURL(objectURL)}
  }catch(error){console.warn('No se pudo importar fotografía exportable:',error)}
 }
 throw Error('No se pudo descargar una versión exportable de la foto. Cargala manualmente.');
}
button.addEventListener('click',async()=>{
let url;try{
 url=new URL(article.value.trim());
 const host=url.hostname.toLowerCase();
 const legacy=['www.diarioshow.com','diarioshow.com'].includes(host);
 const cronica=['www.cronica.com.ar','cronica.com.ar'].includes(host)&&/^\/diarioshow(?:\/|$)/i.test(url.pathname);
 if(url.protocol!=='https:'||(!legacy&&!cronica))throw Error('Ingresá una noticia HTTPS de cronica.com.ar/diarioshow/ o diarioshow.com');
}catch(e){status.textContent=e.message;return}
button.disabled=true;$('importOverlay').hidden=false;window.DiarioShowEditor.setImporting(true);status.textContent='Buscando el título y la fotografía…';
try{
const data=await extract(url.href);
$('headline').value=data.title;
// Los controles enableQuote y quote ya no existen en el editor actual.
// Limpiar la foto anterior para que no se mezcle con la nueva noticia.
window.DiarioShowEditor.setImage(null);
if(data.image){status.textContent='Título importado. Descargando fotografía…';try{const img=await fetchImage(data.image);window.DiarioShowEditor.setImage(img);status.textContent='Título y fotografía importados correctamente.'}catch(e){status.textContent='Título importado, pero no se pudo descargar la foto ('+e.message+'). Podés cargarla manualmente.'}}
else status.textContent='Título importado. No se encontró una foto principal.';
}catch(e){status.textContent='No se pudo importar la noticia. '+e.message}
finally{button.disabled=false;$('importOverlay').hidden=true;window.DiarioShowEditor.setImporting(false)}
});
})();
