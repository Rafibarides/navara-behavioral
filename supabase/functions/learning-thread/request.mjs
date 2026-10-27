const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
const text=x=>typeof x==='string'&&x.length>0&&x.length<=160;
export function validateRequest(b){
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['action','nonce','payload'].includes(k))||!uuid(b.nonce)||!b.payload||typeof b.payload!=='object'||Array.isArray(b.payload))throw Error('invalid');
 const p=b.payload;const common=['pack','version','candidate'];let allowed;
 switch(b.action){
 case'reviewed_thread':allowed=[...common,'step','answer'];if(!['status','lesson','practice','practice_answer','reserve','reserve_answer'].includes(p.step))throw Error('invalid');if(p.answer!==undefined&&(!p.answer||typeof p.answer!=='object'||Array.isArray(p.answer)||Object.keys(p.answer).some(k=>k!=='chosen')))throw Error('invalid');if(p.step.endsWith('_answer')&&(!Number.isSafeInteger(p.answer?.chosen)||p.answer.chosen<0||p.answer.chosen>19))throw Error('invalid');break;
 case'reviewed_suggestion':allowed=[...common,'response'];if(!['fits','guessed','disagree'].includes(p.response))throw Error('invalid');break;
 case'reviewed_recovery':allowed=[...common,'choice'];if(p.choice!==undefined&&!['show_another_way','misread','different_focus','coach_pin'].includes(p.choice))throw Error('invalid');break;
 case'reviewed_choose_help':case'reviewed_baseline_serve':allowed=common;break;
 case'reviewed_baseline_submit':allowed=[...common,'set','answers'];if(!uuid(p.set)||!Array.isArray(p.answers)||!p.answers.length||p.answers.length>20||p.answers.some(a=>!a||Object.keys(a).some(k=>!['delivery','chosen'].includes(k))||!uuid(a.delivery)||!Number.isSafeInteger(a.chosen)||a.chosen<0||a.chosen>19)||new Set(p.answers.map(a=>a.delivery)).size!==p.answers.length)throw Error('invalid');break;
 default:throw Error('invalid');
 }
 if(Object.keys(p).some(k=>!allowed.includes(k))||common.some(k=>!text(p[k])))throw Error('invalid');
 return b;
}
