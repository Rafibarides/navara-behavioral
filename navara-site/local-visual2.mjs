import { chromium } from 'playwright';
const EP='https://ndxdgiwjccaakpvxkkqu.supabase.co/functions/v1/bcba-program';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:760}});
await ctx.route('https://ndxdgiwjccaakpvxkkqu.supabase.co/**', async route=>{
  await route.fulfill({status:200,headers:{'content-type':'application/json'},body:'{}'});
});
await ctx.route(EP, async route=>{
  const req=route.request();
  if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'POST,OPTIONS'}});return;}
  const resp=await fetch('http://127.0.0.1:8000/',{method:'POST',headers:{'content-type':'application/json','origin':'https://navarabehavioralgroup.com','authorization':'Bearer tok-guided'},body:req.postData()});
  const text=await resp.text();
  let action='?'; try{action=JSON.parse(req.postData()).action}catch{}
  console.log('CALL',action,'->',resp.status,text.slice(0,160));
  await route.fulfill({status:resp.status,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:text});
});
await ctx.addInitScript(()=>{
  localStorage.setItem('sb-ndxdgiwjccaakpvxkkqu-auth-token',JSON.stringify({access_token:'local-fixture-token',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'none',user:{id:'b3b3b3b3-2026-4027-8000-0000000000d3',aud:'authenticated',email:'cat4@fixture.invalid'}}));
});
const page=await ctx.newPage();
page.on('pageerror',e=>console.log('PAGEERROR:',String(e).slice(0,200)));
const shot=n=>page.screenshot({path:'/downloads/local-'+n+'.png',fullPage:true});
const step=async(name,fn)=>{try{await fn();console.log('OK',name);}catch(e){console.log('FAIL',name,String(e).slice(0,120));console.log('BODY:',(await page.locator('body').innerText()).replace(/\n+/g,' | ').slice(0,400));await shot('fail-'+name);throw e}};
await page.goto('http://127.0.0.1:8901/pathways/app/guided-staging-test');
await page.getByRole('button',{name:'Start the lesson'}).waitFor({timeout:25000});
await shot('01-offer');
await step('teaching1',async()=>{await page.getByRole('button',{name:'Start the lesson'}).click();await page.getByText('Teaching step 1 of').waitFor({timeout:15000});await shot('02-teaching1');});
await step('feedback1',async()=>{await page.locator('.thread-options button').nth(parseInt(process.env.CHOICE1||'0')).click();await page.getByRole('heading',{name:/defensible|Not the strongest/}).waitFor({timeout:15000});await shot('03-feedback1-c'+(process.env.CHOICE1||'0'));});
await step('teaching2',async()=>{await page.getByRole('button',{name:'Next teaching step'}).click();await page.getByText('Teaching step 2 of').waitFor({timeout:15000});await shot('04-teaching2');});
await step('feedback2',async()=>{await page.locator('.thread-options button').first().click();await page.getByRole('heading',{name:/defensible|Not the strongest/}).waitFor({timeout:15000});await shot('05-feedback2');});
await step('practice',async()=>{await page.getByRole('button',{name:'Open the practice question'}).click();await page.getByText('Practice with feedback').waitFor({timeout:15000});await shot('06-practice');});
await step('receipt',async()=>{await page.locator('.thread-options button').nth(1).click();await page.getByText(/Recorded correct|Recorded incorrect/).waitFor({timeout:15000});await shot('07-receipt');});
await step('finish',async()=>{await page.getByRole('button',{name:'Finish'}).click();await page.waitForTimeout(3000);await shot('08-after-finish');});
console.log('LOCAL VISUAL PASS COMPLETE');
await b.close();
process.exit(0);
