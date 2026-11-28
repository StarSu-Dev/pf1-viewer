"use strict";

function renderClass(it) {
  // Индекс архетипов (краткие записи) нужен для выбора в карточке
  if (!archetypesLoaded) {
    ensureArchetypes(function () {
      if (state.slug && state.cat === it._cat) renderDetail(); // карточка ещё открыта
    });
  }
  var arch = currentArch();

  var h =
    '<div class="content' +
    (it.devilTheme ? " devil" : it.lichTheme ? " lich" : "") +
    '">';
  h += '<span class="back-link" id="backToList">← к списку</span>';
  if (it.image)
    h +=
      '<img class="class-photo" loading="lazy" decoding="async" src="' +
      escapeHtml(it.image) +
      '" alt="' +
      escapeHtml(it.nameRu) +
      '">';
  h +=
    "<h2>" +
    escapeHtml(it.nameRu) +
    (arch ? " · " + escapeHtml(arch.nameRu) : "") +
    '<span class="kind-badge">' +
    (it._cat === "classes"
      ? "класс"
      : it._cat === "prestige"
        ? "престиж"
        : "NPC") +
    "</span></h2>";
  var srcUrl = arch ? arch.originalUrl : it.originalUrl;
  h +=
    '<div class="en-name">' +
    escapeHtml(it.nameEn || "") +
    (arch && arch.nameEn ? " / " + escapeHtml(arch.nameEn) : "") +
    (it.book ? " · " + escapeHtml(it.book) : "") +
    (srcUrl
      ? ' · <a href="' + escapeHtml(srcUrl) + '" target="_blank">источник</a>'
      : "") +
    "</div>";

  h += '<dl class="meta">';
  if (it.role) h += metaRow("Роль", it.role);
  if (it.alignment) h += metaRow("Мировоззрение", it.alignment);
  if (it.hitDie) h += metaRow("КЗ", it.hitDie);
  if (it.startingWealth)
    h += metaRow("Стартовое богатство", it.startingWealth);
  if (it.skillRanks) h += metaRow("Навыки за уровень", it.skillRanks);
  h += "</dl>";

  // Выбор архетипа/подкласса — перед таблицей (и для престижей, если есть)
  if (ARCH_BY_CLASS[it.slug] && ARCH_BY_CLASS[it.slug].length) {
    h += archetypesBlock(
      it.slug,
      it._cat === "classes" ? "Архетип" : "Подкласс",
    );
  }

  if (it.classSkills && it.classSkills.length) {
    h +=
      '<h3>Классовые навыки</h3><div class="chips">' +
      it.classSkills
        .map(function (s) {
          return '<span class="chip">' + escapeHtml(s) + "</span>";
        })
        .join("") +
      "</div>";
  }

  if (it.requirements && it.requirements.length) {
    h += "<h3>Требования</h3>";
    it.requirements.forEach(function (r) {
      h +=
        '<p class="req"><b>' +
        escapeHtml(r.kind) +
        ":</b> " +
        escapeHtml(r.text) +
        "</p>";
    });
  }

  // Уровень каждой особенности класса — из таблицы прогрессии
  var featLevel = computeFeatLevels(it.features, it.progression);

  // Сначала особенности (заполняют реестр якорей), затем таблица со ссылками
  var feats = featuresBlock(it.features, arch, featLevel);

  // Индекс: уровень → якоря архетипных способностей этого уровня.
  // Уровень берём из поля level изменения; если его нет — из уровня
  // заменяемой особенности в таблице (замена приходит на том же уровне).
  var archByLvl = {};
  if (arch && arch.changes) {
    arch.changes.forEach(function (c) {
      var lvl = c.level || 0;
      if (!lvl && c.replaces && c.replaces.length) {
        c.replaces.forEach(function (r) {
          var l = featLevel[normalizeText(r)];
          if (l && (!lvl || l < lvl)) lvl = l;
        });
      }
      if (!lvl) return;
      var f = null;
      window.__featIds.forEach(function (x) {
        if (normalizeText(x.name) === normalizeText(c.name)) f = x;
      });
      if (f) (archByLvl[lvl] = archByLvl[lvl] || []).push(f);
    });
  }

  var prog = progressionTable(
    it.progression,
    it.spellCircles,
    it.extraHeader,
    archByLvl,
    it.noSaves,
  );
  if (prog) h += "<h3>Прогрессия</h3>" + prog;

  if (feats) {
    h +=
      '<div class="h3-row"><h3>Особенности</h3>' +
      '<button class="toggle-feats" id="toggleFeats">свернуть всё</button></div>';
    h += feats;
  }

  if (it.favoredBonuses && it.favoredBonuses.length) {
    h += "<h3>Предпочитаемые народы</h3>";
    it.favoredBonuses.forEach(function (f) {
      h +=
        '<p class="fav"><b>' +
        escapeHtml(f.race) +
        ":</b> " +
        escapeHtml(f.bonus) +
        "</p>";
    });
  }

  return h + "</div>";
}

// ── Главная страница для новичков ─────────
function countOf(cat) {
  return window.PF1_ITEMS.filter(function (x) {
    return x._cat === cat;
  }).length;
}

// Счётчик карточки раздела: пока данные не загружены — «…»
function countSpan(cat, suffix) {
  var n = countOf(cat);
  return (
    '<span class="count" data-cat="' +
    cat +
    '" data-suffix="' +
    suffix +
    '">' +
    (n > 0 ? n + " " + suffix : "…") +
    "</span>"
  );
}

// Обновляет счётчики на главной после ленивой загрузки раздела
function updateHomeCounts() {
  document
    .querySelectorAll(".home-card .count[data-cat]")
    .forEach(function (el) {
      var n = countOf(el.dataset.cat);
      if (n > 0) el.textContent = n + " " + el.dataset.suffix;
    });
}

function renderHome() {
  var h = '<div class="content home">';
  h +=
    '<div class="hero">' +
    "<h2>Добро пожаловать в Pathfinder!</h2>" +
    '<p class="lead">Справочник по настольной ролевой игре Pathfinder 1e — на русском языке.</p>' +
    "<p>Ничего не знаете о Pathfinder? Это нормально. Выберите раздел ниже или узнайте, с чего начать.</p>" +
    '<p style="margin-top:16px"><a class="cta" href="#/classes">Выбрать класс</a> ' +
    '<button class="cta ghost" id="stepsJump">С чего начать ↓</button></p>' +
    "</div>";

  h +=
    '<div class="home-cards">' +
    '<a class="home-card" href="#/classes"><span class="ico">⚔️</span><b>Классы</b>' +
    '<span class="desc">Кто ваш герой: воин, волшебник, жрец… Начните выбор персонажа здесь.</span>' +
    countSpan("classes", "классов") +
    "</a>" +
    '<a class="home-card" href="#/prestige"><span class="ico">🌟</span><b>Престиж-классы</b>' +
    '<span class="desc">Продвинутые пути для опытных героев. Пригодятся позже, на высоких уровнях.</span>' +
    countSpan("prestige", "шт.") +
    "</a>" +
    '<a class="home-card" href="#/npc"><span class="ico">🎭</span><b>NPC-классы</b>' +
    '<span class="desc">Простые классы для не-игровых персонажей: ремесленники, аристократы, простолюдины.</span>' +
    countSpan("npc", "шт.") +
    "</a>" +
    '<a class="home-card" href="#/races"><span class="ico">🧝</span><b>Расы</b>' +
    '<span class="desc">Кем вы родились: человек, эльф, дварф… Народ даёт особенности и отвечает за происхождение героя.</span>' +
    countSpan("races", "народов") +
    "</a>" +
    '<a class="home-card" href="#/traits"><span class="ico">✨</span><b>Штрихи</b>' +
    '<span class="desc">Мелкие особенности из прошлого героя. Пара штук — и персонаж живее.</span>' +
    countSpan("traits", "шт.") +
    "</a>" +
    '<a class="home-card" href="#/skills"><span class="ico">🎯</span><b>Навыки</b>' +
    '<span class="desc">Что герой умеет: взлом, дипломатия, скрытность. И у каких классов это получается лучше.</span>' +
    countSpan("skills", "шт.") +
    "</a>" +
    '<a class="home-card" href="#/rules"><span class="ico">📖</span><b>Правила</b>' +
    '<span class="desc">Основы игры: создание персонажа, бой, перемещение, состояния. Новый в Pathfinder — начните отсюда.</span>' +
    countSpan("rules", "статей") +
    "</a>" +
    "</div>";

  h +=
    '<h3 id="steps">С чего начать</h3><ol class="steps">' +
    "<li><b>Поймите идею.</b> Pathfinder — это совместное рассказывание истории: один игрок (мастер) описывает мир и испытания, остальные — действуют от лица своих героев. Побеждает не «выигравший», а получившаяся история.</li>" +
    '<li><b>Выберите класс.</b> Класс — это профессия героя, он определяет, чем герой силён в бою и вне его. Новичкам проще всего начать с <a href="#/classes/fighter">воина</a> или <a href="#/classes/rogue">плута</a>: у них понятные механики.</li>' +
    "<li><b>Не бойтесь терминов.</b> В карточках классов встречаются «БМА», «КЗ», «спасброски» — наведите курсор или просто читайте описания особенностей, всё объясняется по ходу.</li>" +
    "<li><b>Архетипы — потом.</b> Это «надстройки» над классом, меняющие его особенности. Разберитесь с базовым классом, затем попробуйте переключатель архетипа прямо в карточке.</li>" +
    "</ol>";

  h += "<h3>Частые вопросы</h3>";
  h +=
    '<details class="feat faq"><summary>Что такое «класс»?</summary><p>Шаблон героя: какие у него боевые бонусы, заклинания и особые умения, и как они растут с уровнями (с 1-го по 20-й). Например, волшебник слаб телом, но метает мощные заклинания, а варвар — сносит всё в ближнем бою.</p></details>';
  h +=
    '<details class="feat faq"><summary>Нужно ли что-то покупать или устанавливать?</summary><p>Нет. Этот сайт — просто справочник. Для игры нужны друзья, лист бумаги (или виртуальный стол) и правила — мастер обычно знает, что нужно.</p></details>';
  h +=
    '<details class="feat faq"><summary>Как пользоваться карточкой класса?</summary><p>Сверху — краткие сведения (роль, мировоззрение, кубик здоровья). Дальше — таблица прогрессии: что герой получает на каждом уровне. Каждая особенность — раскрывающаяся карточка с понятным описанием; термины в таблице — ссылки, прыжок прямо к объяснению.</p></details>';
  h +=
    '<details class="feat faq"><summary>Что значит «престиж-класс»?</summary><p>Особый путь, в который герой вступает не с 1-го уровня, а выполнив требования — например, научившись колдовству или вступив в орден. Смотрите раздел «Престижи», когда освоитесь.</p></details>';

  h +=
    '<p style="text-align:center;margin-top:34px"><a class="cta" href="#/classes">Открыть классы →</a></p>';
  return h + "</div>";
}

function renderDetail() {
  hideRuleTip();
  window.__featIds = [];
  window.__changedMap = {};
  if (state.cat === "home") {
    detailEl.innerHTML = renderHome();
    detailEl.scrollTop = 0;
    // Счётчики на карточках разделов — после догрузки списков
    DATA_CATS.forEach(function (cat) {
      ensureList(cat);
    });
    return;
  }
  if (!loadedCats[state.cat]) {
    detailEl.innerHTML = '<div class="empty">Загрузка данных…</div>';
    return;
  }
  var it = window.PF1_ITEMS.filter(function (x) {
    return x.slug === state.slug && x._cat === state.cat;
  })[0];
  // В списке лежит краткая запись — грузим полный файл и перерисовываем
  if (it && it._partial) {
    detailEl.innerHTML = '<div class="empty">Загрузка данных…</div>';
    ensureEntry(state.cat, state.slug, renderDetail);
    return;
  }
  // Выбранный архетип должен быть загружен целиком: его особенности
  // подмешиваются в карточку класса. Несуществующий архетип в URL —
  // редирект на карточку класса без него
  if (
    it &&
    (state.cat === "classes" || state.cat === "prestige") &&
    state.arch !== "none"
  ) {
    if (!archetypesLoaded) {
      ensureArchetypes(renderDetail);
      return;
    }
    if (!currentArch()) {
      location.replace("#/" + state.cat + "/" + state.slug);
      return;
    }
    if (!window.PF1_FULL["archetypes/" + state.arch]) {
      detailEl.innerHTML = '<div class="empty">Загрузка данных…</div>';
      ensureArchEntry(state.arch, renderDetail);
      return;
    }
  }
  if (!it) {
    detailEl.innerHTML =
      '<div class="empty">' +
      (state.cat === "traits"
        ? "Выберите штрих слева"
        : state.cat === "skills"
          ? "Выберите навык слева"
          : state.cat === "races"
            ? "Выберите народ слева"
            : state.cat === "rules"
              ? "Выберите статью правил слева"
              : "Выберите класс слева") +
      "</div>";
    return;
  }
  if (state.cat === "traits") detailEl.innerHTML = renderTrait(it);
  else if (state.cat === "skills") detailEl.innerHTML = renderSkill(it);
  else if (state.cat === "races") detailEl.innerHTML = renderRace(it);
  else if (state.cat === "rules") detailEl.innerHTML = renderRule(it);
  else detailEl.innerHTML = renderClass(it);
  detailEl.scrollTop = 0;
}

// ── Штрихи характера (traits) ─────────────
