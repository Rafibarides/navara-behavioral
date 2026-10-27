const prefix='pathways-quiz-v1:';
export function resumeStore(member,track,mode,storage=globalThis.localStorage){
 const key=prefix+member+':'+track+':'+mode;
 return {read(){try{const v=JSON.parse(storage.getItem(key));return v?.member===member&&v?.track===track&&v?.mode===mode&&v?.version===1&&Array.isArray(v.answers)?v:null;}catch{return null;}},write(v){storage.setItem(key,JSON.stringify({...v,version:1,member,track,mode}));},clear(){storage.removeItem(key);}};
}
