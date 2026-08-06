const $ = (s) => document.querySelector(s);
const state = { course: [], flat: [], current: 0, learned: new Set(JSON.parse(localStorage.getItem('learnedSections') || '[]')) };

const escapeHtml = (s) => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function markdown(md) {
  const blocks = [];
  md = md.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang='', code) => `@@CODE${blocks.push(`<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`)-1}@@`);
  const lines = md.split('\n'); let html = '', list = '', table = [];
  const flushTable = () => { if (!table.length) return; const rows = table.filter(r => !/^\s*\|?\s*:?-+/.test(r)); html += '<table>' + rows.map((r,i) => `<tr>${r.replace(/^\||\|$/g,'').split('|').map(c => `<${i?'td':'th'}>${inline(c.trim())}</${i?'td':'th'}>`).join('')}</tr>`).join('') + '</table>'; table=[]; };
  const flushList = () => { if (list) { html += `</${list}>`; list=''; } };
  for (const line of lines) {
    if (/^\|.*\|$/.test(line)) { flushList(); table.push(line); continue; } flushTable();
    if (/^### /.test(line)) { flushList(); html += `<h3>${inline(line.slice(4))}</h3>`; }
    else if (/^## /.test(line)) { flushList(); html += `<h2>${inline(line.slice(3))}</h2>`; }
    else if (/^# /.test(line)) { flushList(); html += `<h1>${inline(line.slice(2))}</h1>`; }
    else if (/^-{3,}\s*$/.test(line)) { flushList(); html += '<hr>'; }
    else if (/^>\s?/.test(line)) { flushList(); html += `<blockquote>${inline(line.replace(/^>\s?/,''))}</blockquote>`; }
    else if (/^-\s+/.test(line)) { if (list !== 'ul') { flushList(); html += '<ul>'; list='ul'; } html += `<li>${inline(line.replace(/^-\s+/,''))}</li>`; }
    else if (/^\d+\.\s+/.test(line)) { if (list !== 'ol') { flushList(); html += '<ol>'; list='ol'; } html += `<li>${inline(line.replace(/^\d+\.\s+/,''))}</li>`; }
    else if (line.trim()) { flushList(); html += `<p>${inline(line)}</p>`; }
  }
  flushList(); flushTable();
  return html.replace(/@@CODE(\d+)@@/g, (_, i) => blocks[i]);
}
function inline(s){ return s.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>'); }

function renderTree(){
  $('#courseTree').innerHTML = state.course.map((chapter, ci) => `<section class="chapter">
    <button class="chapter-toggle" data-chapter="${ci}"><span class="material-symbols-rounded chevron">expand_more</span>${chapter.chapter}</button>
    <div class="chapter-sections">${chapter.sections.map((s,si) => { const i=state.flat.findIndex(x=>x.ci===ci&&x.si===si); const active=i===state.current; return `<button class="section-link ${active?'active':''} ${state.learned.has(s.id)?'done':''}" data-index="${i}"><span>${ci+1}.${si+1} ${s.title}</span><span class="material-symbols-rounded state">${state.learned.has(s.id)?'check_circle':'radio_button_unchecked'}</span></button>${active?`<div class="section-extras"><button data-anchor="summary">${ci+1}.${si+1}.1 本节小结</button><button data-anchor="quiz">${ci+1}.${si+1}.2 练习题</button><button data-anchor="practice">${ci+1}.${si+1}.3 实战任务</button></div>`:''}`; }).join('')}</div>
  </section>`).join('');
  document.querySelectorAll('.chapter-toggle').forEach(b=>b.onclick=()=>b.parentElement.classList.toggle('collapsed'));
  document.querySelectorAll('.section-link').forEach(b=>b.onclick=()=>show(+b.dataset.index));
  document.querySelectorAll('[data-anchor]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.anchor)?.scrollIntoView({behavior:'smooth',block:'center'}));
}

function extras(section){
  const q = section.quiz || [];
  return `<div class="learning-grid">
    <section class="learning-card" id="summary"><h3><span class="material-symbols-rounded">bookmark</span>本节小结</h3><ul>${(section.summary||[]).map(x=>`<li>${x}</li>`).join('')}</ul></section>
    <section class="learning-card" id="quiz"><h3><span class="material-symbols-rounded">quiz</span>练习题</h3>${q.map((x,i)=>`<div class="quiz-question" data-answer="${x.answer}"><strong>${i+1}. ${x.question}</strong>${x.options.map((o,oi)=>`<label class="quiz-option"><input type="radio" name="q${i}" value="${oi}"> ${o}</label>`).join('')}<p class="quiz-feedback" aria-live="polite"></p></div>`).join('')}${q.length?'<button class="quiz-submit" type="button">提交答案</button>':''}</section>
    <section class="learning-card" id="practice"><h3><span class="material-symbols-rounded">terminal</span>实战任务</h3><strong>${section.practice?.title||'完成本节迷你项目'}</strong><p>${section.practice?.description||'将本节知识应用到一个可运行的小项目中。'} 完成后请保留关键输入、输出结果和验证过程，作为本节学习成果。</p></section>
  </div>`;
}

function show(index){
  state.current=Math.max(0,Math.min(index,state.flat.length-1)); const item=state.flat[state.current], section=item.section;
  localStorage.setItem('currentSection',section.id);
  history.replaceState(null,'',`${location.pathname}${location.search}#${section.id}`);
  $('#breadcrumb').textContent=`学习路径：${item.chapter.chapter}　›　${section.title}`;
  $('#lesson').innerHTML=markdown(section.content)+extras(section);
  $('#prevButton').disabled=state.current===0; $('#nextButton').disabled=state.current===state.flat.length-1;
  $('#lessonCount').textContent=`第 ${state.current+1} / ${state.flat.length} 节`;
  const done=state.learned.has(section.id); $('#completeButton').classList.toggle('done',done); $('#completeButton span:last-child').textContent=done?'已学习，继续下一节':'标记为已学习';
  renderTree(); document.querySelector('.section-link.active')?.scrollIntoView({block:'nearest'}); window.scrollTo({top:0,behavior:'smooth'}); if(window.hljs) document.querySelectorAll('pre code').forEach(el=>hljs.highlightElement(el));
  document.querySelector('.quiz-submit')?.addEventListener('click',()=>document.querySelectorAll('.quiz-question').forEach((box,i)=>{
    const selected=box.querySelector('input:checked'), feedback=box.querySelector('.quiz-feedback'), answer=+box.dataset.answer;
    box.querySelectorAll('.quiz-option').forEach(option=>option.classList.remove('correct','incorrect'));
    if(!selected){feedback.className='quiz-feedback pending';feedback.textContent='请先选择一个答案。';return;}
    const quiz=section.quiz[i], chosen=+selected.value, correct=chosen===answer, correctText=quiz.options[answer];
    selected.closest('.quiz-option').classList.add(correct?'correct':'incorrect');
    if(!correct)box.querySelector(`input[value="${answer}"]`).closest('.quiz-option').classList.add('correct');
    feedback.className=`quiz-feedback ${correct?'correct':'incorrect'}`;
    feedback.textContent=correct?`回答正确！正确答案：${correctText}`:`回答错误。你选择了：${quiz.options[chosen]}；正确答案：${correctText}`;
  }));
}
function updateProgress(){ const p=state.flat.length?Math.round(state.learned.size/state.flat.length*100):0; $('#progressText').textContent=`${p}%`; $('#progressBar').style.width=`${p}%`; }
function search(term){
  const box=$('#searchResults'); term=term.trim().toLowerCase(); if(!term){box.hidden=true;return;}
  const score=x=>x.section.title.toLowerCase().includes(term)?3:x.chapter.chapter.toLowerCase().includes(term)?2:x.section.content.toLowerCase().includes(term)?1:0;
  const hits=state.flat.filter(score).sort((a,b)=>score(b)-score(a)).slice(0,8);
  box.innerHTML=hits.length?hits.map(x=>`<button class="search-item" data-hit="${state.flat.indexOf(x)}"><strong>${x.section.title}</strong><small>${x.chapter.chapter}</small></button>`).join(''):'<div class="search-item">未找到相关章节</div>';
  box.hidden=false; box.querySelectorAll('[data-hit]').forEach(b=>b.onclick=()=>{show(+b.dataset.hit);box.hidden=true;$('#searchInput').blur();});
}

fetch('course.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('课程数据加载失败');return r.json()}).then(data=>{
  state.course=data; state.flat=data.flatMap((chapter,ci)=>chapter.sections.map((section,si)=>({chapter,section,ci,si})));
  const currentId=location.hash.slice(1)||localStorage.getItem('currentSection');
  const saved=state.flat.findIndex(item=>item.section.id===currentId);
  updateProgress(); show(saved<0?0:saved);
}).catch(e=>$('#lesson').innerHTML=`<h1>无法加载课程</h1><p>${e.message}。请按照 README 使用本地服务器运行项目。</p>`);
$('#searchInput').addEventListener('input',e=>search(e.target.value));
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#searchInput').focus();}});
$('#prevButton').onclick=()=>show(state.current-1); $('#nextButton').onclick=()=>show(state.current+1);
$('#completeButton').onclick=()=>{const id=state.flat[state.current].section.id;state.learned.has(id)?state.learned.delete(id):state.learned.add(id);localStorage.setItem('learnedSections',JSON.stringify([...state.learned]));updateProgress();show(state.current);};
$('#themeButton').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light');};
if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark');
const toggleMenu=()=>{$('#sidebar').classList.toggle('open');$('#scrim').classList.toggle('show')}; $('#menuButton').onclick=toggleMenu; $('#scrim').onclick=toggleMenu;
