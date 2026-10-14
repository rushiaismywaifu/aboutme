"use strict";

// Decorative only: never replace the native pointer or intercept interactions.
(() => {
  const finePointer = window.matchMedia(
    "(any-hover: hover) and (any-pointer: fine)",
  );
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const MAX_PARTICLES = 10;
  const PARTICLE_INTERVAL = 55;
  const PARTICLE_DISTANCE = 10;
  let enabled = false;
  let listening = false;
  let layer;
  let halo;
  let particles = [];
  let nextParticle = 0;
  let frame = 0;
  let position = null;
  let lastParticle = null;
  let lastSpawn = -Infinity;

  function createLayer() {
    if (layer) return;
    layer = document.createElement("div");
    layer.className = "pointer-effects";
    layer.setAttribute("aria-hidden", "true");
    halo = document.createElement("span");
    halo.className = "pointer-halo";
    layer.append(halo);
    // Fixed-size pool: no DOM creation/removal while moving the pointer.
    particles = Array.from({ length: MAX_PARTICLES }, () => {
      const element = document.createElement("span");
      element.className = "pointer-particle";
      layer.append(element);
      return { element, animation: null };
    });
    document.body.append(layer);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    position = null;
    lastParticle = null;
    lastSpawn = -Infinity;
    if (layer) layer.hidden = true;
    for (const particle of particles) particle.animation?.cancel();
  }

  function draw(now) {
    frame = 0;
    if (!position) return;
    const { x, y, interactive } = position;
    createLayer();
    layer.hidden = false;
    halo.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    halo.classList.toggle("is-interactive", interactive);

    const distance = lastParticle
      ? Math.hypot(x - lastParticle.x, y - lastParticle.y)
      : Infinity;
    if (now - lastSpawn < PARTICLE_INTERVAL || distance < PARTICLE_DISTANCE) {
      return;
    }
    const particle = particles[nextParticle];
    nextParticle = (nextParticle + 1) % MAX_PARTICLES;
    particle.animation?.cancel();
    // Only transform and opacity animate; no full-screen canvas or JS tick loop.
    if (typeof particle.element.animate === "function") {
      particle.animation = particle.element.animate(
        [
          {
            transform: `translate3d(${x}px, ${y}px, 0) scale(1)`,
            opacity: 0.65,
          },
          {
            transform: `translate3d(${x + (Math.random() - 0.5) * 18}px, ${y - 16}px, 0) scale(0.2)`,
            opacity: 0,
          },
        ],
        { duration: 500, easing: "ease-out" },
      );
    }
    lastParticle = { x, y };
    lastSpawn = now;
    // Deliberately no next requestAnimationFrame: idle means zero JS frames.
  }

  function move(event) {
    if (event.pointerType !== "mouse") {
      stop();
      return;
    }
    position = {
      x: event.clientX,
      y: event.clientY,
      interactive: !!event.target.closest?.(
        "a, button, input, select, textarea",
      ),
    };
    // Coalesce all hardware events arriving before the next paint into one update.
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function sync() {
    const active =
      enabled &&
      finePointer.matches &&
      !reducedMotion.matches &&
      !document.hidden;
    if (active === listening) return;
    listening = active;
    if (active) {
      document.addEventListener("pointermove", move, { passive: true });
    } else {
      document.removeEventListener("pointermove", move);
      stop();
    }
  }

  document.addEventListener("ambiencechange", (event) => {
    enabled = event.detail.active;
    sync();
  });
  finePointer.addEventListener("change", sync);
  reducedMotion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) stop();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") stop();
  });
  window.addEventListener("blur", stop);
  window.addEventListener("scroll", stop, { passive: true });
})();
