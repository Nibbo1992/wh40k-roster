
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { XMLParser } from 'fast-xml-parser';

const BASE_PATH = path.resolve('wh40k-10e'); // put the cloned BSData repo here
const OUT_PATH = path.resolve('data');
const OUT_FILE = path.join(OUT_PATH, 'normalized.json');

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

function ensure(a){return Array.isArray(a)?a:(a?[a]:[]);}

async function readFileAuto(file){
  const txt = await fs.readFile(file,'utf8');
  if (file.endsWith('.json')) return JSON.parse(txt);
  return xmlParser.parse(txt);
}

async function main(){
  if(!await fs.pathExists(BASE_PATH)){
    console.error('Clone the BSData repo into', BASE_PATH);
    process.exit(1);
  }
  await fs.ensureDir(OUT_PATH);

  const files = [
    ...glob.sync(path.join(BASE_PATH,'**/*.json')),
    ...glob.sync(path.join(BASE_PATH,'**/*.cat')),
    ...glob.sync(path.join(BASE_PATH,'**/*.catalogue'))
  ];

  const units=[], stratagems=[], detachments=[], factions=new Set();

  for(const f of files){
    try{
      const parsed = await readFileAuto(f);
      const nodes = [];
      if(parsed.catalogue) nodes.push(parsed.catalogue);
      if(parsed.catalogues) nodes.push(...ensure(parsed.catalogues));
      nodes.push(parsed);

      for(const node of nodes){
        const entries = ensure(node.units || node.entities || node.profiles);
        for(const u of entries){
          const id = u['@_id'] || u.id || u.name;
          const name = u.name || u['@_name'];
          let pts=null;
          if(u.costs){
            const c = ensure(u.costs.cost).find(x=>/pts|point/i.test(x['@_name']||''));
            pts = c && (c['@_value'] || c.value);
          }
          units.push({
            id: String(id||name||Math.random()),
            name: String(name||'Unknown'),
            points: pts?Number(pts):null,
            faction: node.name || node['@_name'] || null
          });
          if(node.name) factions.add(node.name);
        }
        const s = ensure(node.stratagems || node.rules);
        for(const st of s){
          if(st.name) stratagems.push({name: st.name, text: st.description || st.text || ''});
        }
        const d = ensure(node.detachments || node.formation);
        for(const de of d){
          if(de.name) detachments.push({id: de['@_id']||de.name, name: de.name});
        }
      }
    }catch(e){}
  }

  await fs.writeJson(OUT_FILE,{
    generatedAt: new Date().toISOString(),
    factions: [...factions].sort(),
    units, stratagems, detachments
  },{spaces:2});
  console.log('Created', OUT_FILE);
}
main();
