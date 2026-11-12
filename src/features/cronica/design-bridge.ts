import {isDesignSnapshot,type DesignCommand,type DesignSnapshot} from './design-model';
const STATE='editorial:cronica:design-state',COMMAND='editorial:cronica:design-command',REQUEST='editorial:cronica:design-request';
export function issueDesignCommand(command:DesignCommand):void {window.dispatchEvent(new CustomEvent(COMMAND,{detail:command}));}
export function subscribeToDesign(listener:(state:DesignSnapshot)=>void):()=>void {
 const onState=(event:Event)=>{if(event instanceof CustomEvent&&isDesignSnapshot(event.detail))listener(event.detail)};
 window.addEventListener(STATE,onState);
 window.dispatchEvent(new Event(REQUEST));
 return ()=>window.removeEventListener(STATE,onState);
}
