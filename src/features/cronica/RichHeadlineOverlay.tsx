import {useEffect,useRef,useState} from 'react';
import {issueContentCommand,subscribeToContent} from './content-bridge';
import {initialContent} from './content-model';
import {formatChars,readMarkup,writeMarkup,type RichChar,type Mark} from './rich-text-model';

const flags=['accent','italic','strike'] as const;
function renderMarkup(editor:HTMLDivElement,value:string){
 const chars=readMarkup(value),fragment=document.createDocumentFragment();
 for(let i=0;i<chars.length;){
  const current=chars[i]!,start=i;
  while(i<chars.length&&flags.every(flag=>chars[i]![flag]===current[flag]))i++;
  const contents=chars.slice(start,i).map(c=>c.c).join('');
  if(flags.some(flag=>current[flag])){
   const span=document.createElement('span');
   for(const flag of flags)if(current[flag])span.dataset[flag]='true';
   span.textContent=contents;fragment.append(span);
  }else fragment.append(document.createTextNode(contents));
 }
 editor.replaceChildren(fragment);
 editor.dataset.currentMarkup=value;
}
function readDOM(editor:HTMLDivElement):RichChar[]{
 const out:RichChar[]=[];
 const walk=(node:Node,state:Omit<RichChar,'c'>)=>{
  if(node.nodeType===Node.TEXT_NODE){
   for(const c of node.nodeValue||'')out.push({c,...state});
   return;
  }
  if(!(node instanceof HTMLElement))return;
  if(node.tagName==='BR'){out.push({c:'\n',...state});return}
  const next={...state};
  for(const flag of flags)if(node.dataset[flag]==='true')next[flag]=true;
  if(node.tagName==='STRONG'||node.tagName==='B')next.accent=true;
  if(node.tagName==='I'||node.tagName==='EM')next.italic=true;
  if(node.tagName==='S'||node.tagName==='STRIKE')next.strike=true;
  node.childNodes.forEach(child=>walk(child,next));
 };
 editor.childNodes.forEach(node=>walk(node,{accent:false,italic:false,strike:false}));
 return out;
}
function offsets(editor:HTMLDivElement):[number,number]|null{
 const selection=window.getSelection();
 if(!selection?.rangeCount)return null;
 const range=selection.getRangeAt(0);
 if(!editor.contains(range.startContainer)||!editor.contains(range.endContainer))return null;
 const before=document.createRange();before.selectNodeContents(editor);before.setEnd(range.startContainer,range.startOffset);
 const after=document.createRange();after.selectNodeContents(editor);after.setEnd(range.endContainer,range.endOffset);
 return [before.toString().length,after.toString().length];
}
function select(editor:HTMLDivElement,start:number,end:number){
 const iterator=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT),nodes:Text[]=[];
 while(iterator.nextNode())nodes.push(iterator.currentNode as Text);
 const point=(index:number):[Node,number]=>{
  let n=index;
  for(const node of nodes){if(n<=node.length)return [node,n];n-=node.length}
  const last=nodes.at(-1);return last?[last,last.length]:[editor,0];
 };
 const [a,ai]=point(start),[b,bi]=point(end);
 const range=document.createRange();range.setStart(a,ai);range.setEnd(b,bi);
 const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range);
}

/** Editor visual sobre la placa, sincronizado con un único documento y exportación Canvas. */
export function RichHeadlineOverlay(){
 const [open,setOpen]=useState(false),[content,setContent]=useState(initialContent);
 const editor=useRef<HTMLDivElement>(null);
 useEffect(()=>subscribeToContent(setContent),[]);
 useEffect(()=>{
  const show=()=>setOpen(true);
  window.addEventListener('editorial:cronica:open-rich-editor',show);
  return ()=>window.removeEventListener('editorial:cronica:open-rich-editor',show);
 },[]);
 useEffect(()=>{
  if(!open||!editor.current)return;
  const el=editor.current;
  if(el.dataset.currentMarkup!==content.headline)renderMarkup(el,content.headline);
 },[content.headline,open]);
 useEffect(()=>{if(open)editor.current?.focus({preventScroll:true})},[open]);
 const commit=(element:HTMLDivElement)=>{
  const markup=writeMarkup(readDOM(element));
  element.dataset.currentMarkup=markup;
  issueContentCommand({field:'headline',value:markup});
 };
 const apply=(mark:Mark|'clear')=>{
  const element=editor.current;if(!element)return;
  const points=offsets(element);if(!points||points[0]===points[1]){element.focus();return}
  const chars=formatChars(readDOM(element),points[0],points[1],mark);
  const markup=writeMarkup(chars);
  renderMarkup(element,markup);element.focus({preventScroll:true});select(element,...points);
  issueContentCommand({field:'headline',value:markup});
 };
 if(!open)return null;
 return (
  <section className="cronica-rich-overlay" aria-label="Editar texto desde la vista previa">
   <div className="cronica-rich-overlay-heading">
    <h2>Editar titular desde la vista previa</h2>
    <button type="button" onClick={()=>setOpen(false)} aria-label="Cerrar edición visual">
      <span className="material-icons" aria-hidden="true">close</span>
    </button>
   </div>
   <div ref={editor} role="textbox" aria-label="Texto principal en edición visual" contentEditable
    suppressContentEditableWarning spellCheck
    className="cronica-rich-headline" aria-multiline="true"
    onInput={event=>commit(event.currentTarget)}
    onPaste={event=>{
     event.preventDefault();
     const text=event.clipboardData.getData('text/plain');
     const sel=window.getSelection();if(!sel?.rangeCount)return;
     const range=sel.getRangeAt(0);range.deleteContents();
     const node=document.createTextNode(text);range.insertNode(node);range.setStartAfter(node);range.collapse(true);
     sel.removeAllRanges();sel.addRange(range);commit(event.currentTarget);
    }}
    onBeforeInput={event=>{
     if(event.nativeEvent.inputType!=='insertParagraph')return;
     event.preventDefault();const sel=window.getSelection();if(!sel?.rangeCount)return;
     const range=sel.getRangeAt(0);range.deleteContents();
     const node=document.createTextNode('\n');range.insertNode(node);range.setStartAfter(node);range.collapse(true);
     sel.removeAllRanges();sel.addRange(range);commit(event.currentTarget);
    }}
   />
   <div className="cronica-rich-overlay-actions" role="group" aria-label="Formato del titular visual">
    {([{mark:'accent',label:'Destacar selección',icon:'format_color_text'},
      {mark:'italic',label:'Aplicar cursiva',icon:'format_italic'},
      {mark:'strike',label:'Aplicar tachado',icon:'strikethrough_s'},
      {mark:'clear',label:'Quitar formato',icon:'format_clear'}] as const).map(button=>
     <button key={button.mark} type="button" aria-label={button.label}
      onPointerDown={event=>event.preventDefault()} onClick={()=>apply(button.mark)}>
      <span className="material-icons" aria-hidden="true">{button.icon}</span>
     </button>)}
   </div>
  </section>
 );
}
