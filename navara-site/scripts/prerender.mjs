// Produce real route documents without changing the React design or hosting.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import pages from '../src/seo/pages.json' with { type: 'json' };
const dist = resolve('dist');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.woff2':'font/woff2'};
const server = createServer(async(req,res)=>{
  const path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  try { const file=resolve(dist,'.'+path); if(!file.startsWith(dist+'/') && file!==dist) throw Error('path'); const body=await readFile(file); res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(body); }
  catch {res.setHeader('Content-Type','text/html');res.end(await readFile(dist+'/index.html'));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || undefined,args:['--no-sandbox']});
try {
  const context = await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  // Keep generation deterministic and never contact booking/form endpoints.
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1' ? route.continue() : route.abort());
  for(const entry of pages){
    await page.goto(`http://127.0.0.1:${server.address().port}${entry.path}`,{waitUntil:'networkidle'});
    await page.waitForSelector('#root h1, #root h2');
    // Reveal existing scroll sections so the HTML snapshot contains readable content.
    await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}window.scrollTo(0,0);});
    await page.waitForFunction(()=>document.title.includes('Navara'));
    const html=await page.evaluate(()=>{
      const copy=document.documentElement.cloneNode(true);
      // The app re-mounts and retains its animations. Snapshots start readable with JS off.
      copy.querySelectorAll('#root [style]').forEach(el=>{if(el.style.opacity==='0')el.style.opacity='1';});
      copy.querySelectorAll('script').forEach(el=>{if(!el.src && el.type!=='application/ld+json')el.remove();});
      return '<!doctype html>\n'+copy.outerHTML;
    });
    const file=dist+(entry.path==='/'?'/index.html':entry.path+'/index.html');
    await mkdir(dirname(file),{recursive:true});await writeFile(file,html);
    console.log(`Rendered ${entry.path} (${html.length} chars)`);
  }
  await context.close();
  const origin='https://navarabehavioralgroup.com';
  await writeFile(dist+'/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+pages.filter(p=>!p.noindex).map(p=>'<url><loc>'+origin+p.path+'</loc></url>').join('')+'</urlset>\n');
  await writeFile(dist+'/robots.txt','User-agent: *\nAllow: /\n\nSitemap: '+origin+'/sitemap.xml\n');
  // Keep legacy inbound links as non-indexable redirects to the current service URL.
  const legacy='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow"><link rel="canonical" href="'+origin+'/services/behavior-method"><meta http-equiv="refresh" content="0;url=/services/behavior-method"><title>Navara Behavior Method</title></head><body><a href="/services/behavior-method">Navara Behavior Method</a></body></html>';
  // /contact serves a real page (was 404): bounce to the main-page contact section.
  const contact='<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="canonical" href="'+origin+'/#contact"><meta http-equiv="refresh" content="0;url=/#contact"><title>Contact | Navara Behavioral Group</title></head><body><a href="/#contact">Contact Navara Behavioral Group</a></body></html>';
  await mkdir(dist+'/contact',{recursive:true});await writeFile(dist+'/contact/index.html',contact);
  for (const path of ['/behavioral', '/services/parent-training']) {
    await mkdir(dist+path,{recursive:true});await writeFile(dist+path+'/index.html',legacy);
  }
} finally {await browser.close();server.close();}
