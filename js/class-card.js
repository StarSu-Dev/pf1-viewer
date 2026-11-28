"use strict";

// Текущий архетип (или null)
function currentArch() {
  if (state.arch === "none" || !state.slug) return null;
  var arches = ARCH_BY_CLASS[state.slug] || [];
  for (var i = 0; i < arches.length; i++)
    if (arches[i].slug === state.arch) return arches[i];
  return null;
}

function metaRow(label, value) {
  if (!value) return "";
  return "<dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd>";
}

// ── Таблица прогрессии ────────────────────────────────────
// Заклинания — отдельная колонка на каждый круг (0, 1, 2…),
// как на ttg.club. Особенности в «Прочее» — якорные ссылки
// на описания ниже; изменённые архетипом — зелёные.

function featAnchors(special) {
  // Ячейка «Прочее» — список через запятую. Связываем каждый элемент
  // с особенностью по имени (регистронезависимо, точное совпадение
  // или имя-префикс: «Атака исподтишка +1d6» → «Атака исподтишка»).
  var feats = window.__featIds || [];
  if (!special) return "";

  var byNorm = {};
  feats.forEach(function (f) {
    byNorm[normalizeText(f.name)] = f;
  });

  return special
    .split(",")
    .map(function (part) {
      var p = part.trim();
      if (!p) return "";

      var best = null;
      Object.keys(byNorm).forEach(function (n) {
        if (
          p.toLowerCase().indexOf(n) === 0 &&
          (!best || n.length > best.length)
        )
          best = n;
      });

      if (!best) return escapeHtml(p);
      var f = byNorm[best];
      var cls = "feat-link" + (f.changed ? " arch-link" : "");
      var rest = p.slice(best.length);
      return (
        '<a class="' +
        cls +
        '" href="#' +
        f.id +
        '">' +
        escapeHtml(p.slice(0, best.length)) +
        "</a>" +
        escapeHtml(rest)
      );
    })
    .filter(Boolean)
    .join('<span class="sep">,</span> ');
}

// Бонус вида «+0,75» или составной «+6,75/+1,75» (несколько атак):
// дробные суффиксы скрываются и показываются кнопкой «показать
// дробные бонусы» — как на pathfinder.family.
function bonusCell(v) {
  return String(v || "")
    .split("/")
    .map(function (p) {
      var m = /^\s*(\+\d+)(,\d+)?\s*$/.exec(p);
      if (!m) return escapeHtml(p.trim());
      return (
        escapeHtml(m[1]) +
        (m[2] ? '<span class="frac">' + escapeHtml(m[2]) + "</span>" : "")
      );
    })
    .join("/");
}

// noSaves — у класса нет колонок спасбросков (у Лича все спасброски
// равны модификатору Интеллекта, в таблице их не показываем)
function progressionTable(
  progression,
  circles,
  extraHeader,
  archByLvl,
  noSaves,
) {
  if (!progression || !progression.length) return "";
  var hasSpells = progression.some(function (r) {
    return (r.spells && r.spells.length) || r.spellcasting;
  });
  var hasFrac = progression.some(function (r) {
    return [r.bab, r.fort, r.ref, r.will].some(function (v) {
      return /,\d+$/.test(v || "");
    });
  });
  var hasExtra = progression.some(function (r) {
    return r.extra;
  });

  // Сколько колонок кругов: максимум по строкам
  var maxSpells = 0;
  progression.forEach(function (r) {
    if (r.spells && r.spells.length > maxSpells)
      maxSpells = r.spells.length;
  });

  var h = '<div class="table-wrap"><table><thead>';
  h +=
    '<tr><th rowspan="2">Ур.</th><th rowspan="2">БМА</th>' +
    (noSaves
      ? ""
      : '<th rowspan="2">Стойк.</th><th rowspan="2">Реакц.</th><th rowspan="2">Воля</th>') +
    '<th rowspan="2">Прочее</th>';
  if (hasExtra)
    h += '<th rowspan="2">' + escapeHtml(extraHeader || "Доп.") + "</th>";
  if (hasSpells)
    h +=
      '<th colspan="' +
      Math.max(maxSpells, 1) +
      '" class="group">Заклинания в день (по кругам)</th>';
  h += "</tr><tr>";
  if (hasSpells) {
    for (var c = 0; c < maxSpells; c++) {
      // Номер круга из шапки источника (у паладина/следопыта с 1)
      h +=
        '<th class="circle">' +
        (circles && circles[c] !== undefined ? circles[c] : c) +
        "</th>";
    }
  }
  h += "</tr></thead><tbody>";

  progression.forEach(function (r) {
    // Способности архетипа, приходящие на этом уровне, — зелёными
    // якорями в «Прочее» (переносят к карточке способности)
    var cell = featAnchors(r.special);
    var lvlFeats = archByLvl && archByLvl[r.level];
    if (lvlFeats) {
      var links = lvlFeats
        .map(function (f) {
          return (
            '<a class="feat-link arch-link" href="#' +
            f.id +
            '">' +
            escapeHtml(f.name) +
            "</a>"
          );
        })
        .join('<span class="sep"> · </span>');
      if (links)
        cell += (cell ? '<span class="sep"> · </span>' : "") + links;
    }
    h +=
      '<tr data-level="' +
      r.level +
      '"><td>' +
      r.level +
      "</td><td>" +
      bonusCell(r.bab) +
      "</td>" +
      (noSaves
        ? ""
        : "<td>" +
          bonusCell(r.fort) +
          "</td><td>" +
          bonusCell(r.ref) +
          "</td><td>" +
          bonusCell(r.will) +
          "</td>") +
      '<td class="left">' +
      cell +
      "</td>";
    if (hasExtra) h += '<td class="left">' + escapeHtml(r.extra || "") + "</td>";

    if (hasSpells) {
      if (r.spellcasting) {
        h +=
          '<td colspan="' +
          Math.max(maxSpells, 1) +
          '" class="left">' +
          escapeHtml(r.spellcasting) +
          "</td>";
      } else if (r.spells) {
        for (var j = 0; j < maxSpells; j++) {
          var n = r.spells[j];
          if (n === undefined || n === "")
            h += '<td class="spell-col zero"></td>';
          else h += '<td class="spell-col">' + escapeHtml(n) + "</td>"; // «3», «1+1» (база + домен)
        }
      } else {
        for (var k = 0; k < maxSpells; k++)
          h += '<td class="spell-col zero"></td>';
      }
    }
    h += "</tr>";
  });

  h += "</tbody></table></div>";
  if (hasFrac) {
    h +=
      '<p><button type="button" class="frac-toggle">показать дробные бонусы</button></p>';
  }
  return h;
}

// ── Особенности класса с учётом архетипа ──────────────────
// Развёрнуты по умолчанию; изменённые архетипом — зелёные,
// с версией архетипа и свёрнутым оригиналом внутри (как ttg).

// Уровень каждой особенности класса: первый уровень в таблице,
// где имя особенности встречается в колонке «Прочее».
// Уточнения в скобках игнорируются: «Аура (Экс)» ≈ «аура».
function computeFeatLevels(features, progression) {
  var map = {};
  if (!features || !progression) return map;
  var cores = features.map(function (f) {
    return {
      key: normalizeText(f.name),
      core: normalizeText(f.name).replace(/\s*\([^)]*\)\s*$/, ""),
    };
  });
  progression.forEach(function (r) {
    if (!r.special) return;
    var parts = r.special.split(",").map(function (p) {
      return normalizeText(p);
    });
    parts.forEach(function (p) {
      if (!p) return;
      cores.forEach(function (c) {
        // «атака исподтишка +1d6» начинается с имени особенности
        if (map[c.key] === undefined && c.core && p.indexOf(c.core) === 0)
          map[c.key] = r.level;
      });
    });
  });
  return map;
}

function featuresBlock(features, arch, featLevel) {
  if (!features || !features.length) return "";
  var changedMap = {};
  var added = [];
  var classNorms = {};
  features.forEach(function (f) {
    classNorms[normalizeText(f.name)] = true;
  });

  if (arch && arch.changes) {
    arch.changes.forEach(function (c) {
      changedMap[normalizeText(c.name)] = c;
      if (!classNorms[normalizeText(c.name)]) added.push(c); // новая особенность, не замена
    });
  }
  window.__changedMap = changedMap;

  // Реестр якорей для таблицы
  var ids = [];
  var h = "";

  features.forEach(function (f, i) {
    var id = "feat-" + i;
    var change = changedMap[normalizeText(f.name)];
    ids.push({ name: f.name, id: id, changed: !!change });
    if (f.sealed) {
      h += sealedBlock(f, id);
      return;
    }

    h +=
      '<details class="feat' +
      (change ? " arch-feat" : "") +
      '" id="' +
      id +
      '" open>' +
      "<summary>" +
      escapeHtml(f.name) +
      (change ? '<span class="arch-badge">архетип</span>' : "") +
      "</summary>";
    if (change) {
      h +=
        "<p>" +
        escapeHtml(change.description) +
        "</p>" +
        '<details class="orig"><summary>оригинал класса</summary><p>' +
        escapeHtml(f.description) +
        "</p></details>";
    } else {
      h += "<p>" + escapeHtml(f.description) + "</p>";
    }
    h += "</details>";
  });

  // Особенности, добавленные архетипом: вставляем в список по уровню
  // получения (как на ttg) — после последней особенности класса,
  // приходящей не позже. Без известного уровня — в конец.
  var inserts = []; // {afterIdx, feat}
  added.forEach(function (c) {
    var lvl = c.level || 0;
    if (!lvl && c.replaces && c.replaces.length) {
      // уровень заменяемой особенности из таблицы
      c.replaces.forEach(function (r) {
        var l = featLevel[normalizeText(r)];
        if (l && (!lvl || l < lvl)) lvl = l;
      });
    }
    inserts.push({ feat: c, lvl: lvl });
  });

  // Вставляем по убыванию уровня: каждая новая карточка встаёт сразу
  // после якоря, поэтому в итоге группа оказывается по возрастанию.
  inserts.sort(function (a, b) {
    return b.lvl - a.lvl;
  });
  inserts.forEach(function (ins, insIdx) {
    var id = "feat-add-" + insIdx;
    ids.push({ name: ins.feat.name, id: id, changed: true });

    var html =
      '<details class="feat arch-feat" id="' +
      id +
      '" open>' +
      "<summary>" +
      escapeHtml(ins.feat.name) +
      '<span class="arch-badge">архетип</span></summary>' +
      "<p>" +
      escapeHtml(ins.feat.description) +
      "</p></details>";

    var idx = -1;
    features.forEach(function (f, i) {
      var l = featLevel[normalizeText(f.name)];
      if (l && l <= ins.lvl) idx = i;
    });

    if (idx >= 0) {
      // после закрывающего </details> особенности idx
      var anchor =
        '<details class="feat' +
        (changedMap[normalizeText(features[idx].name)] ? " arch-feat" : "") +
        '" id="feat-' +
        idx +
        '"';
      var pos = h.indexOf(anchor);
      if (pos >= 0)
        pos = h.indexOf("</details>", pos) + "</details>".length;
      if (pos >= 0 && pos > 0) {
        h = h.slice(0, pos) + html + h.slice(pos);
        return;
      }
    }
    h += html; // fallback: в конец
  });

  window.__featIds = ids;
  return h;
}

function toggleAllFeats(open) {
  detailEl.querySelectorAll("details.feat").forEach(function (d) {
    d.open = open;
  });
}

// ── Блок выбора архетипа (над таблицей) ───────────────────
function archetypesBlock(classSlug, title) {
  var arches = ARCH_BY_CLASS[classSlug];
  if (!arches || !arches.length) return "";
  title = title || "Архетип";

  var options =
    '<option value="none">— без архетипа —</option>' +
    arches
      .map(function (a) {
        var sel = a.slug === state.arch ? " selected" : "";
        return (
          '<option value="' +
          escapeHtml(a.slug) +
          '"' +
          sel +
          ">" +
          escapeHtml(a.nameRu) +
          "</option>"
        );
      })
      .join("");

  var arch = currentArch();

  var h =
    '<div class="arch-section">' +
    "<h3>" +
    escapeHtml(title) +
    ' <span style="color:var(--muted);font-size:13px;font-weight:normal">(' +
    arches.length +
    ")</span></h3>" +
    '<p class="hint">' +
    (title === "Подкласс"
      ? "Подкласс изменяет классовые особенности."
      : "Архетип изменяет классовые особенности.") +
    "</p>" +
    '<select class="arch-select" id="archSelect">' +
    options +
    "</select>";

  if (arch && arch.description) {
    h += '<p class="arch-note">' + escapeHtml(arch.description) + "</p>";
  }

  h +=
    '<div class="legend">' +
    '<span><span style="color:var(--arch)">■</span> — изменено архетипом</span>' +
    '<span><span style="color:var(--link)">■</span> — особенность класса</span>' +
    "</div></div>";
  return h;
}

// ── Карточка класса ───────────────────────────────────────
