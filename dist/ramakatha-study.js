(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = {
    en: {
      title:'Values and character study', values:'Moral values', characters:'Characters and lessons',
      example:'Story or illustration in this chapter', reflection:'A reflection for daily life',
      note:'Independent study reflections based on the supplied chapter, not quotations or additional teachings attributed to Bhagawan. The example below is retold from this book; the daily-life reflection is an editorial application.',
      part:'Part', pages:'Chapter PDF pages', source:'Read the example in the source PDF', digits:'0123456789'
    },
    or: {
      title:'ମୂଲ୍ୟବୋଧ ଓ ଚରିତ୍ର ଅଧ୍ୟୟନ', values:'ନୈତିକ ମୂଲ୍ୟବୋଧ', characters:'ଚରିତ୍ର ଓ ଶିକ୍ଷା',
      example:'ଏହି ଅଧ୍ୟାୟର କଥା ବା ଦୃଷ୍ଟାନ୍ତ', reflection:'ଦୈନନ୍ଦିନ ଜୀବନ ପାଇଁ ଚିନ୍ତନ',
      note:'ପ୍ରଦତ୍ତ ଅଧ୍ୟାୟ ଆଧାରିତ ସ୍ୱାଧୀନ ଅଧ୍ୟୟନ ଚିନ୍ତନ; ଏଗୁଡ଼ିକ ଉଦ୍ଧୃତି ବା ଭଗବାନଙ୍କ ନାମରେ ଯୋଡ଼ାଯାଇଥିବା ଅତିରିକ୍ତ ଶିକ୍ଷା ନୁହେଁ। ନିମ୍ନ ଦୃଷ୍ଟାନ୍ତ ଏହି ପୁସ୍ତକରୁ ନିଜ ଭାଷାରେ କୁହାଯାଇଛି; ଦୈନନ୍ଦିନ ଚିନ୍ତନ ସମ୍ପାଦକୀୟ ପ୍ରୟୋଗ।',
      part:'ଭାଗ', pages:'ଅଧ୍ୟାୟର ପିଡିଏଫ ପୃଷ୍ଠା', source:'ମୂଳ ପିଡିଏଫରେ ଦୃଷ୍ଟାନ୍ତ ପଢ଼ନ୍ତୁ', digits:'୦୧୨୩୪୫୬୭୮୯'
    },
    hi: {
      title:'मूल्य और चरित्र अध्ययन', values:'नैतिक मूल्य', characters:'पात्र और सीख',
      example:'इस अध्याय की कथा या दृष्टांत', reflection:'दैनिक जीवन के लिए चिंतन',
      note:'प्रदत्त अध्याय पर आधारित स्वतंत्र अध्ययन चिंतन; ये उद्धरण या भगवान के नाम पर जोड़ी गई अतिरिक्त शिक्षाएँ नहीं हैं। नीचे का उदाहरण इसी पुस्तक से अपने शब्दों में प्रस्तुत है; दैनिक जीवन का चिंतन संपादकीय अनुप्रयोग है।',
      part:'भाग', pages:'अध्याय के पीडीएफ पृष्ठ', source:'मूल पीडीएफ में उदाहरण पढ़ें', digits:'०१२३४५६७८९'
    }
  };
  window.renderRamakathaStudy = (bookId, topic, language) => {
    if (bookId !== 'ramakatha-rasavahini') return '';
    const entry = window.RAMAKATHA_STUDIES?.[topic.id], l = labels[language];
    if (!entry || !l) return '';
    const [values, characters, example, reflection, page] = entry;
    const number = n => String(n).replace(/\d/g, d => l.digits[d]);
    // Derive links from known parts and constrain page references to the current chapter.
    const sourcePage = Number.isInteger(page) && page >= topic.pdfStartPage && page <= topic.pdfEndPage ? page : topic.pdfStartPage;
    if (![1,2].includes(topic.part) || !Number.isInteger(sourcePage) || sourcePage < 1) return '';
    const url = `assets/ramakatha-rasavahini-part-${topic.part}.pdf#page=${sourcePage}`;
    return `<section class="chapter-values" aria-labelledby="chapter-values-heading" lang="${language}">
      <h4 id="chapter-values-heading">${l.title}</h4>
      <p class="values-note">${l.note}</p>
      <section class="values-section"><h5>${l.values}</h5><p>${escape(values)}</p></section>
      <section class="values-section"><h5>${l.characters}</h5><dl class="character-lessons">${characters.map(([name, lesson]) => `<div><dt>${escape(name)}</dt><dd>${escape(lesson)}</dd></div>`).join('')}</dl></section>
      <section class="values-section"><h5>${l.example}</h5><p>${escape(example)}</p><p class="values-source"><a href="${url}" target="_blank" rel="noopener noreferrer">${l.source}</a><span>${l.part} ${number(topic.part)} · ${l.pages} ${number(topic.pdfStartPage)}–${number(topic.pdfEndPage)}</span></p></section>
      <section class="values-section"><h5>${l.reflection}</h5><p>${escape(reflection)}</p></section>
    </section>`;
  };
})();
