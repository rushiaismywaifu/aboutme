const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const source = readFileSync(
  require("node:path").join(__dirname, "../main.js"),
  "utf8",
);

function setup({ stored = null, reduced = false, blocked = false } = {}) {
  const classes = new Set();
  const events = {};
  const toggle = {
    hidden: true,
    setAttribute(key, value) {
      this[key] = value;
    },
    addEventListener(key, fn) {
      events[key] = fn;
    },
  };
  const state = {};
  const media = {
    matches: reduced,
    addEventListener(key, fn) {
      events.motion = fn;
    },
  };
  const document = {
    hidden: false,
    dispatchEvent(event) {
      events.ambience = event.detail.active;
    },
    body: {
      classList: {
        toggle(name, enabled) {
          enabled ? classes.add(name) : classes.delete(name);
        },
      },
    },
    getElementById(id) {
      return id === "ambience-toggle" ? toggle : state;
    },
    addEventListener(key, fn) {
      events[key] = fn;
    },
  };
  const storage = {
    getItem() {
      if (blocked) throw Error("Unavailable");
      return stored;
    },
    setItem(key, value) {
      if (blocked) throw Error("Unavailable");
      stored = value;
    },
  };
  runInNewContext(source, {
    window: { matchMedia: () => media },
    localStorage: storage,
    document,
    Date,
    CustomEvent: class {
      constructor(type, options) {
        this.type = type;
        this.detail = options.detail;
      }
    },
  });
  return { classes, events, toggle, media, document, saved: () => stored };
}

test("ambient control works and saves the preference", () => {
  const app = setup();
  assert.equal(app.toggle.hidden, false);
  assert.equal(app.toggle["aria-pressed"], "true");
  app.events.click();
  assert.equal(app.saved(), "off");
  assert.equal(app.events.ambience, false);
  assert.equal(app.toggle["aria-pressed"], "false");
  assert.equal(app.classes.has("effects-on"), false);
  app.events.click();
  assert.equal(app.saved(), "on");
});

test("restores a saved off preference", () => {
  const app = setup({ stored: "off" });
  assert.equal(app.toggle["aria-pressed"], "false");
});

test("respects reduced motion on load and when it changes", () => {
  const app = setup({ stored: "on", reduced: true });
  assert.equal(app.toggle.disabled, true);
  assert.equal(app.toggle["aria-pressed"], "false");
  app.media.matches = false;
  app.events.motion();
  assert.equal(app.toggle.disabled, false);
  assert.equal(app.toggle["aria-pressed"], "true");
});

test("works when storage is blocked and pauses animation in hidden tabs", () => {
  const app = setup({ blocked: true });
  assert.doesNotThrow(() => app.events.click());
  assert.equal(app.toggle["aria-pressed"], "false");
  app.document.hidden = true;
  app.events.visibilitychange();
  assert.equal(app.classes.has("page-hidden"), true);
  app.document.hidden = false;
  app.events.visibilitychange();
  assert.equal(app.classes.has("page-hidden"), false);
});
