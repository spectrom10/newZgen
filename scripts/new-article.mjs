#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
const categories=['business','economics','politics','technology','sports','science-health','culture','life'];
const rl=readline.createInterface({input,output});
const ask=async (question)=> (await rl.question(question)).trim();
const quote=(s)=>JSON.stringify(s);
const slugify=s=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
try {
  const title=await ask('Article title: ');
  if(title.length<8) throw Error('Title must contain at least 8 characters.');
  const slug=slugify(title);
  const author=await ask('Author name: ');
  if(author.length<2) throw Error('Enter an author.');
  output.write(`Categories: ${categories.join(', ')}\n`);
  const category=await ask('Category slug: ');
  if(!categories.includes(category)) throw Error('Category does not exist.');
  const description=await ask('Summary (20-240 characters): ');
  if(description.length<20 || description.length>240) throw Error('Summary must be 20–240 characters.');
  const impact=await ask('What this means for you (at least 30 characters): ');
  if(impact.length<30) throw Error('Impact statement must be at least 30 characters.');
  const filename=path.join('src','content','articles',`${slug}.md`);
  if(fs.existsSync(filename)) throw Error(`Article already exists: ${filename}`);
  const content=`---\ntitle: ${quote(title)}\ndescription: ${quote(description)}\nauthor: ${quote(author)}\ncategory: ${quote(category)}\npublishedAt: ${quote(new Date().toISOString())}\nstatus: draft\nfeatured: false\nwhatItMeansForYou: ${quote(impact)}\nsources: []\n---\n\n`;
  fs.writeFileSync(filename,content,{flag:'wx'});
  output.write(`\nDraft created: ${filename}\nWrite the article below the second --- line, add verified source links, and change status to published when ready.\n`);
} catch(err){output.write(`Error: ${err.message}\n`);process.exitCode=1} finally{rl.close()}
