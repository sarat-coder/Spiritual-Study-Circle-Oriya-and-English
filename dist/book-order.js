(() => {
  'use strict';
  const first = ['ramakatha-rasavahini', 'bhagavata-vahini'];
  window.orderVahiniBooks = books => [
    ...first.flatMap(id => books.filter(book => book.id === id)),
    ...books.filter(book => !first.includes(book.id))
  ];
})();
