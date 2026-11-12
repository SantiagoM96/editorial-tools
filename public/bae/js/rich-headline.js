/* Crónica DEV — editor visual de texto principal. El textarea original conserva
   el contrato de serialización con canvas/exportación; el usuario ve el estilo. */
(()=>{
'use strict';
const source=document.getElementById('headline');
if(!source)return;
const flags=['accent','italic','strike'],marks={accent:'*',italic:'_',strike:'~'};
const charsFromMarkup=text=>{
 const chars=[],state={accent:false,italic:false,strike:false};
 for(const c of String(text||'')){
  const key=c==='*'?'accent':c==='_'?'italic':c==='~'?'strike':null;
  if(key)state[key]=!state[key];
  else chars.push({c,accent:state.accent,italic:state.italic,strike:state.strike});
 }
 return chars;
};
const asMarkup=chars=>{
 let out='',prev={accent:false,italic:false,strike:false};
 for(const ch of [...chars,{c:null,accent:false,italic:false,strike:false}]){
  // Cerrar en orden inverso y abrir en orden fijo para evitar estados cruzados.
  for(const f of [...flags].reverse())if(prev[f]&&!ch[f])out+=marks[f];
  for(const f of flags)if(!prev[f]&&ch[f])out+=marks[f];
  if(ch.c!==null)out+=ch.c;
  prev=ch;
 }
 return out;
};
const editors=[];
function fromDOM(editor){
 const items=[];
 const walk=(node,state)=>{
  if(node.nodeType===Node.TEXT_NODE){
   for(const c of node.nodeValue||'')items.push({c,...state});
   return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  if(node.tagName==='BR'){items.push({c:'\n',...state});return}
  const next={...state};
  if(node.dataset.accent==='true'||node.tagName==='B'||node.tagName==='STRONG')next.accent=true;
  if(node.dataset.italic==='true'||node.tagName==='I'||node.tagName==='EM')next.italic=true;
  if(node.dataset.strike==='true'||node.tagName==='S'||node.tagName==='STRIKE')next.strike=true;
  // El editor normal no añade bloques; este caso cubre pegado HTML accidental.
  if(['DIV','P'].includes(node.tagName)&&items.length&&items.at(-1)?.c!=='\n')
   items.push({c:'\n',...state});
  node.childNodes.forEach(child=>walk(child,next));
 };
 editor.childNodes.forEach(node=>walk(node,{accent:false,italic:false,strike:false}));
 return items;
}
function renderChars(editor,chars){
 const fragment=document.createDocumentFragment();
 for(let i=0;i<chars.length;){
  const first=chars[i],start=i;
  while(i<chars.length&&flags.every(f=>chars[i][f]===first[f]))i++;
  const text=chars.slice(start,i).map(x=>x.c).join('');
  if(flags.some(f=>first[f])){
   const span=document.createElement('span');
   for(const f of flags)if(first[f])span.dataset[f]='true';
   span.textContent=text;fragment.append(span);
  }else fragment.append(document.createTextNode(text));
 }
 editor.replaceChildren(fragment);
}
function offsets(editor){
 const selection=window.getSelection();
 if(!selection?.rangeCount)return null;
 const range=selection.getRangeAt(0);
 if(!editor.contains(range.startContainer)||!editor.contains(range.endContainer))return null;
 const start=document.createRange();start.selectNodeContents(editor);start.setEnd(range.startContainer,range.startOffset);
 const end=document.createRange();end.selectNodeContents(editor);end.setEnd(range.endContainer,range.endOffset);
 return [start.toString().length,end.toString().length];
}
function setSelection(editor,start,end){
 const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 const point=index=>{
  let rest=index;
  for(const n of nodes){if(rest<=n.nodeValue.length)return[n,rest];rest-=n.nodeValue.length}
  const last=nodes.at(-1);return last?[last,last.nodeValue.length]:[editor,0];
 };
 const [s,so]=point(start),[e,eo]=point(end);
 const range=document.createRange();range.setStart(s,so);range.setEnd(e,eo);
 const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
}
function publish(editor){
 const value=asMarkup(fromDOM(editor));
 editors.forEach(e=>{if(e!==editor)renderChars(e,charsFromMarkup(value))});
 editor.dataset.currentMarkup=value;
 editors.forEach(e=>e.dataset.currentMarkup=value);
 if(source.value!==value){source.value=value;source.dispatchEvent(new Event('input',{bubbles:true}))}
}
function changeFormat(key,clear=false){
 const selection=window.getSelection();
 const editor=editors.find(e=>selection?.anchorNode&&e.contains(selection.anchorNode));
 if(!editor){editors[0]?.focus();return}
 const bounds=offsets(editor);if(!bounds||bounds[0]===bounds[1]){editor.focus();return}
 const [start,end]=bounds,chars=fromDOM(editor);
 const range=chars.slice(start,end);
 if(!range.length)return;
 const next=clear?false:!range.every(ch=>ch[key]);
 for(let i=start;i<end;i++){
  if(clear)for(const f of flags)chars[i][f]=false;
  else chars[i][key]=next;
 }
 renderChars(editor,chars);editor.focus({preventScroll:true});setSelection(editor,start,end);publish(editor);
}
function makeEditor(textarea){
 const editor=document.createElement('div');
 editor.className='cronica-rich-headline';
 editor.setAttribute('contenteditable','true');
 editor.setAttribute('role','textbox');
 editor.setAttribute('aria-label','Texto principal. Seleccioná un fragmento y usá los botones de formato.');
 editor.setAttribute('aria-multiline','true');
 editor.setAttribute('spellcheck','true');
 textarea.after(editor);textarea.classList.add('cronica-rich-source');
 editors.push(editor);
 renderChars(editor,charsFromMarkup(source.value));editor.dataset.currentMarkup=source.value;
 editor.addEventListener('input',()=>publish(editor));
 editor.addEventListener('paste',event=>{
  event.preventDefault();
  const value=event.clipboardData?.getData('text/plain')||'';
  document.execCommand('insertText',false,value);
 });
 editor.addEventListener('beforeinput',event=>{
  if(event.inputType!=='insertParagraph'&&event.inputType!=='insertLineBreak')return;
  event.preventDefault();
  const sel=window.getSelection();if(!sel?.rangeCount)return;
  const range=sel.getRangeAt(0);range.deleteContents();
  const node=document.createTextNode('\n');range.insertNode(node);
  range.setStartAfter(node);range.collapse(true);sel.removeAllRanges();sel.addRange(range);
  publish(editor);
 });
 return editor;
}
function syncFromSource(){
 const val=source.value;
 for(const editor of editors)if(editor.dataset.currentMarkup!==val){
  renderChars(editor,charsFromMarkup(val));editor.dataset.currentMarkup=val;
 }
}
makeEditor(source);
const mobile=document.getElementById('headlineMobile');
if(mobile)makeEditor(mobile);
for(const [id,key] of [['formatAccent','accent'],['formatItalic','italic'],['formatStrike','strike'],['formatClear','clear']]){
 for(const suffix of ['', 'Mobile']){
  const button=document.getElementById(id+suffix);if(!button)continue;
  button.title={accent:'Destacar o quitar destacado de la selección',italic:'Aplicar o quitar cursiva',strike:'Aplicar o quitar tachado',clear:'Quitar todos los formatos de la selección'}[key];
 }
}
// Captura previa a los handlers antiguos para que no se inserten símbolos.
document.addEventListener('pointerdown',event=>{
 if(event.target.closest('[id^="formatAccent"],[id^="formatItalic"],[id^="formatStrike"],[id^="formatClear"]'))event.preventDefault();
},true);
document.addEventListener('click',event=>{
 const button=event.target.closest('button[id]');
 if(!button)return;
 const id=button.id.replace(/Mobile$/,'');
 const key={formatAccent:'accent',formatItalic:'italic',formatStrike:'strike',formatClear:'clear'}[id];
 if(!key)return;
 event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
 changeFormat(key,key==='clear');
},true);
window.addEventListener('modern:render',syncFromSource);
})();