"use strict";

function visible() {
  var q = state.query.trim().toLowerCase();
  return window.PF1_ITEMS.filter(function (it) {
    if (it._cat !== state.cat) return false;
    if (!q) return true;
    return (
      (it.nameRu || "").toLowerCase().indexOf(q) >= 0 ||
      (it.nameEn || "").toLowerCase().indexOf(q) >= 0
    );
  });
}
// Разделы, списки которых показываются карточками (как на ttg.club)
var CARD_CATS = {
  classes: "⚔️",
  prestige: "🌟",
  npc: "🎭",
  races: "🧝",
  rules: "📖",
};

function renderList() {
  // Данные раздела ещё грузятся (ленивая загрузка)
  if (state.cat !== "home" && !loadedCats[state.cat]) {
    listEl.innerHTML =
      '<div class="empty" style="padding:20px">Загрузка данных…</div>';
    return;
  }
  var items = visible();
  // Домашние классы (Rabbit Hole) — всегда первыми в списке
  items.sort(function (a, b) {
    return (
      (b.devilTheme || b.lichTheme ? 1 : 0) -
      (a.devilTheme || a.lichTheme ? 1 : 0)
    );
  });

  // Карточная сетка для классов/престижей/NPC/рас: иконка/фото + описание
  if (CARD_CATS[state.cat]) {
    var html = items
      .map(function (it) {
        var cls =
          "card" +
          (it.devilTheme
            ? " devil-card"
            : it.lichTheme
              ? " lich-card"
              : "") +
          (it.slug === state.slug ? " active" : "");
        var ico = it.image
          ? '<img src="' +
            escapeHtml(it.image) +
            '" alt="' +
            escapeHtml(it.nameRu) +
            '" loading="lazy" decoding="async">'
          : escapeHtml(CARD_CATS[state.cat]);
        var desc = shortDesc(
          // краткая запись: готовое первое предложение
          it.lead || "",
          110,
        );
        return (
          '<button class="' +
          cls +
          '" data-slug="' +
          escapeHtml(it.slug) +
          '">' +
          '<span class="card-ico">' +
          ico +
          "</span>" +
          '<span class="card-title"><b>' +
          escapeHtml(it.nameRu) +
          "</b>" +
          '<span class="en">' +
          escapeHtml(it.nameEn || "") +
          "</span></span>" +
          (desc
            ? '<span class="card-desc">' + escapeHtml(desc) + "</span>"
            : "") +
          "</button>"
        );
      })
      .join("");
    listEl.innerHTML = html
      ? '<div class="card-grid">' + html + "</div>"
      : '<div class="empty" style="padding:20px">Ничего не найдено</div>';
    return;
  }

  var listHtml = items
    .map(function (it) {
      var cls = "item" + (it.slug === state.slug ? " active" : "");
      return (
        '<div class="' +
        cls +
        '" data-slug="' +
        escapeHtml(it.slug) +
        '">' +
        "<span>" +
        escapeHtml(it.nameRu) +
        "</span>" +
        '<span class="en">' +
        escapeHtml(it.nameEn || "") +
        "</span></div>"
      );
    })
    .join("");
  listEl.innerHTML =
    listHtml ||
    '<div class="empty" style="padding:20px">Ничего не найдено</div>';
}
