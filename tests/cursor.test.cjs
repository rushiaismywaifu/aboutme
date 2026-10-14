const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const source = readFileSync(
  require("node:path").join(__dirname, "../cursor.js"),
  "utf8",
);

function setup({ fine = true, reduced = false } = {}) {
  function target() {
    const listeners = new Map();
    return {
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(fn);
      },
      removeEventListener(type, fn) {
        listeners.get(type)?.delete(fn);
      },
      emit(type, event = {}) {
        for (const fn of listeners.get(type) || []) fn(event);
      },
      count(type) {
        return listeners.get(type)?.size || 0;
      },
    };
  }
  const frames = new Map();
  const elements = [];
  let nextFrame = 0;
  let spawns = 0;
  const animations = [];
  const body = {
    children: [],
    append(el) {
      this.children.push(el);
    },
  };
  const document = Object.assign(target(), {
    hidden: false,
    body,
    createElement() {
      const element = {
        children: [],
        style: {},
        classList: { toggle() {} },
        append(el) {
          this.children.push(el);
        },
        setAttribute() {},
        animate() {
          spawns++;
          const animation = {
            cancelled: false,
            cancel() {
              this.cancelled = true;
            },
          };
          animations.push(animation);
          return animation;
        },
      };
      elements.push(element);
      return element;
    },
  });
  const fineMedia = Object.assign(target(), { matches: fine });
  const motion = Object.assign(target(), { matches: reduced });
  const window = Object.assign(target(), {
    matchMedia(query) {
      return query.includes("reduced") ? motion : fineMedia;
    },
  });
  runInNewContext(source, {
    window,
    document,
    requestAnimationFrame(fn) {
      frames.set(++nextFrame, fn);
      return nextFrame;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
  });
  return {
    document,
    window,
    body,
    frames,
    elements,
    fineMedia,
    motion,
    animations,
    enable(active) {
      document.emit("ambiencechange", { detail: { active } });
    },
    move(x, y, pointerType = "mouse") {
      document.emit("pointermove", {
        clientX: x,
        clientY: y,
        pointerType,
        target: { closest: () => null },
      });
    },
    paint(now = 100) {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((fn) => fn(now));
    },
    spawns: () => spawns,
  };
}

test("lazy allocation, coalesced pointer events, and no idle RAF loop", () => {
  const app = setup();
  app.enable(true);
  assert.equal(app.elements.length, 0);
  for (let i = 0; i < 100; i++) app.move(i, i);
  assert.equal(app.frames.size, 1);
  app.paint();
  assert.equal(app.body.children.length, 1);
  assert.equal(app.elements.length, 12); // layer, halo, and 10 particles
  assert.equal(app.frames.size, 0);
  assert.match(app.elements[1].style.transform, /99px, 99px/);
  for (let i = 0; i < 100; i++) {
    app.move(i * 15, 100);
    app.paint(200 + i * 60);
  }
  assert.equal(app.elements.length, 12);
  assert.equal(app.animations.filter((a) => !a.cancelled).length, 10);
});

test("particle creation is gated by elapsed time and distance", () => {
  const app = setup();
  app.enable(true);
  app.move(10, 10);
  app.paint(100);
  app.move(100, 10);
  app.paint(110);
  assert.equal(app.spawns(), 1);
  app.move(12, 10);
  app.paint(200);
  assert.equal(app.spawns(), 1);
  app.move(100, 10);
  app.paint(300);
  assert.equal(app.spawns(), 2);
});

test("disabled, hidden, and reduced-motion states detach listener and cancel work", () => {
  const app = setup();
  app.enable(true);
  app.move(10, 10);
  app.paint();
  app.move(50, 50);
  app.enable(false);
  assert.equal(app.document.count("pointermove"), 0);
  assert.equal(app.frames.size, 0);
  assert.equal(app.body.children[0].hidden, true);
  assert.ok(app.animations.every((a) => a.cancelled));
  app.enable(true);
  app.document.hidden = true;
  app.document.emit("visibilitychange");
  assert.equal(app.document.count("pointermove"), 0);
  app.document.hidden = false;
  app.document.emit("visibilitychange");
  assert.equal(app.document.count("pointermove"), 1);
  app.motion.matches = true;
  app.motion.emit("change");
  assert.equal(app.document.count("pointermove"), 0);
});

test("touch-only and reduced-motion devices allocate nothing", () => {
  for (const options of [{ fine: false }, { reduced: true }]) {
    const app = setup(options);
    app.enable(true);
    app.move(10, 10);
    assert.equal(app.document.count("pointermove"), 0);
    assert.equal(app.frames.size, 0);
    assert.equal(app.elements.length, 0);
  }
});

test("hybrid touch input, keyboard navigation, pointer exit, and window blur clear effects", () => {
  const app = setup();
  app.enable(true);
  for (const stop of [
    () => app.move(0, 0, "touch"),
    () => app.document.emit("keydown", { key: "Tab" }),
    () => app.document.emit("pointerout", { relatedTarget: null }),
    () => app.window.emit("blur"),
    () => app.window.emit("scroll"),
  ]) {
    app.move(10, 10);
    app.paint();
    app.move(50, 50);
    stop();
    assert.equal(app.frames.size, 0);
    assert.equal(app.body.children[0].hidden, true);
  }
});
