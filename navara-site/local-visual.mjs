// LOCAL ONLY: drives the SAME built UI bundle against the local Deno fixture
// (fresh seeded member), intercepting the function endpoint. Labels: LOCAL.
import { chromium } from 'playwright';
const EP='https://ndxdgiwjccaakpvxkkqu.supabase.co/functions/v1/bcba-program';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:760}});
await ctx.route('https://ndxdgiwjccaakpvxkkqu.supabase.co/**', async route=>{
  await route.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'http://127.0.0.1:8901'},body:'{}'});
});
await ctx.route(EP, async route=>{
  const req=route.request();
  const resp=await fetch('http://127.0.0.1:8000/',{method:'POST',headers:{'content-type':'application/json','origin':'https://navarabehavioralgroup.com','authorization':'Bearer tok-guided'},body:req.postData()});
  const text=await resp.text();console.log('FIXTURE-RESP:',resp.status,text.slice(0,300));
  await route.fulfill({status:resp.status,headers:{'content-type':'application/json','access-control-allow-origin':'http://127.0.0.1:8901'},body:text});
});
await ctx.addInitScript(()=>{
  localStorage.setItem('sb-ndxdgiwjccaakpvxkkqu-auth-token',JSON.stringify({access_token:'local-fixture-token',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'none',user:{id:'eeeeeeee-2026-4027-8000-000000000073',aud:'authenticated',email:'cat@fixture.invalid'}}));
});
const page=await ctx.newPage();
page.on('console',m=>console.log('CONSOLE:',m.type(),m.text().slice(0,200)));
page.on('pageerror',e=>console.log('PAGEERROR:',String(e).slice(0,300)));
page.on('requestfailed',r=>console.log('REQFAIL:',r.url().slice(0,120)));
page.on('response',r=>{if(r.url().includes('bcba-program'))console.log('EP-RESP:',r.status())});
const shot=n=>page.screenshot({path:'/downloads/local-'+n+'.png'});
await page.goto('http://127.0.0.1:8901/pathways/app/guided-staging-test');
await page.waitForTimeout(15000);
console.log('BODY TEXT:', (await page.locator('body').innerText()).slice(0,800));
await shot('00-debug');
await page.getByRole('button',{name:'Start the lesson'}).waitFor({timeout:15000});
await shot('01-offer');
await page.getByRole('button',{name:'Start the lesson'}).click();
await page.getByText('Teaching step 1 of').waitFor({timeout:20000});
await shot('02-teaching1');
await page.locator('.thread-options button').first().click();
try{await page.getByText(/defensible|Not the strongest/).waitFor({timeout:12000});}catch(e){console.log('FEEDBACK1 MISSING. BODY:',(await page.locator('body').innerText()).slice(0,600));await shot('03-fail');throw e}
await shot('03-feedback1');
await page.getByRole('button',{name:'Next teaching step'}).click();
await page.getByText('Teaching step 2 of').waitFor({timeout:20000});
await shot('04-teaching2');
await page.locator('.thread-options button').first().click();
await page.getByText(/defensible|Not the strongest/).waitFor({timeout:20000});
await shot('05-feedback2');
await page.getByRole('button',{name:'Open the practice question'}).click();
await page.getByText('Practice with feedback').waitFor({timeout:20000});
await shot('06-practice');
await page.locator('.thread-options button').nth(1).click();
await page.getByText(/Recorded correct|Recorded incorrect/).waitFor({timeout:20000});
await shot('07-receipt');
await page.getByRole('button',{name:'Finish'}).click();
await page.waitForTimeout(3000);
await shot('08-after-finish');
console.log('LOCAL VISUAL PASS COMPLETE');
await b.close();
