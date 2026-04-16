(() => {
  function closeDropdown(dropdown) {
    const toggle = dropdown.querySelector(".nav-dropdown-toggle");
    dropdown.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function closeAll(nav) {
    const navLinks = nav.querySelector(".nav-links");
    const navToggle = nav.querySelector(".nav-toggle");

    navLinks?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");

    nav.querySelectorAll(".nav-dropdown.open").forEach(closeDropdown);
  }

  function setupNav(nav) {
    const navToggle = nav.querySelector(".nav-toggle");
    const navLinks = nav.querySelector(".nav-links");

    navToggle?.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));

      if (!isOpen) {
        nav.querySelectorAll(".nav-dropdown.open").forEach(closeDropdown);
      }
    });

    nav.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
      const toggle = dropdown.querySelector(".nav-dropdown-toggle");
      if (!toggle) return;

      toggle.addEventListener("click", () => {
        const willOpen = !dropdown.classList.contains("open");
        nav.querySelectorAll(".nav-dropdown.open").forEach((item) => {
          if (item !== dropdown) closeDropdown(item);
        });

        dropdown.classList.toggle("open", willOpen);
        toggle.setAttribute("aria-expanded", String(willOpen));
      });
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target)) {
        closeAll(nav);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAll(nav);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        navLinks?.classList.remove("open");
        navToggle?.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".main-nav").forEach(setupNav);
  });
})();