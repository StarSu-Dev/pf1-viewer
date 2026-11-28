"use strict";

// ── Ленивая загрузка данных ───────────────────────────────
// viewer/data/<категория>/index.js — краткие записи для списков,
// <категория>/<slug>.js — полная запись, грузится при открытии карточки.
// Поэтому archetypes (11 МБ суммарно) не грузится целиком: список
// архетипов класса берётся из index.js, а карточка архетипа — из
// одного маленького файла.

// Разделы сайта: для каждого — папка viewer/data/<категория>/
var DATA_CATS = [
  "classes",
  "prestige",
  "npc",
  "traits",
  "skills",
  "races",
  "rules",
];

// Категория → true: index.js загружен (список готов)
var loadedCats = {};

function loadScript(src, cb) {
  var s = document.createElement("script");
  // Локальная разработка: без кэша. На Pages кэш и так 10 минут.
  s.src = src + (location.port ? "?t=" + Date.now() : "");
  s.onload = cb;
  s.onerror = function () {
    console.error("Не удалось загрузить " + src);
    cb();
  };
  document.head.appendChild(s);
}

// Загружает краткие записи категории (для списка), затем cb
function ensureList(cat, cb) {
  if (loadedCats[cat]) {
    if (cb) cb();
    return;
  }
  loadedCats[cat] = true;
  loadScript("data/" + cat + "/index.js", function () {
    updateHomeCounts();
    if (cb) cb();
  });
}

// Загружает полную запись (карточка), затем cb. Список должен быть готов.
function ensureEntry(cat, slug, cb) {
  var items = window.PF1_ITEMS;
  for (var i = 0; i < items.length; i++) {
    if (items[i]._cat === cat && items[i].slug === slug && !items[i]._partial) {
      if (cb) cb();
      return;
    }
  }
  loadScript("data/" + cat + "/" + slug + ".js", cb);
}

// ── Архетипы ──────────────────────────────────────────────
// Плоский список кратких записей + индекс по родительскому классу
var ARCHETYPES = [];
var ARCH_BY_CLASS = {};
var archetypesLoaded = false;

function ensureArchetypes(cb) {
  if (archetypesLoaded) {
    if (cb) cb();
    return;
  }
  archetypesLoaded = true;
  loadScript("data/archetypes/index.js", function () {
    buildArchIndex();
    if (cb) cb();
  });
}

function buildArchIndex() {
  ARCHETYPES = window.PF1_ITEMS.filter(function (x) {
    return x._cat === "archetypes";
  });
  ARCH_BY_CLASS = {};
  ARCHETYPES.forEach(function (a) {
    if (!a.classSlug) return;
    (ARCH_BY_CLASS[a.classSlug] = ARCH_BY_CLASS[a.classSlug] || []).push(a);
  });
}

// Полная запись архетипа заменяет краткую в общем списке (addEntry)
function ensureArchEntry(slug, cb) {
  ensureEntry("archetypes", slug, function () {
    buildArchIndex();
    if (cb) cb();
  });
}
