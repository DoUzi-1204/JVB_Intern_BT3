import $ from "https://esm.sh/jquery";
import gsap from "https://esm.sh/gsap";

let xPos = 0;

// Gọi API Dog CEO để lấy N ảnh
async function fetchDogImages(count) {
  const urls = [];
  for (let i = 0; i < count; i++) {
    const res = await fetch("https://dog.ceo/api/breeds/image/random");
    const data = await res.json();
    urls.push(data.message);
  }
  return urls;
}

function getBgPos(i) {
  return (
    100 -
    (gsap.utils.wrap(
      0,
      360,
      gsap.getProperty(".ring", "rotationY") - 180 - i * 36
    ) /
      360) *
      500 +
    "px 0px"
  );
}

// Main
(async function init() {
  const images = await fetchDogImages(10);

  // Apply background images via GSAP
  gsap
    .timeline()
    .set(".ring", { rotationY: 180, cursor: "grab" })
    .set(".img", {
      rotateY: (i) => i * -36,
      transformOrigin: "50% 50% 500px",
      z: -500,
      backgroundImage: (i) => `url(${images[i]})`,
      backgroundPosition: (i) => getBgPos(i),
      backfaceVisibility: "hidden",
    })
    .from(".img", {
      duration: 1.5,
      y: 200,
      opacity: 0,
      stagger: 0.1,
      ease: "expo",
    })
    .add(() => {
      $(".img").on("mouseenter", (e) => {
        const current = e.currentTarget;
        gsap.to(".img", {
          opacity: (i, t) => (t === current ? 1 : 0.5),
          ease: "power3",
        });
      });

      $(".img").on("mouseleave", () => {
        gsap.to(".img", { opacity: 1, ease: "power2.inOut" });
      });
    }, "-=0.5");

  // Mouse events
  $(window).on("mousedown touchstart", dragStart);
  $(window).on("mouseup touchend", dragEnd);
})();

function dragStart(e) {
  if (e.touches) e.clientX = e.touches[0].clientX;
  xPos = Math.round(e.clientX);
  gsap.set(".ring", { cursor: "grabbing" });
  $(window).on("mousemove touchmove", drag);
}

function drag(e) {
  if (e.touches) e.clientX = e.touches[0].clientX;
  gsap.to(".ring", {
    rotationY: "-=" + ((Math.round(e.clientX) - xPos) % 360),
    onUpdate: () => {
      gsap.set(".img", { backgroundPosition: (i) => getBgPos(i) });
    },
  });
  xPos = Math.round(e.clientX);
}

function dragEnd() {
  $(window).off("mousemove touchmove", drag);
  gsap.set(".ring", { cursor: "grab" });
}
