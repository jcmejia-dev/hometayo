export function unreadArrivals(previous:Set<string>|null,notices:Array<{id:string;readAt:string|null}>){
 const next=new Set(notices.map(n=>n.id));
 return {next,hasNew:previous!==null&&notices.some(n=>!n.readAt&&!previous.has(n.id))};
}
