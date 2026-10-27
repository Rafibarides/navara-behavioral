// Private candidate: selection metadata only. Question/answer payloads remain server-owned.
export function selection(value) {
 if(!value || typeof value!=='object' || Array.isArray(value))throw Error('invalid_selection');
 const keys=Object.keys(value);
 if(keys.some(k=>!['limit','area','tag','review','timed'].includes(k)) || !Number.isSafeInteger(value.limit) || value.limit<1 || value.limit>25)throw Error('invalid_selection');
 for(const key of ['area','tag']) if(value[key]!==undefined && (typeof value[key]!=='string' || !value[key].trim() || value[key].length>160))throw Error('invalid_selection');
 if(value.timed!==undefined&&(typeof value.timed!=='boolean'||value.timed&&value.limit!==10))throw Error('invalid_selection');
 if(value.review!==undefined && typeof value.review!=='boolean')throw Error('invalid_selection');
 if(value.area!==undefined && value.tag!==undefined)throw Error('invalid_selection');
 return {limit:value.limit,...(value.timed===undefined?{}:{timed:value.timed}),...(value.area===undefined?{}:{area:value.area}),...(value.tag===undefined?{}:{tag:value.tag}),...(value.review===undefined?{}:{review:value.review})};
}
export function selectionFromUrl(search,limit=12){
 const params=new URLSearchParams(search);const area=params.get('area'),tag=params.get('tag'),review=params.get('review');
 if(params.has('area')&&!area || params.has('tag')&&!tag || review!==null&&!['0','1'].includes(review))throw Error('invalid_selection');
 return selection({limit,...(area===null?{}:{area}),...(tag===null?{}:{tag}),...(review===null?{}:{review:review==='1'})});
}
// Wall-clock deadline, not accumulated interval ticks: background tabs cannot pause a set.
export function remainingSeconds(deadline,now=Date.now()){return Math.max(0,Math.ceil((deadline-now)/1000));}
