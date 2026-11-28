"use strict";

var headerEl = document.querySelector("header");
var menuBtn = document.getElementById("menuBtn");

// ── Подсказки-термины: один тултип, зажатый в экран ──
var tipEl = document.getElementById("ruleTip");
var activeTerm = null;

function hideRuleTip() {
  tipEl.style.display = "none";
  if (activeTerm) activeTerm.classList.remove("term-active");
  activeTerm = null;
}

function showRuleTip(term) {
  if (activeTerm === term) {
    hideRuleTip();
    return;
  } // повторный тап — закрыть
  if (activeTerm) activeTerm.classList.remove("term-active");
  activeTerm = term;
  term.classList.add("term-active");
  tipEl.textContent = term.dataset.tip || "";
  tipEl.style.display = "block";

  // Позиция: над термином, при нехватке места — под ним;
  // по горизонтали зажимаем в viewport с отступом 8px
  var r = term.getBoundingClientRect();
  var tw = tipEl.offsetWidth,
    th = tipEl.offsetHeight;
  var left = Math.min(Math.max(8, r.left), window.innerWidth - tw - 8);
  var top = r.top - th - 8;
  if (top < 8) top = Math.min(r.bottom + 8, window.innerHeight - th - 8);
  tipEl.style.left = left + "px";
  tipEl.style.top = top + "px";
}

function closeMenu() {
  headerEl.classList.remove("menu-open");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.textContent = "☰";
}
menuBtn.addEventListener("click", function () {
  var open = headerEl.classList.toggle("menu-open");
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.textContent = open ? "✕" : "☰";
});

// ── События ───────────────────────────────────────────────

document.querySelectorAll("nav button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    state.cat = btn.dataset.cat;
    state.slug = null;
    state.arch = "none";
    closeMenu();
    // Мобильная версия: показываем список, а не открытую карточку
    mainEl.classList.remove("show-detail");
    updateHash();
  });
});

searchEl.addEventListener("input", function () {
  state.query = searchEl.value;
  renderList();
});

listEl.addEventListener("click", function (e) {
  var item = e.target.closest(".item, .card");
  if (!item) return;
  state.slug = item.dataset.slug;
  state.arch = "none";
  closeMenu();
  if (isMobile()) mainEl.classList.add("show-detail");
  updateHash();
});

// Смена архетипа — перерисовать карточку (таблица и особенности зависят от него)
detailEl.addEventListener("change", function (e) {
  if (e.target.id !== "archSelect") return;
  state.arch = e.target.value;
  updateHash(); // hashchange перерисует карточку с выбранным архетипом
});

// Тултип терминов на десктопе: ховер; скролл закрывает (он fixed)
detailEl.addEventListener("mouseover", function (e) {
  var term = e.target.closest(".term");
  if (term) showRuleTip(term);
});
detailEl.addEventListener("mouseout", function (e) {
  if (
    e.target.closest(".term") &&
    !(e.relatedTarget && e.relatedTarget.closest(".term"))
  )
    hideRuleTip();
});
detailEl.addEventListener("scroll", hideRuleTip, { passive: true });

detailEl.addEventListener("click", function (e) {
  // Якорные ссылки оглавления: раскрыть секцию, прокрутить, подсветить
  var toc = e.target.closest(".toc-link");
  if (toc) {
    e.preventDefault();
    var target = document.getElementById(toc.dataset.target);
    if (target) {
      target.open = true;
      target.scrollIntoView({ block: "start", behavior: "smooth" });
      target.classList.add("sec-hl");
      setTimeout(function () {
        target.classList.remove("sec-hl");
      }, 1400);
    }
    return;
  }
  // Подсказки-термины: тап открывает/закрывает тултип (hover на мобильном нет)
  var term = e.target.closest(".term");
  if (term) {
    showRuleTip(term);
    return;
  }
  // Клик мимо термина закрывает подсказку
  if (activeTerm) hideRuleTip();
  if (e.target.closest("#stepsJump")) {
    document
      .getElementById("steps")
      .scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (e.target.closest("#backToList")) {
    mainEl.classList.remove("show-detail");
    return;
  }
  // Подсветка строки таблицы прогрессии: видно, на каком уровне
  // сколько заклинаний/БМА, при прокрутке
  var row = e.target.closest(".table-wrap tbody tr");
  if (row && !e.target.closest("a")) {
    var wasHl = row.classList.contains("row-hl");
    detailEl.querySelectorAll("tr.row-hl").forEach(function (r) {
      r.classList.remove("row-hl");
    });
    if (!wasHl) row.classList.add("row-hl");
    return;
  }

  var toggle = e.target.closest("#toggleFeats");
  if (toggle) {
    // По надписи кнопки, а не по «открыт ли хоть один»: иначе после
    // перехода по якорю (открыта одна секция) «развернуть всё» сворачивала
    var expand = /развернуть/.test(toggle.textContent);
    toggleAllFeats(expand);
    toggle.textContent = expand ? "свернуть всё" : "развернуть всё";
    return;
  }

  // Переключатель дробных бонусов — показывает суффиксы «,75» во всех
  // таблицах карточки, как на pathfinder.family
  var fracBtn = e.target.closest(".frac-toggle");
  if (fracBtn) {
    var show = true;
    detailEl
      .querySelectorAll(".table-wrap.show-frac")
      .forEach(function (w) {
        show = false;
      });
    detailEl.querySelectorAll(".table-wrap").forEach(function (w) {
      if (w.querySelector(".frac")) w.classList.toggle("show-frac", show);
    });
    detailEl.querySelectorAll(".frac-toggle").forEach(function (b) {
      b.textContent = show
        ? "скрыть дробные бонусы"
        : "показать дробные бонусы";
    });
  }
  // Якорные ссылки из таблицы: плавный скролл внутри #detail
  var link = e.target.closest("a.feat-link");
  if (link) {
    e.preventDefault();
    var target = document.getElementById(
      link.getAttribute("href").slice(1),
    );
    if (target) {
      target.scrollIntoView({ block: "start", behavior: "smooth" });
      target.open = true;
      // Краткая подсветка
      target.style.transition = "box-shadow 0.3s";
      target.style.boxShadow = "0 0 0 3px var(--accent-soft)";
      setTimeout(function () {
        target.style.boxShadow = "";
      }, 1200);
    }
  }
});

// ── Замазанная особенность ────────────────────────────────
// Текст показан чёрными полосами; снимается, если в поле вписана
// фраза из sealed.answer. Снятое состояние держим в памяти —
// перерисовка карточки (смена подкласса) его не сбрасывает.
