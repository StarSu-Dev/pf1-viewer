"use strict";

var GLOSSARY = {
  БМА: "Базовый атаковый бонус — растёт с уровнями класса, применяется к броскам атаки.",
  КС: "Класс сложности — число, которое нужно выбросить на d20, чтобы преодолеть эффект.",
  СЛ: "Сложность спасброска — КС заклинания или способности; цель совершает спасбросок против него.",
  КЗ: "Кубик хитов — кость, определяющая здоровье: на каждом уровне герой получает хиты по ней.",
  d20: "Двадцатигранная кость — основной бросок игры: атака, спасброски, проверки навыков.",
  спасбросок:
    "Бросок d20 против КС: при успехе эффект ослабляется или отменяется.",
  спасброски:
    "Бросок d20 против КС: при успехе эффект ослабляется или отменяется.",
  испытание:
    "Проверка d20 + модификатор против КС (класса сложности) эффекта.",
  УС: "Уровень сложности — см. КС (класс сложности).",
};

// Перекрёстные ссылки между статьями правил: nameRu → slug.
// Имена короче 4 символов не линкуем (ложные совпадения).
function buildRuleLinks() {
  var map = {};
  window.PF1_ITEMS.forEach(function (x) {
    // текущую статью не линкуем саму на себя
    if (
      x._cat === "rules" &&
      x.slug !== state.slug &&
      x.nameRu &&
      x.nameRu.length >= 4
    )
      map[x.nameRu] = x.slug;
  });
  return map;
}

// Термин-токены (для одного прохода по тексту): термины словаря,
// названия статей правил, кости «2к6». Регистр важен — «СЛ» не поймает «слово».
// Шаблон термина словаря. «СЛ» в «если» не считается: границы — не буква
// (\\b для кириллицы не работает); аббревиатуры — только в своём регистре,
// обычные слова — с любого регистра и с окончанием.
function termPattern(t) {
  var start = "(?<![а-яёА-ЯЁa-z])",
    end = "(?![а-яёА-ЯЁa-z])";
  if (/^[A-ZА-ЯЁ0-9]{2,5}$/.test(t)) return start + t + end;
  var word = "[" + t[0] + t[0].toUpperCase() + "]" + t.slice(1);
  if (/[а-яё]/.test(t)) word += "[а-яё]*";
  return start + word + end;
}

function ruleTokens(ruleLinks) {
  var tokens = Object.keys(GLOSSARY).map(function (t) {
    return { re: t, type: "term", tip: GLOSSARY[t], raw: termPattern(t) };
  });
  Object.keys(ruleLinks).forEach(function (name) {
    tokens.push({ re: name, type: "link", slug: ruleLinks[name] });
  });
  tokens.push({
    re: "__DICE__",
    type: "dice",
    raw: "\\d+[dк]\\d+(?:\\s*[+−-]\\s*\\d+)*",
  });
  // инлайн-формулы: «(СЛ = 10 + 2 за каждый дополнительный час)»
  tokens.push({
    re: "__FORMULA__",
    type: "formula",
    raw: "(?:СЛ|КС|УС)\\s*(?:испытания|проверки|заклинания)?\\s*=\\s*[^.;)\\n]{3,80}",
  });
  // длинные термины первыми — «Действия в бою» раньше «Действия»
  // литералы — длинные первыми; формулы и кости — раньше терминов,
  // чтобы «СЛ = 10 + …» выделялось целиком, а не по слову
  tokens.sort(function (a, b) {
    return !!a.raw - !!b.raw || b.re.length - a.re.length;
  });
  return tokens;
}

// Обогащение текста: формулы (СЛ = …), кости, подсказки, ссылки.
// text уже экранирован escapeHtml() — вставленных тегов нет, безопасно.
function enrichRuleText(text, tokens) {
  var diceRe = /\d+[dк]\d+(?:\s*[+−-]\s*\d+)*/g;
  var out = "";

  // Ссылки-маркеры парсера прячем в плейсхолдеры, чтобы терминатор
  // их не разрезал, и возвращаем готовыми <a> в самом конце
  var links = [];
  text = text.replace(
    /\[\[([^|\]]+)\|([^\]]+)\]\]/g,
    function (m, href, label) {
      links.push({ href: href, label: label });
      return "\x01" + (links.length - 1) + "\x01";
    },
  );

  text.split("\n").forEach(function (line, idx, arr) {
    var nl = idx < arr.length - 1 ? "\n" : "";
    if (!line.trim()) {
      out += nl;
      return;
    }

    // Формула: строка вида «СЛ испытания = 10 + половина уровня…»
    if (
      /^(СЛ|КС|УС|Проверка|Испытание|Бонус|Штраф|Расчёт)[^\n=]{0,60}= /.test(
        line,
      )
    ) {
      out += '<span class="formula">' + line + "</span>" + nl;
      return;
    }

    // Один проход: режем по терминам/костям, оборачиваем совпадения
    var pattern = tokens
      .map(function (t) {
        if (t.raw) return t.raw;
        return t.re.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("|");
    var re = new RegExp("(" + pattern + ")", "g");
    var byRe = {};
    var rawRes = [];
    tokens.forEach(function (t) {
      if (t.raw)
        rawRes.push({ t: t, re: new RegExp("^" + t.raw + "$", "i") });
      else byRe[t.re.toLowerCase()] = t;
    });

    line.split(re).forEach(function (part) {
      var tok = byRe[part];
      if (!tok)
        rawRes.some(function (r) {
          if (r.re.test(part)) {
            tok = r.t;
            return true;
          }
        });
      if (tok && tok.type === "term") {
        out +=
          '<span class="term" tabindex="0" data-tip="' +
          escapeHtml(tok.tip) +
          '">' +
          part +
          "</span>";
      } else if (tok && tok.type === "link") {
        out +=
          '<a class="rule-link" href="#/rules/' +
          escapeHtml(tok.slug) +
          '">' +
          part +
          "</a>";
      } else if (tok && tok.type === "dice") {
        out += '<code class="dice">' + part + "</code>";
      } else if (tok && tok.type === "formula") {
        out += '<span class="formula inline">' + part + "</span>";
      } else {
        out += part;
      }
    });
    out += nl;
  });
  // Плейсхолдеры → готовые ссылки (термины/кости внутрь ссылок не попадут)
  out = out.replace(/\x01(\d+)\x01/g, function (m, i) {
    var l = links[+i];
    return l ? ruleLinkHtml(l.href, l.label) : "";
  });
  return out;
}

// Маркеры ссылок из парсера ([[/combatStatistics|«Внеочередные атаки»]])
// → <a>. Внутренние статьи правил — hash-ссылки, остальное —
// внешний путь pathfinder.family.
function ruleLinkHtml(href, label) {
  var target;
  if (href.charAt(0) === "/") {
    // Характеристики — просто текст, без ссылки
    if (/^\/ability\//.test(href)) return escapeHtml(label);
    var slug = href.slice(1).split("/")[0];
    var known = window.PF1_ITEMS.some(function (x) {
      return x._cat === "rules" && x.slug === slug;
    });
    target = known
      ? "#/rules/" + slug
      : "https://pathfinder.family" + href;
  } else {
    target = href;
  }
  var internal = target.charAt(0) === "#";
  return (
    '<a class="rule-link" href="' +
    escapeHtml(target) +
    '"' +
    (internal ? "" : ' target="_blank"') +
    ">" +
    escapeHtml(label) +
    "</a>"
  );
}

// Таблица правил: заголовки + строки, как таблицы прогрессии классов
function ruleTableHtml(t) {
  if (!t || !t.rows || !t.rows.length) return "";
  var h = '<div class="table-wrap"><table><thead><tr>';
  (t.headers || []).forEach(function (c) {
    h += "<th>" + escapeHtml(c) + "</th>";
  });
  h += "</tr></thead><tbody>";
  t.rows.forEach(function (row) {
    h += "<tr>";
    row.forEach(function (c) {
      h += '<td class="left">' + escapeHtml(c) + "</td>";
    });
    h += "</tr>";
  });
  return h + "</tbody></table></div>";
}

function renderRule(it) {
  var tokens = ruleTokens(buildRuleLinks());
  var h = '<div class="content rule">';
  h += '<span class="back-link" id="backToList">← к списку</span>';
  h +=
    "<h2>" +
    escapeHtml(it.nameRu) +
    '<span class="kind-badge">правила</span></h2>';
  if (it.url) {
    h +=
      '<div class="en-name"><a href="' +
      escapeHtml(it.url) +
      '" target="_blank">' +
      escapeHtml(it.url.replace("https://pathfinder.family", "")) +
      "</a></div>";
  }

  // Якорная ссылка раздела: data-target → id секции, hash маршрута не трогаем
  function tocLink(i, label) {
    return (
      '<a class="toc-link" data-target="sec-' +
      i +
      '" href="#/rules/' +
      escapeHtml(it.slug) +
      '">' +
      escapeHtml(label) +
      "</a>"
    );
  }

  var heads = [];
  it.sections.forEach(function (s, i) {
    s._id = "sec-" + i;
    // тип действия — только для групп (h2): у вложенных h3 («Перемещение») свой смысл
    if (s.heading) heads.push({ s: s, i: i });
  });

  // Оглавление: h2 крупнее, h3 — с отступом
  if (heads.length > 2) {
    h +=
      '<div class="rule-tools"><button type="button" class="toggle-feats" id="toggleFeats">свернуть всё</button></div>';
    h +=
      '<details class="rule-toc" id="ruleToc"' +
      (isMobile() ? "" : " open") +
      ">" +
      '<summary>Содержание<span class="toc-count">' +
      heads.length +
      '</span></summary><ol class="toc">';
    heads.forEach(function (x) {
      h +=
        '<li class="lvl' +
        (x.s.level || 3) +
        '">' +
        tocLink(x.i, x.s.heading) +
        "</li>";
    });
    h += "</ol></details>";
  }

  it.sections.forEach(function (s) {
    var body = enrichRuleText(s.text || "", tokens);
    // Таблицы в позиции источника: строка {{TABLE:n}} → таблица n секции
    var parts = body
      .split("\n")
      .filter(Boolean)
      .map(function (p) {
        var m = /^\{\{TABLE:(\d+)\}\}$/.exec(p);
        if (m) return ruleTableHtml((s.tables || [])[+m[1]]);
        return "<p>" + p + "</p>";
      })
      .join("");
    if (!s.heading) {
      // вступление статьи (контент после h1 без подзаголовка)
      h += '<div class="rule-intro">' + parts + "</div>";
      return;
    }
    h +=
      '<details class="feat" id="' +
      s._id +
      '" open><summary>' +
      escapeHtml(s.heading) +
      "</summary>" +
      parts +
      "</details>";
  });
  return h + "</div>";
}

// ── Складная панель навигации ─────────────
