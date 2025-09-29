
let DATA = null;
const roster = [];

async function load() {
  DATA = await (await fetch('data/normalized.json')).json();
  populateFactions(DATA.factions);
  populateDetachments(DATA.detachments);
  renderUnits(DATA.units);
  renderStrats([]);
}

function populateFactions(list){
  const sel=document.getElementById('factionFilter');
  list.forEach(f=>{
    const o=document.createElement('option');
    o.value=f; o.textContent=f; sel.appendChild(o);
  });
  sel.onchange=filterUnits;
}

function populateDetachments(list){
  const sel=document.getElementById('detachmentSelect');
  list.forEach(d=>{
    const o=document.createElement('option');
    o.value=d.id; o.textContent=d.name; sel.appendChild(o);
  });
  sel.onchange=()=>filterStrats(sel.value);
}

function filterUnits(){
  const q=document.getElementById('search').value.toLowerCase();
  const f=document.getElementById('factionFilter').value;
  const u=DATA.units.filter(x=>{
    return (!f||x.faction===f) &&
           (!q||x.name.toLowerCase().includes(q));
  });
  renderUnits(u);
}

function renderUnits(units){
  const c=document.getElementById('unitList');
  c.innerHTML='<h2>Units</h2>';
  units.forEach(u=>{
    const d=document.createElement('div');
    d.className='unit';
    d.innerHTML=`<strong>${u.name}</strong> (${u.points??'—'} pts)
    <button>Add</button>`;
    d.querySelector('button').onclick=()=>add(u);
    c.appendChild(d);
  });
}

function add(u){roster.push(u); renderRoster();}

function renderRoster(){
  const c=document.getElementById('rosterList');
  c.innerHTML='';
  let total=0;
  roster.forEach((r,i)=>{
    total+=(r.points||0);
    const d=document.createElement('div');
    d.innerHTML=`${r.name} – ${r.points||0} pts
    <button>Remove</button>`;
    d.querySelector('button').onclick=()=>{roster.splice(i,1);renderRoster();};
    c.appendChild(d);
  });
  document.getElementById('pointsTotal').textContent='Points: '+total;
  filterStrats(document.getElementById('detachmentSelect').value);
}

function filterStrats(det){
  const s=document.getElementById('stratList');
  s.innerHTML='';
  const list = !det ? DATA.stratagems :
    DATA.stratagems.filter(x=> (x.text||'').toLowerCase().includes(det.toLowerCase()));
  list.slice(0,50).forEach(x=>{
    const d=document.createElement('div');
    d.innerHTML=`<strong>${x.name}</strong><div>${x.text||''}</div>`;
    s.appendChild(d);
  });
}

document.getElementById('search').oninput=filterUnits;
window.onload=load;
