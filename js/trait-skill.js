"use strict";

function renderTrait(it) {
  var h = '<div class="content">';
  h += '<span class="back-link" id="backToList">← к списку</span>';
  h +=
    "<h2>" +
    escapeHtml(it.nameRu) +
    '<span class="kind-badge">штрих</span></h2>';
  h +=
    '<div class="en-name">' +
    escapeHtml(it.nameEn || "") +
    (it.book ? " · " + escapeHtml(it.book) : "") +
    "</div>";

  h += '<dl class="meta">';
  if (it.typeName)
    h += metaRow(
      "Тип",
      it.typeName +
        (it.parentTypeName ? " (" + it.parentTypeName + ")" : ""),
    );
  if (it.prerequisites) h += metaRow("Требования", it.prerequisites);
  h += "</dl>";

  if (it.benefit) h += "<h3>Польза</h3><p>" + escapeHtml(it.benefit) + "</p>";
  if (it.typeDescription) {
    h +=
      '<details class="feat"><summary>Описание типа: ' +
      escapeHtml(it.typeName) +
      "</summary><p>" +
      escapeHtml(it.typeDescription) +
      "</p></details>";
  }

  return h + "</div>";
}

// ── Навыки (матрица навык×класс) ─────────
function renderSkill(it) {
  var h = '<div class="content">';
  h += '<span class="back-link" id="backToList">← к списку</span>';
  h +=
    "<h2>" +
    escapeHtml(it.nameRu) +
    '<span class="kind-badge">навык</span></h2>';

  if (it.classes && it.classes.length) {
    var classSkills = it.classes.filter(function (c) {
      return c.isClassSkill;
    });
    var other = it.classes.filter(function (c) {
      return !c.isClassSkill;
    });

    h +=
      '<h3>Классовый навык <span style="color:var(--muted);font-size:13px;font-weight:normal">(' +
      classSkills.length +
      " из " +
      it.classes.length +
      " классов)</span></h3>";
    h +=
      '<div class="chips">' +
      classSkills
        .map(function (c) {
          return (
            '<span class="chip" style="border-color:var(--accent2);color:var(--text)">' +
            escapeHtml(c.name) +
            "</span>"
          );
        })
        .join("") +
      "</div>";

    if (other.length) {
      h += "<h3>Неклассовый</h3>";
      h +=
        '<div class="chips">' +
        other
          .map(function (c) {
            return '<span class="chip">' + escapeHtml(c.name) + "</span>";
          })
          .join("") +
        "</div>";
    }
  }

  return h + "</div>";
}

// ── Народы (расы) ─────────────────────────
// Ключевые параметры из особенностей: бонусы характеристик,
// размер, скорость — плашками, как на dnd.su.
