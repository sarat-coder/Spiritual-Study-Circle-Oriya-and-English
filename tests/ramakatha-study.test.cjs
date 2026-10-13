const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..', 'dist');

function loadPage(file) {
  const nodes = new Map(), handlers = {}, saved = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      innerHTML:'', textContent:'', value:'', classList:{toggle(){}},
      focus(){}, scrollIntoView(){}, setAttribute(){},
      addEventListener(type, handler){handlers[id + ':' + type] = handler;}
    });
    return nodes.get(id);
  };
  const context = {
    window:{addEventListener(type, handler){handlers['window:' + type] = handler;}},
    document:{getElementById:node, querySelector:node, addEventListener(type, handler){handlers[type] = handler;}},
    location:{hash:'#ramakatha-rasavahini/part-1-chapter-01/summary'},
    history:{replaceState(a, b, hash){context.location.hash = hash;}},
    localStorage:{getItem(key){return saved.get(key) || null;}, setItem(key, value){saved.set(key, value);}}, URL
  };
  vm.createContext(context);
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of html.matchAll(/<script defer src="([^"?]+)(?:\?[^" ]*)?"><\/script>/g)) {
    vm.runInContext(fs.readFileSync(path.join(root, match[1]), 'utf8'), context, {filename:match[1]});
  }
  for (const match of html.matchAll(/<link rel="stylesheet" href="([^"?]+)(?:\?[^" ]*)?">/g)) {
    assert(fs.existsSync(path.join(root, match[1])), match[1]);
  }
  const route = (book, topic, activity) => {
    context.location.hash = `#${book.id}/${topic.id}/${activity}`;
    handlers['window:hashchange']();
    return node('activity').innerHTML;
  };
  return {context, node, route};
}

let reference;
for (const [file, language] of [['index.html','en'], ['odia.html','or'], ['hindi.html','hi']]) {
  const {context, node, route} = loadPage(file);
  const {VAHINI_BOOKS:books, RAMAKATHA_STUDIES:studies, renderRamakathaStudy:render} = context.window;
  const rama = books.find(book => book.id === 'ramakatha-rasavahini');
  const data = JSON.parse(JSON.stringify(studies));
  assert.equal(Object.keys(data).length, 32);
  assert.deepEqual(Object.keys(data), Array.from(rama.topics, topic => topic.id), 'chapter IDs and order');
  if (reference) {
    assert.deepEqual(Object.keys(data), Object.keys(reference));
  } else reference = data;
  let expanded = 0, entries = 0;
  for (const book of books) for (const topic of book.topics) {
    const summary = route(book, topic, 'summary');
    assert.equal((summary.match(/class="summary-text"/g) || []).length, 2);
    const isRama = book.id === rama.id;
    assert.equal(summary.includes('class="chapter-values"'), isRama, `${language}/${book.id}/${topic.id}`);
    if (isRama) {
      expanded++;
      const entry = data[topic.id];
      assert.equal(entry.length, 5);
      const [values, characters, example, reflection, page] = entry;
      for (const text of [values, example, reflection]) assert.equal(typeof text, 'string');
      assert(values.length > 100 && example.length > 100 && reflection.length > 50);
      assert(characters.length >= 2);
      for (const character of characters) {
        assert.equal(character.length, 2);
        assert(character[0].length > 1 && character[1].length > 25);
      }
      assert.equal(characters.length, reference[topic.id][1].length, 'character coverage across languages');
      assert.equal(page, reference[topic.id][4], 'source page parity');
      assert(Number.isInteger(page) && page >= topic.pdfStartPage && page <= topic.pdfEndPage);
      assert(summary.includes(`assets/ramakatha-rasavahini-part-${topic.part}.pdf#page=${page}`));
      assert(fs.existsSync(path.join(root, `assets/ramakatha-rasavahini-part-${topic.part}.pdf`)));
      assert.equal((summary.match(/class="values-section"/g) || []).length, 4);
      assert.equal((summary.match(/id="chapter-values-heading"/g) || []).length, 1);
      assert.equal((summary.match(/<dt>/g) || []).length, characters.length);
      const text = JSON.stringify(entry);
      assert(!text.includes('\ufffd'));
      if (language === 'or') assert(!/[A-Za-z\u0900-\u0963\u0966-\u097f]/u.test(text), `Odia text only: ${topic.id}`);
      if (language === 'hi') assert(!/[A-Za-z\u0b00-\u0b7f]/u.test(text), 'Hindi text only');
    }
    for (const activity of ['questions','quiz','notes']) {
      const markup = route(book, topic, activity);
      assert(!markup.includes('class="chapter-values"'));
      if (activity === 'questions') assert.equal((markup.match(/<details>/g) || []).length, 5);
      if (activity === 'quiz') assert.equal((markup.match(/<fieldset/g) || []).length, 5);
    }
    entries++;
  }
  assert.equal(expanded, 32);
  assert.equal(entries, 402);
  route(rama, rama.topics[0], 'summary');
  assert(node('previous-topic').disabled);
  route(rama, rama.topics.at(-1), 'summary');
  assert(node('next-topic').disabled);
  const topic = rama.topics[0];
  assert.equal(render('other-book', topic, language), '');
  assert.equal(render(rama.id, {...topic, id:'missing'}, language), '');
  assert.equal(render(rama.id, topic, 'unknown'), '');
  const original = studies[topic.id];
  studies[topic.id] = ['<img onerror="bad()">', [['<script>', '<b>unsafe</b>']], '<svg>', '<a>', 9999];
  const escaped = render(rama.id, topic, language);
  assert(!escaped.includes('<img') && !escaped.includes('<script>') && !escaped.includes('<svg>'));
  assert(escaped.includes('&lt;img'));
  assert(escaped.includes(`#page=${topic.pdfStartPage}`));
  studies[topic.id] = original;
  console.log(`PASS ${language}: 32 expanded studies, 402 entries, four activities, source links, localization, boundaries and escaping.`);
}
