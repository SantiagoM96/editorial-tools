export type Mark = 'accent' | 'italic' | 'strike';
export type RichChar={c:string;accent:boolean;italic:boolean;strike:boolean};
const keys=['accent','italic','strike'] as const;
const symbols:Record<Mark,string>={accent:'*',italic:'_',strike:'~'};

export function readMarkup(markup:string):RichChar[]{
 const out:RichChar[]=[],state={accent:false,italic:false,strike:false};
 for(const c of markup){
  const key=c==='*'?'accent':c==='_'?'italic':c==='~'?'strike':null;
  if(key)state[key]=!state[key];
  else out.push({c,...state});
 }
 return out;
}
export function writeMarkup(chars:ReadonlyArray<RichChar>):string{
 let result='',previous={accent:false,italic:false,strike:false};
 for(const current of [...chars,{c:'',accent:false,italic:false,strike:false}]){
  for(const key of [...keys].reverse())if(previous[key]&&!current[key])result+=symbols[key];
  for(const key of keys)if(!previous[key]&&current[key])result+=symbols[key];
  result+=current.c;
  previous=current;
 }
 return result;
}
export function formatChars(chars:ReadonlyArray<RichChar>,start:number,end:number,mark:Mark|'clear'):RichChar[]{
 const selected=chars.slice(start,end);
 if(!selected.length)return [...chars];
 const activate=mark!=='clear'&&!selected.every(c=>c[mark]);
 return chars.map((c,i)=>{
  if(i<start||i>=end)return {...c};
  return mark==='clear'?{...c,accent:false,italic:false,strike:false}:{...c,[mark]:activate};
 });
}
