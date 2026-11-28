"use strict";

function raceQuickFacts(it) {
  var chips = [];
  var abilityRe = /([+−-]\d+)\s+([а-яёА-ЯЁ]+)/g;
  (it.traits || []).forEach(function (t) {
    // Бонусы могут лежать и в имени особенности («+2 Ловкость, +2 Интеллект…»),
    // и в описании отдельной особенности «Модификаторы характеристик»
    var source = abilityRe.test(t.name)
      ? t.name
      : /модификатор/i.test(t.name)
        ? t.description
        : "";
    abilityRe.lastIndex = 0;
    if (source) {
      // «+2 к значению одной характеристики» (человек) — особая плашка
      if (/одной характеристики/i.test(source)) {
        chips.push({
          lbl: "Характеристики",
          val: "+2 к любой",
          ability: true,
        });
        return;
      }
      var m;
      while ((m = abilityRe.exec(source))) {
        // отсеиваем предлоги и служебные слова («+2 к …»)
        if (m[2].length < 3) continue;
        chips.push({
          lbl: "Характеристики",
          val: m[1] + " " + m[2].toLowerCase(),
          ability: true,
        });
      }
    } else if (/размер/i.test(t.name)) {
      chips.push({
        lbl: "Размер",
        val: t.name.replace(/^\s*размер\s*/i, "").trim() || t.name,
      });
    } else if (/скорость/i.test(t.name)) {
      chips.push({
        lbl: "Скорость",
        val:
          t.name.replace(/^\s*(нормальная|обычная)\s*/i, "").trim() ||
          t.name,
      });
    }
  });
  return chips;
}

function renderRace(it) {
  var h = '<div class="content">';
  h += '<span class="back-link" id="backToList">← к списку</span>';
  // Место под изображение: если арта нет — стилизованная заглушка
  if (it.image) {
    h +=
      '<div class="race-photo"><img loading="lazy" decoding="async" src="' +
      escapeHtml(it.image) +
      '" alt="' +
      escapeHtml(it.nameRu) +
      '"></div>';
  } else {
    h += '<div class="race-photo" title="Портрет народа">🧝</div>';
  }
  h +=
    "<h2>" +
    escapeHtml(it.nameRu) +
    '<span class="kind-badge">народ</span></h2>';
  h +=
    '<div class="en-name">' +
    escapeHtml(it.nameEn || "") +
    (it.book ? " · " + escapeHtml(it.book) : "") +
    "</div>";

  var facts = raceQuickFacts(it);
  if (facts.length) {
    h +=
      '<div class="quick-facts">' +
      facts
        .map(function (f) {
          return (
            '<span class="qf' +
            (f.ability ? " ability" : "") +
            '">' +
            '<span class="lbl">' +
            escapeHtml(f.lbl) +
            "</span>" +
            escapeHtml(f.val) +
            "</span>"
          );
        })
        .join("") +
      "</div>";
  }

  if (it.description) h += "<p>" + escapeHtml(it.description) + "</p>";

  // Базовые особенности народа — раскрыты; альтернативные — свёрнуты
  function traitBlocks(list, open) {
    return list
      .map(function (t) {
        var sub =
          t.related && t.related.length
            ? '<p class="race-trait-related">вместо: ' +
              t.related.map(escapeHtml).join(", ") +
              "</p>"
            : "";
        return (
          '<details class="feat"' +
          (open ? " open" : "") +
          "><summary>" +
          escapeHtml(t.name) +
          "</summary>" +
          sub +
          "<p>" +
          escapeHtml(t.description) +
          "</p></details>"
        );
      })
      .join("");
  }

  if (it.traits && it.traits.length) {
    h += "<h3>Особенности народа</h3>" + traitBlocks(it.traits, true);
  }
  if (it.altTraits && it.altTraits.length) {
    h +=
      "<h3>Альтернативные особенности</h3>" +
      traitBlocks(it.altTraits, false);
  }

  var lore = [
    ["physicalDescription", "Внешность"],
    ["society", "Общество"],
    ["relations", "Отношения"],
    ["alignmentAndReligion", "Мировоззрение и религия"],
    ["adventurers", "Приключенцы"],
  ];
  var loreHtml = lore
    .filter(function (p) {
      return it[p[0]];
    })
    .map(function (p) {
      return (
        '<details class="feat"><summary>' +
        p[1] +
        "</summary><p>" +
        escapeHtml(it[p[0]]) +
        "</p></details>"
      );
    })
    .join("");
  if (loreHtml) h += "<h3>О народе</h3>" + loreHtml;

  if (it.names && it.names.length) {
    var male = [],
      female = [];
    it.names.forEach(function (n) {
      (n.isMale ? male : female).push(escapeHtml(n.name));
    });
    h += "<h3>Имена</h3>";
    if (male.length)
      h += "<p><b>Мужские:</b> " + male.join(", ") + "</p>";
    if (female.length)
      h += "<p><b>Женские:</b> " + female.join(", ") + "</p>";
  }

  if (it.favoredClass && it.favoredClass.length) {
    h += "<h3>Предпочитаемые классы</h3>";
    // У одного класса бывает несколько альтернативных бонусов — показываем одним блоком
    var byClass = [];
    it.favoredClass.forEach(function (fc) {
      var group = byClass.find(function (g) {
        return g.alias === fc.alias && g.name === fc.name;
      });
      if (!group) byClass.push((group = { alias: fc.alias, name: fc.name, bonuses: [] }));
      group.bonuses.push(fc.description);
    });
    byClass.forEach(function (fc) {
      var name = fc.alias
        ? '<a href="#/classes/' +
          escapeHtml(fc.alias) +
          '">' +
          escapeHtml(fc.name) +
          "</a>"
        : escapeHtml(fc.name);
      h +=
        '<details class="feat favored"><summary>' +
        name +
        "</summary>" +
        fc.bonuses
          .map(function (text) {
            return "<p>" + escapeHtml(text) + "</p>";
          })
          .join("") +
        "</details>";
    });
  }

  return h + "</div>";
}

// ── Статьи правил и механик ───────────────
// Словарь терминов с подсказками (курсор/тап — всплывающее пояснение)
