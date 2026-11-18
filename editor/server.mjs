/** Local-only newZgen editorial workspace; NOT a remotely hosted CMS. Node built-ins only. */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const articlesDir = path.join(root, 'src/content/articles');
const imagesDir = path.join(root, 'public/images');
const HOST = '127.0.0.1';
const PORT = Number(process.env.NEWZGEN_EDITOR_PORT || 4177);
const origin = `http://${HOST}:${PORT}`;
const categories = ['business','economics','politics','technology','sports','science-health','culture','life'];
const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
const clean = value => typeof value === 'string' ? value.replace(/\r\n?/g,'\n').trim() : '';
const isSlug = value => typeof value==='string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 90;
const fileFor = slug => path.join(articlesDir, `${slug}.md`);
const json = (res, status, data) => { res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store','x-content-type-options':'nosniff'}); res.end(JSON.stringify(data)); };
const abort = (status, msg) => Object.assign(new Error(msg), {status});
function extract(md, slug) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw Error(`Invalid frontmatter in ${slug}`);
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const match = line.match(/^([\w]+):\s*(.*)$/);
    if(!match) continue;
    const [,key,raw] = match;
    if(raw.startsWith('"') || raw.startsWith('[')) { try { data[key] = JSON.parse(raw); } catch { data[key] = raw; } }
    else if(raw === 'true' || raw === 'false') data[key]=raw==='true';
    else data[key] = raw;
  }
  return { slug, ...data, body:m[2].trim() };
}
function serialize(a) {
  const quote = s => JSON.stringify(s);
  const entries = [
    `title: ${quote(a.title)}`, `description: ${quote(a.description)}`, `author: ${quote(a.author)}`,
    `category: ${quote(a.category)}`, `publishedAt: ${quote(a.publishedAt)}`,
    `updatedAt: ${quote(new Date().toISOString())}`, `status: ${a.status}`,
    `featured: ${a.featured ? 'true' : 'false'}`, `whatItMeansForYou: ${quote(a.whatItMeansForYou)}`,
    `sources: ${JSON.stringify(a.sources)}`,
  ];
  if(a.cover) entries.push(`cover: ${quote(a.cover)}`, `coverAlt: ${quote(a.coverAlt)}`);
  return `---\n${entries.join('\n')}\n---\n\n${a.body.trim()}\n`;
}
function validate(input, existing) {
  const a = {};
  for (const key of ['title','description','author','category','body','whatItMeansForYou','cover','coverAlt']) a[key]=clean(input[key]);
  a.slug = existing?.slug || slugify(clean(input.slug) || a.title);
  if (!isSlug(a.slug)) throw abort(400,'Use a valid title or URL slug.');
  if(a.title.length < 8 || a.title.length > 180) throw abort(400,'Title must be 8–180 characters.');
  if(!categories.includes(a.category)) throw abort(400,'Choose an existing category.');
  a.status = input.status==='published'?'published':'draft';
  a.featured = input.featured === true;
  a.sources = Array.isArray(input.sources) ? input.sources.map(s=>({label:clean(s.label), url:clean(s.url)})).filter(s=>s.label || s.url) : [];
  if(a.sources.length>30) throw abort(400,'Too many sources.');
  for (const s of a.sources) {
    let u; try {u = new URL(s.url)} catch {throw abort(400,'Enter valid source URLs.')} 
    if(!s.label || !['https:','http:'].includes(u.protocol)) throw abort(400,'Each source needs a label and an HTTP(S) URL.');
  }
  if(a.cover && (!/^\/images\/[a-zA-Z0-9._-]+$/.test(a.cover) || !a.coverAlt)) throw abort(400,'Cover image must be uploaded here and needs alt text.');
  const date = existing?.publishedAt || new Date().toISOString();
  a.publishedAt = isNaN(Date.parse(date)) ? new Date().toISOString() : new Date(date).toISOString();
  if(a.status === 'published') {
    if(a.description.length < 20 || a.description.length > 240) throw abort(400,'Published summary must be 20–240 characters.');
    if(a.author.length<2) throw abort(400,'Add an author before publishing.');
    if(a.whatItMeansForYou.length<30) throw abort(400,'Personal impact must be at least 30 characters.');
    if(a.body.length<120) throw abort(400,'Article body must be at least 120 characters to publish.');
    if(!a.sources.length) throw abort(400,'Published reporting needs at least one verifiable source.');
  } else {
    // Schema still validates drafts, so keep minimal required frontmatter even for unfinished work.
    if(a.description.length < 20 || a.description.length > 240) throw abort(400,'Summary must be 20–240 characters, including for drafts.');
    if(a.author.length<2) throw abort(400,'Enter an author name.');
    if(a.whatItMeansForYou.length<30) throw abort(400,'Personal impact must be at least 30 characters, including for drafts.');
  }
  return a;
}
async function listArticles() {
  await fs.mkdir(articlesDir,{recursive:true});
  const files = (await fs.readdir(articlesDir)).filter(x=>x.endsWith('.md'));
  const result=[];
  for(const file of files) {const slug=file.slice(0,-3); try {result.push(extract(await fs.readFile(fileFor(slug),'utf8'),slug))} catch(e){result.push({slug, error:e.message})}}
  return result.sort((a,b)=>String(b.updatedAt||b.publishedAt||'').localeCompare(String(a.updatedAt||a.publishedAt||'')));
}
async function readBody(req, max=1024*1024) {
  let bytes=0; const chunks=[];
  for await (const chunk of req) {bytes+=chunk.length; if(bytes>max) throw abort(413,'Request too large.'); chunks.push(chunk)}
  try {return JSON.parse(Buffer.concat(chunks).toString('utf8'))} catch {throw abort(400,'Invalid JSON.')} 
}
function protect(req) {
  if(req.headers.host !== `${HOST}:${PORT}` && req.headers.host !== `localhost:${PORT}`) throw abort(403,'Invalid host.');
  if(req.method!=='GET' && req.method!=='HEAD') {
    if(req.headers.origin !== origin && req.headers.origin !== `http://localhost:${PORT}`) throw abort(403,'Invalid origin.');
    if(req.headers['content-type']?.split(';')[0]!=='application/json') throw abort(415,'JSON required.');
  }
}
async function handler(req,res) {
  try {
    protect(req);
    const url = new URL(req.url,origin);
    if(req.method==='GET' && url.pathname==='/') {
      const body=await fs.readFile(path.join(root,'editor','index.html'));
      res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",'x-content-type-options':'nosniff'});res.end(body);return;
    }
    if(req.method==='GET' && url.pathname==='/editor.css') {res.writeHead(200,{'content-type':'text/css; charset=utf-8'});res.end(await fs.readFile(path.join(root,'editor','editor.css')));return;}
    if(req.method==='GET' && url.pathname==='/editor.js') {res.writeHead(200,{'content-type':'text/javascript; charset=utf-8'});res.end(await fs.readFile(path.join(root,'editor','editor.js')));return;}
    if(req.method==='GET' && url.pathname==='/api/articles') return json(res,200,{articles:await listArticles()});
    if(req.method==='POST' && url.pathname==='/api/articles') {
      const input=await readBody(req);
      const slug=clean(input.slug); const existingSlug=slug && isSlug(slug) ? slug : null;
      let existing=null;
      if(existingSlug) {try{existing=extract(await fs.readFile(fileFor(existingSlug),'utf8'),existingSlug)}catch(e){if(e.code!=='ENOENT') throw e}}
      const article=validate(input,existing);
      await fs.mkdir(articlesDir,{recursive:true});
      const filename=fileFor(article.slug);
      if(!existing){try{await fs.access(filename);throw abort(409,'Slug is already used.')}catch(e){if(e.code!=='ENOENT')throw e}}
      const tmp=`${filename}.${crypto.randomUUID()}.tmp`;
      await fs.writeFile(tmp,serialize(article),{flag:'wx',mode:0o600});
      try {await fs.rename(tmp,filename)} catch(e){await fs.unlink(tmp).catch(()=>{});throw e}
      return json(res,200,{ok:true,slug:article.slug,status:article.status});
    }
    if(req.method==='POST' && url.pathname==='/api/upload') {
      const body=await readBody(req, 9*1024*1024);
      const buffer=Buffer.from(String(body.data||''),'base64');
      if(buffer.length<20 || buffer.length > 5*1024*1024) throw abort(400,'Image must be 5 MB or less.');
      let ext;
      if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ext='png';
      else if(buffer.subarray(0,3).equals(Buffer.from([255,216,255]))) ext='jpg';
      else if(buffer.subarray(0,4).toString('ascii')==='RIFF' && buffer.subarray(8,12).toString('ascii')==='WEBP') ext='webp';
      else throw abort(400,'Only valid PNG, JPEG, or WebP images are allowed.');
      await fs.mkdir(imagesDir,{recursive:true});
      const name=`editorial-${crypto.randomUUID()}.${ext}`;
      await fs.writeFile(path.join(imagesDir,name),buffer,{flag:'wx',mode:0o644});
      return json(res,200,{path:`/images/${name}`});
    }
    return json(res,404,{error:'Not found.'});
  }catch(e){console.error(e);return json(res,e.status||500,{error:e.status?e.message:'Unexpected error. Check the editor terminal.'})}
}
http.createServer(handler).listen(PORT,HOST,()=>console.log(`newZgen local newsroom: ${origin}\nOnly available on this computer. Keep this terminal open while editing.\nAfter publishing, commit and push the article files to deploy.`));
