(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = n => String(n).replace(/\d/g, d => '०१२३४५६७८९'[d]);
  const editions = [
    {id:'upanishad',title:'उपनिषद् वाहिनी',translations:window.UPANISHAD_HINDI},
    {id:'sutra',title:'सूत्र वाहिनी',translations:window.SUTRA_HINDI},
    {id:'bhagavata-vahini',title:'भागवत वाहिनी',translations:window.BHAGAVATHA_HINDI},
    {id:'geetha-vahini',title:'गीता वाहिनी',translations:window.GITA_HINDI},
    {id:'ramakatha-rasavahini',title:'रामकथा रसवाहिनी',translations:window.RAMAKATHA_HINDI},
    {id:'prema-vahini',title:'प्रेम वाहिनी',translations:window.PREMA_HINDI},
    {id:'dharma-vahini',title:'धर्म वाहिनी',translations:window.DHARMA_HINDI},
    {id:'dhyana-vahini',title:'ध्यान वाहिनी',translations:window.DHYANA_HINDI}
  ].filter(b => b.translations?.length);
  const books = editions.map(b => {
    const original = window.VAHINI_BOOKS?.find(x => x.id === b.id);
    return {...b, sourceUrl:original.sourceUrl, chapters:b.translations.map((t,i) => ({...original.topics[i],...t,
      quiz:t.quiz.map(([q,options,explanation],j)=>({q,options,explanation,correct:original.topics[i].quiz[j].correct}))
    }))};
  });
  let bookIndex = 0, chapters = books[0]?.chapters || [];
  const book = () => books[bookIndex];
  const tabs = {summary:'सारांश', questions:'प्रश्नोत्तर', quiz:'प्रश्नमाला', notes:'मेरा सारांश'};
  const attempts = new Map(), notes = new Map();
  let index = 0, tab = 'summary';
  const current = () => chapters[index];
  const noteKey = () => `vahini-note:hi:${book().id}/${current().id}`;
  const attemptKey = () => `${book().id}/${current().id}`;
  const attempt = () => { if (!attempts.has(attemptKey())) attempts.set(attemptKey(), {answers:[], checked:false}); return attempts.get(attemptKey()); };
  const pdfLink = t => `${(t.sourceUrl || book().sourceUrl).split('#')[0]}#page=${t.pdfStartPage}`;
  const source = t => `<a href="${pdfLink(t)}" target="_blank" rel="noopener noreferrer">मूल पाठ: PDF पृष्ठ ${num(t.pdfStartPage)}–${num(t.pdfEndPage)} ↗</a>`;
  const focusActivity = () => { $('activity').focus({preventScroll:true}); $('activity').scrollIntoView({block:'start'}); };
  function go(i, nextTab = 'summary') {
    if (!chapters[i] || !Object.hasOwn(tabs, nextTab)) return;
    index = i; tab = nextTab;
    const hash = `#${book().id}/${current().id}/${tab}`;
    history.replaceState(null, '', hash);
    $('english-link').href = `./${hash}`;
    $('odia-link').href = `odia.html${hash}`;
    $('odia-navigation').hidden = !['upanishad','sutra','bhagavata-vahini'].includes(book().id);
    document.querySelector('.collection-source').href = `./${hash}`;
    render();
    $('announcement').textContent = `${current().title}। ${tabs[tab]}।`;
  }
  function readHash() {
    if (location.hash === '#study') { $('study').focus(); return; }
    const [bookId, chapter, activity] = location.hash.slice(1).split('/');
    const bi = books.findIndex(b => b.id === bookId);
    bookIndex = bi < 0 ? 0 : bi; chapters = book().chapters;
    const i = chapters.findIndex(t => t.id === chapter);
    go(i < 0 ? 0 : i, Object.hasOwn(tabs, activity) ? activity : 'summary');
  }
  function render() {
    const t = current();
    document.title = `${t.title} — ${book().title}`;
    $('hindi-book').innerHTML=books.map((b,i)=>`<option value="${i}" ${i===bookIndex?'selected':''}>${esc(b.title)}</option>`).join('');
    document.querySelector('.book-header h2').textContent=book().title;
    document.querySelector('.book-header .description').textContent=`मूल पुस्तक के क्रम में ${num(chapters.length)} अध्याय। प्रत्येक अध्याय में सारांश, पाँच प्रश्नोत्तर और पाँच बहुविकल्पीय प्रश्न हैं।`;
    document.querySelector('.book-meta a').href=(t.sourceUrl || book().sourceUrl).split('#')[0];
    $('chapter-list').innerHTML = chapters.map((c,i) => `<button class="book-item ${i===index?'active':''}" data-chapter="${i}" ${i===index?'aria-current="true"':''}><span class="book-number">${num(i+1)}</span><span class="book-name">${esc(c.title)}</span></button>`).join('');
    $('chapter-select').innerHTML = chapters.map((c,i) => `<option value="${i}" ${i===index?'selected':''}>${num(i+1)} · ${esc(c.title)}</option>`).join('');
    $('topic-position').textContent = `अध्याय ${num(index+1)} / ${num(chapters.length)}`;
    $('study-tabs').innerHTML = Object.entries(tabs).map(([id,label]) => `<button id="tab-${id}" class="tab" role="tab" aria-controls="activity" aria-selected="${tab===id}" tabindex="${tab===id?0:-1}" data-tab="${id}">${label}</button>`).join('');
    $('activity').setAttribute('aria-labelledby',`tab-${tab}`);
    $('previous-topic').disabled = index === 0;
    $('next-topic').disabled = index === chapters.length-1;
    renderActivity();
  }
  function renderActivity() {
    const t = current(), heading = `<h3 class="activity-title">${esc(t.title)}</h3>`;
    if (tab === 'summary') {
      $('activity').innerHTML = `${heading}<div class="summary-grid"><div>${t.summary.split('\n\n').map(p=>`<p class="summary-text">${esc(p)}</p>`).join('')}<div class="action-row"><button class="primary-button" data-tab="questions">प्रश्नोत्तर पढ़ें</button><button class="secondary-button" data-tab="quiz">प्रश्नमाला हल करें</button></div><p class="study-note">प्रदत्त पुस्तक पर आधारित अध्ययन सारांश का हिंदी रूपांतरण।</p></div><aside class="source-card"><p class="eyebrow">मूल पुस्तक पढ़ें</p><h4>${esc(t.title)}</h4><p>संपूर्ण शिक्षा और संदर्भ के लिए प्रदत्त अंग्रेज़ी पुस्तक पढ़ें।</p>${source(t)}</aside></div>`;
    } else if (tab === 'questions') {
      $('activity').innerHTML = `${heading}<p class="qa-intro">हर प्रश्न पर विचार करें, फिर उत्तर खोलें।</p>${t.quiz.map(q=>`<details><summary>${esc(q.q)}</summary><p>${esc(q.options[q.correct])}। ${esc(q.explanation)}</p></details>`).join('')}<p class="study-note">${source(t)}</p><div class="action-row"><button class="primary-button" data-tab="quiz">अपनी समझ परखें</button><button class="secondary-button" data-tab="notes">अपना सारांश लिखें</button></div>`;
    } else if (tab === 'quiz') {
      const a = attempt(), answered = a.answers.filter(Number.isInteger).length, score = t.quiz.filter((q,i)=>q.correct===a.answers[i]).length;
      $('activity').innerHTML = `${heading}<p class="quiz-intro">इस अध्याय के पाठ पर आधारित पाँच प्रश्न। प्रत्येक प्रश्न के लिए एक उत्तर चुनें।</p>${a.checked?`<div class="quiz-result" role="status"><strong>५ में से ${num(score)} सही</strong>${score===5?'बहुत अच्छा। सीखे हुए विषय पर चिंतन करें।':'व्याख्या और मूल पाठ पढ़कर फिर प्रयास करें।'}</div>`:''}<p id="answer-progress" class="chapter-guide">५ में से ${num(answered)} के उत्तर दिए गए हैं</p><progress id="quiz-progress" max="5" value="${answered}" aria-label="उत्तर दिए गए प्रश्न"></progress><form id="quiz-form">${t.quiz.map((q,i)=>`<fieldset class="quiz-question"><legend><span class="qnumber">${num(i+1)}</span>${esc(q.q)}</legend><div class="options">${q.options.map((o,j)=>`<label class="option ${a.checked&&j===q.correct?'correct':''} ${a.checked&&a.answers[i]===j&&j!==q.correct?'wrong':''}"><input type="radio" name="question-${i}" value="${j}" data-question="${i}" ${a.answers[i]===j?'checked':''} ${a.checked?'disabled':''}><span>${esc(o)}${a.checked&&j===q.correct?' ✓':''}</span></label>`).join('')}</div>${a.checked?`<p class="feedback ${a.answers[i]===q.correct?'':'incorrect'}"><strong>${a.answers[i]===q.correct?'सही।':'सही उत्तर: '+esc(q.options[q.correct])+'।'}</strong> ${esc(q.explanation)} ${source(t)}</p>`:''}</fieldset>`).join('')}<div class="action-row">${a.checked?'<button type="button" id="retry-quiz" class="secondary-button">फिर प्रयास करें</button><button type="button" data-tab="notes" class="primary-button">अपना सारांश लिखें</button>':'<button type="submit" class="primary-button">पाँचों उत्तर जाँचें</button>'}</div><p id="quiz-error" class="form-error" role="alert"></p></form><p class="study-note">आपके उत्तर और परिणाम केवल इस अध्ययन सत्र में रहेंगे। ${source(t)}</p>`;
    } else {
      $('activity').innerHTML = `${heading}<p class="notes-intro">आपने क्या समझा? मुख्य विचार अपने शब्दों में लिखें और उसे जीवन में अपनाने का एक उपाय लिखें।</p><label class="note-label" for="personal-note">इस अध्याय पर मेरा चिंतन</label><textarea id="personal-note" maxlength="12000" placeholder="इस अध्याय से मैंने जो मुख्य विचार समझा है…"></textarea><p id="note-status" class="note-status" role="status">आपकी टिप्पणी केवल इस ब्राउज़र में अपने-आप सहेजी जाएगी।</p><p class="study-note">ये आपकी व्यक्तिगत टिप्पणियाँ हैं। ये अंग्रेज़ी और ओड़िया टिप्पणियों तथा अध्ययन सामग्री से अलग रहेंगी।</p>`;
      let value = notes.get(noteKey()) || '';
      if (!notes.has(noteKey())) { try { value = localStorage.getItem(noteKey()) || ''; } catch {} }
      $('personal-note').value = value;
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.chapter !== undefined) {go(Number(b.dataset.chapter));focusActivity();}
    else if (b.dataset.tab) {go(index,b.dataset.tab);$('tab-'+tab).focus({preventScroll:true});}
    else if (b.id === 'previous-topic') {go(index-1);focusActivity();}
    else if (b.id === 'next-topic') {go(index+1);focusActivity();}
    else if (b.id === 'retry-quiz') {attempts.delete(attemptKey());renderActivity();focusActivity();}
  });
  $('chapter-select').addEventListener('change', e => {go(Number(e.target.value));$('chapter-select').focus({preventScroll:true});});
  $('hindi-book').addEventListener('change', e => {bookIndex=Number(e.target.value);chapters=book().chapters;go(0);});
  document.addEventListener('change', e => {
    if (!e.target.matches('input[data-question]')) return;
    attempt().answers[Number(e.target.dataset.question)] = Number(e.target.value);
    const count = attempt().answers.filter(Number.isInteger).length;
    $('answer-progress').textContent = `५ में से ${num(count)} के उत्तर दिए गए हैं`;
    $('quiz-progress').value = count; $('quiz-error').textContent = '';
  });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'quiz-form') return; e.preventDefault();
    const a = attempt(), missing = current().quiz.findIndex((_,i)=>!Number.isInteger(a.answers[i]));
    if (missing >= 0) {
      $('quiz-error').textContent = `पहले पाँचों प्रश्नों के उत्तर दें। प्रश्न ${num(missing+1)} का उत्तर बाकी है।`;
      document.querySelector(`input[name="question-${missing}"]`).focus(); return;
    }
    a.checked = true; renderActivity(); focusActivity();
  });
  document.addEventListener('input', e => {
    if (e.target.id !== 'personal-note') return;
    notes.set(noteKey(),e.target.value);
    try {localStorage.setItem(noteKey(),e.target.value);$('note-status').textContent='केवल इस ब्राउज़र में सहेजा गया है। किसी अन्य से साझा नहीं किया गया है।';}
    catch {$('note-status').textContent='टिप्पणी केवल इस सत्र में रहेगी। ब्राउज़र में सहेजना संभव नहीं है; बंद करने से पहले इसकी प्रति रख लें।';}
  });
  $('study-tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    e.preventDefault(); const keys=Object.keys(tabs), i=keys.indexOf(tab);
    go(index,keys[e.key==='Home'?0:e.key==='End'?keys.length-1:(i+(e.key==='ArrowRight'?1:-1)+keys.length)%keys.length]);
    $('tab-'+tab).focus();
  });
  window.addEventListener('hashchange',readHash);
  if (!chapters.length) { $('activity').textContent='अध्ययन सामग्री नहीं खुल सकी। पृष्ठ फिर खोलें।'; return; }
  readHash();
})();
