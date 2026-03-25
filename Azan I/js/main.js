document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-ready");
  const root = document.body;
  const parallaxLayers = Array.from(document.querySelectorAll(".parallax-layer"));
  const toneSections = Array.from(document.querySelectorAll("main .section, .hero"));
  const bookLinks = Array.from(document.querySelectorAll(".book-entry__link"));
  const heroLayout = document.querySelector(".hero__layout");
  const heroSecret = document.querySelector(".hero__secret");
  const interactiveCards = Array.from(document.querySelectorAll(".interactive-card"));
  const magneticButtons = Array.from(document.querySelectorAll(".button"));
  const railDots = Array.from(document.querySelectorAll(".section-rail__dot"));
  const copyEmailButton = document.querySelector(".button--copy-email");
  const prefersReducedHover = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  const sectionIds = navLinks
    .map((link) => link.getAttribute("href"))
    .filter((href) => href && href.startsWith("#"));
  const sections = sectionIds
    .map((id) => document.querySelector(id))
    .filter(Boolean);

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const target = targetId ? document.querySelector(targetId) : null;

      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if (sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const id = `#${entry.target.id}`;
          navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === id);
          });
          railDots.forEach((dot) => {
            dot.classList.toggle("is-active", dot.getAttribute("href") === id);
          });
        });
      },
      {
        rootMargin: "-35% 0px -45% 0px",
        threshold: 0.1
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  const revealItems = Array.from(document.querySelectorAll(".reveal-on-scroll"));

  if (revealItems.length) {
    revealItems.forEach((item, itemIndex) => {
      const revealText = item.querySelectorAll(".reveal-text");
      const revealCopy = item.querySelectorAll(".reveal-copy");

      revealText.forEach((element, index) => {
        element.style.transitionDelay = `${0.08 + (itemIndex * 0.02) + (index * 0.06)}s`;
      });

      revealCopy.forEach((element, index) => {
        element.style.transitionDelay = `${0.18 + (itemIndex * 0.02) + (index * 0.08)}s`;
      });
    });

    const revealObserver = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  function updateScrollProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    root.style.setProperty("--scroll-progress", progress.toFixed(2));
    root.style.setProperty("--parallax-shift", `${window.scrollY.toFixed(2)}px`);
  }

  function updateParallax() {
    const viewportHeight = window.innerHeight;

    parallaxLayers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0);
      const rect = layer.getBoundingClientRect();
      const distanceFromCenter = rect.top + (rect.height / 2) - (viewportHeight / 2);
      const translateY = distanceFromCenter * depth * -0.14;
      layer.style.setProperty("--parallax-y", `${translateY.toFixed(2)}px`);
    });
  }

  updateScrollProgress();
  updateParallax();
  root.style.setProperty("--cursor-x", `${(window.innerWidth * 0.5).toFixed(2)}px`);
  root.style.setProperty("--cursor-y", `${(window.innerHeight * 0.3).toFixed(2)}px`);

  function resetProximityTargets() {
    if (heroLayout) {
      heroLayout.style.setProperty("--hero-pull-x", "0px");
      heroLayout.style.setProperty("--hero-pull-y", "0px");
      heroLayout.style.setProperty("--hero-scale", "1");
    }

    interactiveCards.forEach((card) => {
      card.style.setProperty("--card-pull-x", "0px");
      card.style.setProperty("--card-pull-y", "0px");
      card.style.setProperty("--card-rotate-x", "0deg");
      card.style.setProperty("--card-rotate-y", "0deg");
      card.style.setProperty("--card-lift", "0px");
      card.style.setProperty("--card-scale", "1");
    });

    if (heroSecret) {
      heroSecret.style.setProperty("--secret-presence", "0");
      heroSecret.style.setProperty("--secret-x", "50%");
      heroSecret.style.setProperty("--secret-y", "50%");
    }
  }

  function applyProximity(element, pointerX, pointerY, options) {
    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2);
    const deltaX = pointerX - centerX;
    const deltaY = pointerY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > options.radius) {
      if (options.type === "hero") {
        element.style.setProperty("--hero-pull-x", "0px");
        element.style.setProperty("--hero-pull-y", "0px");
        element.style.setProperty("--hero-scale", "1");
      } else {
        element.style.setProperty("--card-pull-x", "0px");
        element.style.setProperty("--card-pull-y", "0px");
        element.style.setProperty("--card-scale", "1");
      }

      return;
    }

    const strength = 1 - (distance / options.radius);
    const directionX = distance === 0 ? 0 : deltaX / distance;
    const directionY = distance === 0 ? 0 : deltaY / distance;
    const pullX = directionX * options.move * strength;
    const pullY = directionY * options.move * strength;
    const scale = 1 + (options.scale * strength);

    if (options.type === "hero") {
      element.style.setProperty("--hero-pull-x", `${pullX.toFixed(2)}px`);
      element.style.setProperty("--hero-pull-y", `${pullY.toFixed(2)}px`);
      element.style.setProperty("--hero-scale", scale.toFixed(4));
    } else {
      element.style.setProperty("--card-pull-x", `${pullX.toFixed(2)}px`);
      element.style.setProperty("--card-pull-y", `${pullY.toFixed(2)}px`);
      element.style.setProperty("--card-scale", scale.toFixed(4));
    }
  }

  if (!prefersReducedHover) {
    window.addEventListener("pointermove", (event) => {
      root.style.setProperty("--cursor-x", `${event.clientX}px`);
      root.style.setProperty("--cursor-y", `${event.clientY}px`);

      applyProximity(heroLayout, event.clientX, event.clientY, {
        type: "hero",
        radius: 420,
        move: 16,
        scale: 0.02
      });

      interactiveCards.forEach((card) => {
        applyProximity(card, event.clientX, event.clientY, {
          type: "card",
          radius: 240,
          move: 7,
          scale: 0.012
        });
      });

      if (heroSecret) {
        const rect = heroSecret.getBoundingClientRect();
        const insideX = event.clientX >= rect.left && event.clientX <= rect.right;
        const insideY = event.clientY >= rect.top && event.clientY <= rect.bottom;

        if (insideX && insideY) {
          const localX = ((event.clientX - rect.left) / rect.width) * 100;
          const localY = ((event.clientY - rect.top) / rect.height) * 100;
          const centerX = rect.left + (rect.width / 2);
          const centerY = rect.top + (rect.height / 2);
          const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
          const maxDistance = Math.max(rect.width, rect.height) * 0.58;
          const presence = Math.max(0.18, 1 - (distance / maxDistance));

          heroSecret.style.setProperty("--secret-x", `${localX.toFixed(2)}%`);
          heroSecret.style.setProperty("--secret-y", `${localY.toFixed(2)}%`);
          heroSecret.style.setProperty("--secret-presence", presence.toFixed(3));
        } else {
          heroSecret.style.setProperty("--secret-presence", "0");
        }
      }
    }, { passive: true });
  }

  window.addEventListener("pointerleave", resetProximityTargets);

  resetProximityTargets();

  window.addEventListener("scroll", () => {
    updateScrollProgress();
    updateParallax();
  }, { passive: true });
  window.addEventListener("resize", () => {
    updateParallax();
    root.style.setProperty("--cursor-x", `${(window.innerWidth * 0.5).toFixed(2)}px`);
    root.style.setProperty("--cursor-y", `${(window.innerHeight * 0.3).toFixed(2)}px`);
    resetProximityTargets();
  }, { passive: true });

  if (toneSections.length) {
    const toneObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

        if (!visibleEntries.length) {
          return;
        }

        const index = toneSections.indexOf(visibleEntries[0].target);
        const toneValue = Math.max(0, index) * 14;
        const grainValue = 0.03 + (Math.max(0, index) * 0.006);
        root.style.setProperty("--section-tone", toneValue.toFixed(2));
        root.style.setProperty("--grain-strength", grainValue.toFixed(3));
      },
      {
        threshold: [0.2, 0.4, 0.6, 0.8]
      }
    );

    toneSections.forEach((section) => toneObserver.observe(section));
  }

  interactiveCards.forEach((card) => {
    card.style.setProperty("--glint-x", "50%");
    card.style.setProperty("--glint-y", "50%");

    card.addEventListener("mousemove", (event) => {
      if (prefersReducedHover) {
        return;
      }

      const rect = card.getBoundingClientRect();
      const relativeX = (event.clientX - rect.left) / rect.width;
      const relativeY = (event.clientY - rect.top) / rect.height;
      const rotateY = (relativeX - 0.5) * 5.5;
      const rotateX = (0.5 - relativeY) * 5.5;

      card.style.setProperty("--card-rotate-x", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--card-rotate-y", `${rotateY.toFixed(2)}deg`);
      card.style.setProperty("--card-lift", "-1.5px");
      card.style.setProperty("--glint-x", `${(relativeX * 100).toFixed(2)}%`);
      card.style.setProperty("--glint-y", `${(relativeY * 100).toFixed(2)}%`);
    });

    function resetCard() {
      card.style.setProperty("--card-rotate-x", "0deg");
      card.style.setProperty("--card-rotate-y", "0deg");
      card.style.setProperty("--card-lift", "0px");
      card.style.setProperty("--glint-x", "50%");
      card.style.setProperty("--glint-y", "50%");
    }

    card.addEventListener("mouseleave", resetCard);
    card.addEventListener("blur", resetCard, true);
  });

  magneticButtons.forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      if (prefersReducedHover) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const relativeX = (event.clientX - rect.left) / rect.width;
      const relativeY = (event.clientY - rect.top) / rect.height;
      const offsetX = (relativeX - 0.5) * 8;
      const offsetY = (relativeY - 0.5) * 8;
      const tiltY = (relativeX - 0.5) * 10;
      const tiltX = (0.5 - relativeY) * 10;

      button.style.setProperty("--button-shift-x", `${offsetX.toFixed(2)}px`);
      button.style.setProperty("--button-shift-y", `${offsetY.toFixed(2)}px`);
      button.style.setProperty("--button-tilt-x", `${tiltX.toFixed(2)}deg`);
      button.style.setProperty("--button-tilt-y", `${tiltY.toFixed(2)}deg`);
      button.style.setProperty("--button-scale", "1.02");
    });

    function resetButton() {
      button.style.setProperty("--button-shift-x", "0px");
      button.style.setProperty("--button-shift-y", "0px");
      button.style.setProperty("--button-tilt-x", "0deg");
      button.style.setProperty("--button-tilt-y", "0deg");
      button.style.setProperty("--button-scale", "1");
    }

    button.addEventListener("mouseleave", resetButton);
    button.addEventListener("blur", resetButton, true);
  });

  if (copyEmailButton) {
    const originalLabel = copyEmailButton.textContent;

    copyEmailButton.addEventListener("click", async () => {
      const email = copyEmailButton.dataset.email;

      if (!email) {
        return;
      }

      try {
        await navigator.clipboard.writeText(email);
        copyEmailButton.textContent = "Copied";
        copyEmailButton.classList.add("is-copied");

        window.setTimeout(() => {
          copyEmailButton.textContent = originalLabel;
          copyEmailButton.classList.remove("is-copied");
        }, 1600);
      } catch {
        copyEmailButton.textContent = "Copy Failed";

        window.setTimeout(() => {
          copyEmailButton.textContent = originalLabel;
        }, 1600);
      }
    });
  }

  bookLinks.forEach((link) => {
    function triggerTransition() {
      root.classList.add("is-transitioning");
      window.setTimeout(() => {
        root.classList.remove("is-transitioning");
      }, 220);
    }

    link.addEventListener("mousedown", triggerTransition);
    link.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        triggerTransition();
      }
    });
  });

});
