"use strict";

// ── Приёмник данных ───────────────────────────────────────
// Файлы viewer/data/<категория>/ состоят из вызовов addIndex/addEntry.
// Этот файл определяет их; подключается раньше data-loader.js.

window.PF1_ITEMS = window.PF1_ITEMS || [];
// slug → true: полная запись уже загружена (в отличие от краткой из index.js)
window.PF1_FULL = window.PF1_FULL || {};

// Краткие записи списка (viewer/data/<cat>/index.js)
function addIndex(cat, items) {
  items.forEach(function (item) {
    if (item._cat) return; // защита от повторной загрузки
    item._cat = cat;
    item._partial = true; // только сводка: полная запись догрузится из <slug>.js
    window.PF1_ITEMS.push(item);
  });
}

// Одна полная запись (viewer/data/<cat>/<slug>.js)
function addEntry(cat, entry) {
  entry._cat = cat;
  delete entry._partial;
  window.PF1_FULL[cat + "/" + entry.slug] = true;
  var items = window.PF1_ITEMS;
  for (var i = 0; i < items.length; i++) {
    if (items[i]._cat === cat && items[i].slug === entry.slug) {
      items[i] = entry; // заменяем краткую запись из index.js
      return;
    }
  }
  items.push(entry);
  window.PF1_FULL[cat + "/" + entry.slug] = true;
}
