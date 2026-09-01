/* 小书桌 —— 台面的交互。
   状态从页面里的 <script type="application/json"> 读出，那两块由 Hugo 从
   data/works.yaml、data/notes.yaml 渲染而来。改动只存在内存里：想让改动
   生效，必须「导出 YAML」→ 覆盖 data/ 下的文件 → push。仓库是唯一的真相。
   稿纸正文永远由 Hugo 渲染，JS 只负责显示/隐藏和生成书脊，避免两处 markup 漂移。 */
"use strict";
(function(){
const $=s=>document.querySelector(s);
const el=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!=null)n.innerHTML=h;return n};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const editing=()=>document.body.classList.contains('editing');
const readJSON=id=>{try{return JSON.parse(document.getElementById(id).textContent)}catch(e){return[]}};

const works=readJSON('state-works').map(w=>({...w,solid:w.solid!==false}));
const notes=readJSON('state-notes').map(n=>({...n}));
let uid=1000;

const WHERE={shelf:'书架',drawer:'归档抽屉',desk:'台面'};
const cellsHTML=cs=>cs?`<div class="cells">${[...cs].map(c=>`<span class="cell ${c==='e'?'':c}"></span>`).join('')}</div>`:'';

/* ---------- 书脊与文件袋 ---------- */
/* 有主链接的做成 <a>，点开就是那部书；编辑模式下 wireSpine 会截住点击改弹菜单。 */
const primaryHref=w=>{const l=(w.links||[]).find(x=>x.primary);return l?l.href:''};
function shelfNode(cls,href){
  if(href){const a=el('a',cls);a.setAttribute('href',href);return a}
  const b=el('button',cls);b.type='button';return b;
}
function spineEl(w,solid,ondesk){
  const sp=w.spine||{};
  const b=shelfNode('spine'+(solid?(w.recension?' rec':''):' ghost')+(ondesk?' ondesk':''),primaryHref(w));
  b.innerHTML=`<span class="st">${esc(sp.label||w.title)}</span>`+(sp.byline?`<span class="sa">${esc(sp.byline)}</span>`:'');
  b.dataset.id=w.id; b.dataset.tip='work'; b.title=w.title;
  b.style.setProperty('--w',(solid?sp.w:sp.w-0.3)+'rem');
  b.style.setProperty('--h',(solid?sp.h:sp.h-0.6)+'rem');
  if(solid&&sp.color)b.style.setProperty('--c',sp.color);
  b.setAttribute('draggable','true');
  wireSpine(b,w);
  return b;
}
function pouchEl(w){
  const sp=w.spine||{};
  const b=shelfNode('pouch',primaryHref(w));
  b.innerHTML=`<span class="pflap"><i class="ptie"></i></span>`
    +`<span class="plabel"><span class="pt">${esc(sp.label||w.title)}</span></span>`
    +(sp.byline?`<span class="pby">${esc(sp.byline)}</span>`:'')
    +`<span class="pkind">${esc(w.kindmark||'篇')}</span>`;
  b.dataset.id=w.id; b.dataset.tip='work'; b.title=w.title;
  if(sp.color)b.style.setProperty('--pc',sp.color);
  if(sp.h)b.style.setProperty('--ph',sp.h+'rem');
  b.setAttribute('draggable','true');
  wireSpine(b,w);
  return b;
}
/* 架上／抽屉里：文件袋是文件袋，其余是书脊。台面上的一律留虚线空位。 */
const shelfEl=w=>w.form==='pouch'?pouchEl(w):spineEl(w,w.solid,false);
function wireSpine(b,w){
  b.addEventListener('dragstart',e=>onDragStart(e,w.id,'work'));
  b.addEventListener('dragend',()=>b.classList.remove('dragging'));
  b.addEventListener('contextmenu',e=>{e.preventDefault();openMenu(w,e.clientX,e.clientY)});
  b.addEventListener('click',e=>{if(editing()){e.preventDefault();openMenu(w,e.clientX,e.clientY)}});
}
function noteEl(n,cls){
  const d=el('div','note '+cls);
  d.dataset.id=n.id; d.dataset.tip='note'; d.setAttribute('draggable','true');
  d.innerHTML=`<button class="nx" title="删掉">✕</button><h3>${esc(n.title)}</h3><p class="from">${esc(n.from)}</p>`;
  wireNote(d,n);
  return d;
}
function wireNote(d,n){
  d.querySelector('.nx').onclick=e=>{e.stopPropagation();
    if(confirm('删掉便签「'+n.title+'」？')){const i=notes.findIndex(x=>x.id===n.id);if(i>-1)notes.splice(i,1);render()}};
  d.addEventListener('dragstart',e=>onDragStart(e,n.id,'note'));
  d.addEventListener('dragend',()=>d.classList.remove('dragging'));
}

/* ---------- 重绘：只重建书脊与便签，稿纸只切显隐 ---------- */
function render(){
  const shelf=$('#shelfRow'),drawerRow=$('#drawerRow'),notesRow=$('#notes');
  shelf.innerHTML='';drawerRow.innerHTML='';
  const onShelf=works.filter(w=>w.place==='shelf'), onDesk=works.filter(w=>w.place==='desk'), inDrawer=works.filter(w=>w.place==='drawer');
  onShelf.forEach(w=>shelf.appendChild(shelfEl(w)));
  onDesk.forEach(w=>shelf.appendChild(spineEl(w,false,true)));
  if(inDrawer.length)inDrawer.forEach(w=>drawerRow.appendChild(shelfEl(w)));
  else drawerRow.appendChild(el('div','emptyhint','空的。把台面或书架上暂时不打算做完的拖进来。'));
  const nPouch=onShelf.filter(w=>w.form==='pouch').length;
  $('#shelfCnt').textContent=`书架上 ${onShelf.length-nPouch} 本`
    +(nPouch?` · ${nPouch} 个文件袋`:'')+` · 台面还有 ${onDesk.length} 件`;
  $('#drawerCnt').textContent=inDrawer.length?inDrawer.length+' 件':'';
  $('#deskCnt').textContent=onDesk.length+' 件';
  works.forEach(w=>{const p=document.querySelector(`.paper[data-id="${w.id}"]`); if(p)p.hidden=(w.place!=='desk')});
  notesRow.innerHTML='';
  const rot=['a','b','c'];
  notes.filter(n=>n.place==='desk').forEach((n,i)=>notesRow.appendChild(noteEl(n,rot[i%3])));
  const add=el('button','addnote','＋ 便签'); add.onclick=addNote; notesRow.appendChild(add);
}
function move(w,place){w.place=place;if(place==='drawer')openDrawer(true);closeMenu();render()}
function addNote(){
  const t=prompt('便签标题');if(!t)return;
  const b=prompt('内容（可留空，之后再写）')||'';
  notes.push({id:'n'+(++uid),place:'desk',title:t,body:b,from:'新便签 · 待整理'});render();
}

/* ---------- 右键菜单 ---------- */
const menu=$('#menu');
function openMenu(w,x,y){
  let h=`<div class="mtitle">${esc(w.title)}　·　现在在${WHERE[w.place]}</div>`;
  if(w.place==='desk'){
    h+=`<button data-a="shelf">放上书架</button><button data-a="drawer">放入归档抽屉</button><button disabled>更改显示（在台面上不适用）</button>`;
  }else{
    h+=`<button data-a="solid">更改显示：改为${w.solid?'虚体':'实体'}</button>`;
    h+=`<button data-a="form">更改显示：改为${w.form==='pouch'?'书脊':'文件袋'}</button>`;
    if(w.place!=='drawer')h+=`<button data-a="drawer">放入归档抽屉</button>`;
    if(w.place!=='shelf')h+=`<button data-a="shelf">放上书架</button>`;
    h+=`<button data-a="desk">放上台面</button>`;
  }
  menu.innerHTML=h;menu.style.display='block';
  const r=menu.getBoundingClientRect();
  menu.style.left=Math.min(x,innerWidth-r.width-8)+'px';
  menu.style.top=Math.min(y,innerHeight-r.height-8)+'px';
  menu.querySelectorAll('button[data-a]').forEach(btn=>btn.onclick=()=>{
    const a=btn.dataset.a;
    if(a==='solid'){w.solid=!w.solid;closeMenu();render()}
    else if(a==='form'){if(w.form==='pouch')delete w.form;else w.form='pouch';closeMenu();render()}
    else move(w,a);
  });
  hideTip();
}
function closeMenu(){menu.style.display='none'}
document.addEventListener('click',e=>{if(!e.target.closest('#menu')&&!e.target.closest('.spine,.pouch'))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
document.addEventListener('scroll',closeMenu,true);

/* ---------- 拖放 ---------- */
let drag=null;
function onDragStart(e,id,kind){
  if(!editing()){e.preventDefault();return}
  drag={id,kind};e.dataTransfer.effectAllowed='move';
  try{e.dataTransfer.setData('text/plain',id)}catch(_){}
  e.currentTarget.classList.add('dragging');hideTip();closeMenu();
}
function zoneOf(n){while(n&&n!==document.body){if(n.dataset&&n.dataset.zone)return n;n=n.parentNode}return null}
['dragover','dragenter'].forEach(ev=>document.addEventListener(ev,e=>{
  const z=zoneOf(e.target);if(!z||!drag)return;
  const ok=(drag.kind==='note')?(z.dataset.zone==='notes'):(z.dataset.zone!=='notes');
  if(!ok)return;
  e.preventDefault();e.dataTransfer.dropEffect='move';
  document.querySelectorAll('.drop').forEach(n=>n.classList.remove('drop'));
  (z.dataset.zone==='drawer'?$('#drawerBody'):z).classList.add('drop');
  if(z.dataset.zone==='drawer')openDrawer(true);
}));
document.addEventListener('drop',e=>{
  const z=zoneOf(e.target);document.querySelectorAll('.drop').forEach(n=>n.classList.remove('drop'));
  if(!z||!drag)return;e.preventDefault();
  if(drag.kind!=='note'&&z.dataset.zone!=='notes'){const w=works.find(x=>x.id===drag.id);if(w)w.place=z.dataset.zone}
  drag=null;render();
});
document.addEventListener('dragend',()=>{document.querySelectorAll('.drop,.dragging').forEach(n=>n.classList.remove('drop','dragging'));drag=null});

function openDrawer(v){$('#drawer').classList.toggle('open',v);$('#drawerHead').setAttribute('aria-expanded',String(v))}
$('#drawerHead').addEventListener('click',()=>openDrawer(!$('#drawer').classList.contains('open')));
$('#drawerHead').addEventListener('dragover',e=>{if(drag&&drag.kind!=='note'){e.preventDefault();openDrawer(true)}});

/* ---------- 悬浮预览 ---------- */
const tip=$('#tip');
function tipHTML(kind,id){
  if(kind==='note'){const n=notes.find(x=>x.id===id);if(!n)return'';
    return `<h4>${esc(n.title)}</h4><p class="tbody">${esc(n.body)||'（还没写内容）'}</p><p class="tmeta">${esc(n.from)}</p>`}
  const w=works.find(x=>x.id===id);if(!w)return'';
  return `<h4>${esc(w.title)}</h4><p class="tsub">${esc(w.sub)}</p>${cellsHTML(w.cells)}
    <p class="tmeta">${w.key}</p><p class="tbody">${esc(w.blurb)}</p><p class="tmeta">${esc(w.stage)}　·　在${WHERE[w.place]}</p>`;
}
function showTip(t,x,y){
  if(menu.style.display==='block')return;
  tip.innerHTML=t;tip.style.display='block';
  const r=tip.getBoundingClientRect();
  let left=x+16,top=y+16;
  if(left+r.width>innerWidth-10)left=Math.max(10,x-r.width-16);
  if(top+r.height>innerHeight-10)top=Math.max(10,innerHeight-r.height-10);
  tip.style.left=left+'px';tip.style.top=top+'px';
}
function hideTip(){tip.style.display='none'}
document.addEventListener('mousemove',e=>{
  const host=e.target.closest&&e.target.closest('[data-tip]');
  if(!host){hideTip();return}
  if(host.classList.contains('paper')){hideTip();return}
  showTip(tipHTML(host.dataset.tip,host.dataset.id),e.clientX,e.clientY);
});
document.addEventListener('scroll',hideTip,true);

/* ---------- 编辑模式 ---------- */
const HINT_ON='拖稿纸到书架＝成书，拖到抽屉＝归档；书脊右键或点击弹菜单。改完点「导出 YAML」，贴回仓库才算数。';
const HINT_OFF='读者看到的是只读的样子。开编辑才能拖动、增删。';
$('#editBtn').addEventListener('click',()=>{
  const on=document.body.classList.toggle('editing');
  $('#editBtn').classList.toggle('on',on);
  $('#editBtn').setAttribute('aria-pressed',String(on));
  $('#hint').textContent=on?HINT_ON:HINT_OFF;
});

/* ---------- 导出 ---------- */
const qs=s=>'"'+String(s==null?'':s).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"';
const blk=(k,v,ind)=>(v==null||v==='')?`${ind}${k}: ~\n`:`${ind}${k}: >-\n${ind}  ${String(v).replace(/\s*\n\s*/g,' ')}\n`;
function worksYAML(){
  let y='# data/works.yaml —— 由「小书桌」页面导出。覆盖仓库中同名文件后重新构建。\n'
       +'# place: shelf 书架 / drawer 归档抽屉 / desk 台面\n'
       +'# solid: true 实体书脊 / false 虚体（书架上留一格空位）\n'
       +'# form: pouch 文件袋（不是书的东西：单篇、一叠散稿）；不写就是书脊\n'
       +'# cells: 每字符一格 —— f 译毕、h 节译或残稿、e 未译；~ 表示不画进度格\n';
  ['shelf','drawer','desk'].forEach(p=>{
    const list=works.filter(w=>w.place===p);if(!list.length)return;
    y+=`\n# ── ${WHERE[p]} ──\n`;
    list.forEach(w=>{
      const sp=w.spine||{};
      y+=`- id: ${w.id}\n  place: ${p}\n  solid: ${!!w.solid}\n`;
      if(w.recension)y+=`  recension: true\n`;
      if(w.form)y+=`  form: ${w.form}\n`;
      if(w.kindmark)y+=`  kindmark: ${qs(w.kindmark)}\n`;
      y+=`  title: ${qs(w.title)}\n  sub: ${qs(w.sub)}\n  stage: ${qs(w.stage)}\n`;
      y+=`  spine:\n    label: ${qs(sp.label)}\n`
         +(sp.byline?`    byline: ${qs(sp.byline)}\n`:'')
         +`    w: ${sp.w}\n    h: ${sp.h}\n    color: ${qs(sp.color)}\n`;
      y+=`  cells: ${w.cells?qs(w.cells):'~'}\n`;
      y+=blk('cite',w.cite,'  ')+blk('key',w.key,'  ')+blk('blurb',w.blurb,'  ')+blk('next',w.next,'  ');
      y+=`  links:\n`;
      (w.links||[]).forEach(l=>{y+=`    - label: ${qs(l.label)}\n      href: ${qs(l.href)}\n`+(l.primary?`      primary: true\n`:'')});
    });
  });
  return y;
}
function notesYAML(){
  let y='# data/notes.yaml —— 便签。place: desk 贴在台面上\n';
  notes.forEach(n=>{y+=`- id: ${n.id}\n  place: ${n.place}\n  title: ${qs(n.title)}\n  from: ${qs(n.from)}\n`+blk('body',n.body,'  ')});
  return y;
}
function dl(name,text){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type:'text/yaml;charset=utf-8'}));
  a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0);
}
$('#expBtn').addEventListener('click',()=>{
  $('#exp textarea').value=worksYAML()+'\n\n'+notesYAML();
  $('#exp').classList.add('on');$('#expOk').textContent='';
});
$('#copyBtn').addEventListener('click',async()=>{
  const t=$('#exp textarea');t.select();
  try{await navigator.clipboard.writeText(t.value)}catch(_){document.execCommand('copy')}
  $('#expOk').textContent='已复制 ✓';
});
$('#dlW').addEventListener('click',()=>{dl('works.yaml',worksYAML());$('#expOk').textContent='已下载 works.yaml ✓'});
$('#dlN').addEventListener('click',()=>{dl('notes.yaml',notesYAML());$('#expOk').textContent='已下载 notes.yaml ✓'});

/* ---------- 起手 ---------- */
// 给 Hugo 渲染出来的静态节点接上事件；没有 JS 的读者看到的仍是完整的只读页面。
document.querySelectorAll('#shelfRow .spine,#shelfRow .pouch,#drawerRow .spine,#drawerRow .pouch').forEach(b=>{
  const w=works.find(x=>x.id===b.dataset.id); if(w)wireSpine(b,w);
});
document.querySelectorAll('#notes .note').forEach(d=>{
  const n=notes.find(x=>x.id===d.dataset.id); if(n)wireNote(d,n);
});
document.querySelectorAll('.paper').forEach(a=>{
  const w=works.find(x=>x.id===a.dataset.id); if(!w)return;
  a.addEventListener('dragstart',e=>onDragStart(e,w.id,'work'));
  a.addEventListener('dragend',()=>a.classList.remove('dragging'));
  a.querySelectorAll('.mv').forEach(btn=>btn.onclick=e=>{e.stopPropagation();move(w,btn.dataset.act)});
});
const addBtn=document.querySelector('.addnote'); if(addBtn)addBtn.onclick=addNote;
['editBtn','expBtn','hint'].forEach(id=>{const n=document.getElementById(id);if(n)n.hidden=false});
$('#hint').textContent=HINT_OFF;
})();
