import imagesLoaded from "https://esm.sh/imagesloaded";

console.clear();

// ------------------ Utilities --------------------

const wrap = (n, max) => (n + max) % max;
const lerp = (a, b, t) => a + (b - a) * t;

const genId = (() => {
  let count = 0;
  return () => (count++).toString();
})();

class Raf {
  constructor() {
    this.rafId = 0;
    this.raf = this.raf.bind(this);
    this.callbacks = [];
    this.start();
  }

  start() {
    this.raf();
  }

  stop() {
    cancelAnimationFrame(this.rafId);
  }

  raf() {
    this.callbacks.forEach(({ callback, id }) => callback({ id }));
    this.rafId = requestAnimationFrame(this.raf);
  }

  add(callback, id) {
    this.callbacks.push({ callback, id: id || genId() });
  }

  remove(id) {
    this.callbacks = this.callbacks.filter((c) => c.id !== id);
  }
}

class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
  }

  lerp(v, t) {
    this.x = lerp(this.x, v.x, t);
    this.y = lerp(this.y, v.y, t);
  }
}

const vec2 = (x = 0, y = 0) => new Vec2(x, y);

export function tilt(node, options) {
  let { trigger, target } = resolveOptions(node, options);
  let lerpAmount = 0.06;

  const rotDeg = { current: vec2(), target: vec2() };
  const bgPos = { current: vec2(), target: vec2() };

  const update = (newOptions) => {
    destroy();
    ({ trigger, target } = resolveOptions(node, newOptions));
    init();
  };

  let rafId;

  function ticker({ id }) {
    rafId = id;

    rotDeg.current.lerp(rotDeg.target, lerpAmount);
    bgPos.current.lerp(bgPos.target, lerpAmount);

    for (const el of target) {
      el.style.setProperty("--rotX", rotDeg.current.y.toFixed(2) + "deg");
      el.style.setProperty("--rotY", rotDeg.current.x.toFixed(2) + "deg");
      el.style.setProperty("--bgPosX", bgPos.current.x.toFixed(2) + "%");
      el.style.setProperty("--bgPosY", bgPos.current.y.toFixed(2) + "%");
    }
  }

  const onMouseMove = ({ offsetX, offsetY }) => {
    lerpAmount = 0.1;

    for (const el of target) {
      const ox = (offsetX - el.clientWidth * 0.5) / (Math.PI * 3);
      const oy = -(offsetY - el.clientHeight * 0.5) / (Math.PI * 4);

      rotDeg.target.set(ox, oy);
      bgPos.target.set(-ox * 0.3, oy * 0.3);
    }
  };

  const onMouseLeave = () => {
    lerpAmount = 0.06;
    rotDeg.target.set(0, 0);
    bgPos.target.set(0, 0);
  };

  const addListeners = () => {
    trigger.addEventListener("mousemove", onMouseMove);
    trigger.addEventListener("mouseleave", onMouseLeave);
  };

  const removeListeners = () => {
    trigger.removeEventListener("mousemove", onMouseMove);
    trigger.removeEventListener("mouseleave", onMouseLeave);
  };

  const init = () => {
    addListeners();
    raf.add(ticker);
  };

  const destroy = () => {
    removeListeners();
    raf.remove(rafId);
  };

  init();

  return { destroy, update };
}

function resolveOptions(node, options) {
  return {
    trigger: options?.trigger ?? node,
    target: options?.target
      ? Array.isArray(options.target)
        ? options.target
        : [options.target]
      : [node],
  };
}

const raf = new Raf();

// ---------------- INIT -------------------

async function init() {
  const loader = document.querySelector(".loader");

  const slides = [...document.querySelectorAll(".slide")];

  const buttons = {
    prev: document.querySelector(".slider--btn__prev"),
    next: document.querySelector(".slider--btn__next"),
  };

  const getDogImage = async () => {
    const res = await fetch("https://dog.ceo/api/breeds/image/random");
    const data = await res.json();
    return data.message;
  };

  const imageUrls = await Promise.all([
    getDogImage(),
    getDogImage(),
    getDogImage(),
  ]);

  slides.forEach((slide, i) => {
    const img = slide.querySelector(".slide--image");
    img.src = imageUrls[i];
    img.alt = "Random dog";

    const bg = document.querySelectorAll(".slide__bg")[i];
    if (bg) {
      bg.style.setProperty("--bg", `url(${imageUrls[i]})`);
    }
  });

  loader.style.opacity = 0;
  loader.style.pointerEvents = "none";

  slides.forEach((slide) => {
    const slideInner = slide.querySelector(".slide__inner");
    tilt(slide, { target: [slideInner] });
  });

  buttons.prev.addEventListener("click", change(-1));
  buttons.next.addEventListener("click", change(1));
}

// ---------------- SETUP -------------------

function setup() {
  const loaderText = document.querySelector(".loader__text");

  const images = [...document.querySelectorAll("img")];
  const totalImages = images.length;
  let loadedImages = 0;
  let progress = { current: 0, target: 0 };

  images.forEach((image) => {
    imagesLoaded(image, (instance) => {
      if (instance.isComplete) {
        loadedImages++;
        progress.target = loadedImages / totalImages;
      }
    });
  });

  raf.add(({ id }) => {
    progress.current = lerp(progress.current, progress.target, 0.06);
    const progressPercent = Math.round(progress.current * 100);
    loaderText.textContent = `${progressPercent}%`;

    if (progressPercent === 100) {
      init();
      raf.remove(id);
    }
  });
}

// ---------------- CHANGE SLIDE -------------------

function change(direction) {
  return () => {
    let current = {
      slide: document.querySelector(".slide[data-current]"),
      slideBg: document.querySelector(".slide__bg[data-current]"),
    };
    let previous = {
      slide: document.querySelector(".slide[data-previous]"),
      slideBg: document.querySelector(".slide__bg[data-previous]"),
    };
    let next = {
      slide: document.querySelector(".slide[data-next]"),
      slideBg: document.querySelector(".slide__bg[data-next]"),
    };

    Object.values(current).forEach((el) => el.removeAttribute("data-current"));
    Object.values(previous).forEach((el) =>
      el.removeAttribute("data-previous")
    );
    Object.values(next).forEach((el) => el.removeAttribute("data-next"));

    if (direction === 1) {
      let temp = current;
      current = next;
      next = previous;
      previous = temp;

      current.slide.style.zIndex = "20";
      previous.slide.style.zIndex = "30";
      next.slide.style.zIndex = "10";
    } else if (direction === -1) {
      let temp = current;
      current = previous;
      previous = next;
      next = temp;

      current.slide.style.zIndex = "20";
      previous.slide.style.zIndex = "10";
      next.slide.style.zIndex = "30";
    }

    Object.values(current).forEach((el) => el.setAttribute("data-current", ""));
    Object.values(previous).forEach((el) =>
      el.setAttribute("data-previous", "")
    );
    Object.values(next).forEach((el) => el.setAttribute("data-next", ""));
  };
}

// Bắt đầu
setup();
