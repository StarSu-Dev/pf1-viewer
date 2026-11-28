"use strict";

var unsealed = {}; // normalizeText(название) → true
var sealedFeats = {}; // normalizeText(название) → особенность

function sealNorm(s) {
  return normalizeText(s)
    .replace(/ё/g, "е")
    .replace(/[\s!.…—-]+$/, "");
}

function sealedBlock(f, id) {
  var s = f.sealed;
  var key = normalizeText(f.name);
  var open = !!unsealed[key];
  sealedFeats[key] = f;

  var h =
    '<details class="feat sealed-card" id="' +
    id +
    '" data-seal="' +
    escapeHtml(key) +
    '" open>' +
    "<summary>" +
    escapeHtml(f.name) +
    '<span class="seal-badge">' +
    (open ? "печать снята" : "запечатанно") +
    "</span></summary>" +
    '<div class="seal' +
    (open ? " open" : "") +
    '">' +
    '<div class="seal-doc" aria-label="Замазанный текст">';
  s.lines.forEach(function (l, i) {
    h +=
      '<span class="seal-line' +
      (l.cls ? " " + l.cls : "") +
      '" style="--w:' +
      (+l.w || 100) +
      "%;--i:" +
      i +
      '">' +
      '<span class="seal-text" data-t="' +
      escapeHtml(l.t) +
      '">' +
      escapeHtml(l.t) +
      "</span></span>";
  });
  h += "</div>";
  h += f.description
    ? '<p class="seal-note">' + escapeHtml(f.description) + "</p>"
    : "";
  if (!open) {
    h +=
      '<div class="seal-form">' +
      '<input class="seal-input" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="******" aria-label="Фраза, чтобы снять цензуру">' +
      '<button type="button" class="seal-btn">Распечатать</button></div>';
  }
  return h + "</div></details>";
}

// Проверяет поле; при совпадении раскрывает текст на месте
function trySeal(input, strict) {
  var card = input.closest("details.sealed-card");
  if (!card) return;
  var f = sealedFeats[card.dataset.seal];
  var value = input.value;
  if (f && value && sealNorm(value) === sealNorm(f.sealed.answer)) {
    unsealed[normalizeText(f.name)] = true;
    var seal = card.querySelector(".seal");
    seal.classList.add("open");
    card.querySelector(".seal-badge").textContent = "печать снята";
    card.querySelector(".seal-form").remove();
    var note = document.createElement("p");
    note.className = "seal-note";
    note.textContent = "Печать снята.";
    seal.appendChild(note);
    return;
  }
  // Неверную фразу подсвечиваем только по Enter/кнопке, не на каждой букве
  if (strict && value) {
    input.classList.remove("wrong");
    void input.offsetWidth; // перезапуск анимации
    input.classList.add("wrong");
  }
}

detailEl.addEventListener("input", function (e) {
  var input = e.target.closest(".seal-input");
  if (input) trySeal(input, false);
});
detailEl.addEventListener("keydown", function (e) {
  var input = e.target.closest(".seal-input");
  if (input && e.key === "Enter") {
    e.preventDefault();
    trySeal(input, true);
  }
});
detailEl.addEventListener("click", function (e) {
  var btn = e.target.closest(".seal-btn");
  if (btn) trySeal(btn.parentNode.querySelector(".seal-input"), true);
});

applyHash();
