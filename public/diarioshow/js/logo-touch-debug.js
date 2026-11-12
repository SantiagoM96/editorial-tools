(()=>{
'use strict';
const stage=document.getElementById('photoStage');
const canvas=document.getElementById('art');
const host=document.getElementById('dsMobileTextEditor');
const content=document.querySelector('#dsMobileControlsPanel .ds-content-group');
const format=document.getElementById('dsMobileControlsTab');
if(!stage||!canvas||!host||!content||!format)return;
const originalNext=content.nextSibling,originalParent=content.parentNode;
const textModule=host.querySelector('.ds-texts-group');
const target=document.createElement('button');
target.type='button';
target.className='ds-logo-touch-debug';
target.setAttribute('aria-label','Abrir Contenido desde el logo de Diario Show');
Object.assign(target.style,{position:'fixed',zIndex:'2147483647',background:'rgba(255,230,0,.65)',border:'2px solid #ffe600',borderRadius:'4px',boxSizing:'border-box',padding:'0',cursor:'pointer',touchAction:'manipulation',display:'none'});
document.body.append(target);
let showingContent=false;
const mobile=()=>matchMedia('(max-width:700px)').matches;
const preview=()=>document.querySelector('main')?.dataset.mobileTab==='preview';
function place(){
 const visible=mobile()&&preview()&&document.querySelector('.logo-choice[aria-pressed="true"]')?.dataset.logo!=='none';
 target.style.display=visible?'block':'none';
 if(!visible)return;
 const rect=canvas.getBoundingClientRect(),scale=rect.width/1080;
 const w=75*1.25*1.15,h=w*275/253,extra=54;
 const left=document.querySelector('[data-logo-position="left"][aria-pressed="true"],[data-position="left"][aria-pressed="true"]')!==null;
 Object.assign(target.style,{
 left:(rect.left+((left?80:1080-80-w)-extra)*scale)+'px',
 top:(rect.top+(80-extra)*scale)+'px',
 width:((w+2*extra)*scale)+'px',
 height:((h+2*extra)*scale)+'px'
 });
}
function restore(){
 if(!showingContent)return;
 if(originalNext&&originalNext.parentNode===originalParent)originalParent.insertBefore(content,originalNext);
 else originalParent.append(content);
 if(textModule)textModule.hidden=false;
 showingContent=false;
}
function showContent(){
 if(!mobile()||!preview())return;
 if(!showingContent){
  host.append(content);
  if(textModule)textModule.hidden=true;
  showingContent=true;
 }
 const toggle=content.querySelector('.ds-control-card-toggle');
 const body=content.querySelector('.ds-control-card-body');
 if(toggle)toggle.setAttribute('aria-expanded','true');
 if(body)body.hidden=false;
 requestAnimationFrame(()=>{
  host.scrollIntoView({behavior:'smooth',block:'nearest'});
  window.dispatchEvent(new Event('resize'));
 });
}
target.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation()});
target.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showContent()});
format.addEventListener('click',()=>{restore();requestAnimationFrame(place)});
document.getElementById('dsMobilePreviewTab')?.addEventListener('click',()=>requestAnimationFrame(place));
document.querySelectorAll('.logo-choice,[data-logo-position],[data-position]').forEach(el=>el.addEventListener('click',()=>requestAnimationFrame(place)));
window.addEventListener('resize',place);
window.addEventListener('scroll',place,true);
new MutationObserver(()=>requestAnimationFrame(place)).observe(document.querySelector('main'),{attributes:true,attributeFilter:['data-mobile-tab']});
requestAnimationFrame(place);
})();