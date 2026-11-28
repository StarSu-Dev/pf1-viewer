"use strict";

var state = { cat: "classes", query: "", slug: null, arch: "none" };

// ── Роутинг по hash: #/, #/classes, #/classes/wizard, #/classes/wizard/arch-slug ──
var CATS = {
  classes: 1,
  prestige: 1,
  npc: 1,
  traits: 1,
  skills: 1,
  races: 1,
  rules: 1,
};

function applyHash() {
  var parts = (location.hash || "")
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean);
  var cat = CATS[parts[0]] ? parts[0] : "home";
  var slug = parts[1] || null;
  var arch = parts[2] || "none";

  // Некорректный hash — на главную
  if (cat === "home" && parts.length) {
    location.replace("#/");
    return;
  }

  state.cat = cat;
  state.slug = slug;
  state.arch = arch;
  syncUI();
  // Мобильный: прямая ссылка на карточку — открываем карточку, не список
  if (slug && isMobile()) mainEl.classList.add("show-detail");

  // Данные раздела догружаем после отрисовки: список покажет
  // «Загрузка…», затем перерисуется (данные пришли)
  if (cat !== "home") {
    ensureList(cat, function () {
      // slug мог стать валидным только теперь — перепроверяем редирект
      if (
        state.slug &&
        !window.PF1_ITEMS.some(function (x) {
          return x.slug === state.slug && x._cat === state.cat;
        })
      ) {
        location.replace("#/" + state.cat);
        return;
      }
      syncUI();
    });
  }
}

function updateHash() {
  var h = "#/" + (state.cat === "home" ? "" : state.cat);
  if (state.slug) h += "/" + state.slug;
  if (state.slug && state.arch !== "none") h += "/" + state.arch;
  if (h !== location.hash) location.hash = h; // порождает hashchange → applyHash
}

// Приводим шапку/список/карточку в соответствие state (после hash-навигации)
function syncUI() {
  document.querySelectorAll("nav button").forEach(function (b) {
    b.classList.toggle("active", b.dataset.cat === state.cat);
  });
  mainEl.classList.toggle("home-view", state.cat === "home");
  if (isMobile() && state.cat === "home")
    mainEl.classList.remove("show-detail");
  searchEl.value = state.query = "";
  renderList();
  renderDetail();
}

window.addEventListener("hashchange", applyHash);
