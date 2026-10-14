"use strict";

// Keep the page useful without JS; only the optional ambience needs scripting.
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const toggle = document.getElementById("ambience-toggle");
const stateLabel = document.getElementById("ambience-state");
const preferenceKey = "rushia-ambience";
let preference = null;
try {
  preference = localStorage.getItem(preferenceKey);
} catch {
  // Storage can be unavailable in private or restricted browsing contexts.
}
let enabled = preference !== "off";

function updateAmbience() {
  const active = enabled && !motionPreference.matches;
  document.body.classList.toggle("effects-on", active);
  toggle.setAttribute("aria-pressed", String(active));
  stateLabel.textContent = active ? "開啟" : "關閉";
  // Honour the OS preference even if a previous visit enabled the effect.
  toggle.disabled = motionPreference.matches;
  toggle.title = motionPreference.matches
    ? "已依系統設定減少動態效果"
    : "開啟或關閉森林微光";
}

toggle.hidden = false;
toggle.addEventListener("click", () => {
  enabled = !enabled;
  try {
    localStorage.setItem(preferenceKey, enabled ? "on" : "off");
  } catch {
    // The current session still works without saving the preference.
  }
  updateAmbience();
});
motionPreference.addEventListener("change", updateAmbience);
document.addEventListener("visibilitychange", () => {
  document.body.classList.toggle("page-hidden", document.hidden);
});
document.getElementById("year").textContent = new Date().getFullYear();
updateAmbience();
