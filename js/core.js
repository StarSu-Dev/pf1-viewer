"use strict";

var mainEl = document.getElementById("main");
var listEl = document.getElementById("list");
var detailEl = document.getElementById("detail");
var searchEl = document.getElementById("search");

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
function isMobile() {
  return window.matchMedia("(max-width: 760px)").matches;
}

// Короткое описание для карточки: первая фраза поля
function shortDesc(text, maxLen) {
  if (!text) return "";
  var s = String(text).replace(/\s+/g, " ").trim();
  var dot = s.search(/[.!?](\s|$)/);
  if (dot > 0) s = s.slice(0, dot + 1);
  if (s.length > (maxLen || 140))
    s = s.slice(0, (maxLen || 140) - 1).trim() + "…";
  return s;
}
