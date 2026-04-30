/* =========================================================
   LunaBeauty Clinic — vanilla JS
   ========================================================= */
(() => {
  "use strict";

  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Бургер-меню ---------- */
  const burger = $(".burger");
  const mobile = $("#mobile-menu");
  if (burger && mobile) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      mobile.hidden = open;
      document.body.style.overflow = open ? "" : "hidden";
    });
    mobile.addEventListener("click", e => {
      if (e.target.tagName === "A") {
        burger.setAttribute("aria-expanded", "false");
        mobile.hidden = true;
        document.body.style.overflow = "";
      }
    });
  }

  /* ---------- Усадка топбара при скролле ---------- */
  const topbar = $(".topbar");
  const onScroll = () => {
    if (!topbar) return;
    topbar.classList.toggle("is-shrunk", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Floating CTA — появляется после первого экрана ---------- */
  const floating = $(".floating-cta");
  const showFloating = () => {
    if (!floating) return;
    const trigger = window.innerHeight * 0.8;
    floating.classList.toggle("is-visible", window.scrollY > trigger);
  };
  window.addEventListener("scroll", showFloating, { passive: true });
  showFloating();

  /* ---------- Reveal-on-scroll через IntersectionObserver ---------- */
  const reveals = $$(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Прайс — вкладки ---------- */
  const tabs = $$(".ptab");
  const panels = $$(".ppanel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      panels.forEach((p) => {
        const isThis = p.dataset.panel === target;
        p.classList.toggle("is-active", isThis);
        p.hidden = !isThis;
      });
    });
  });

  /* ---------- Параллакс HERO кругов (легкий, на rAF) ---------- */
  const plate = $(".hero__plate");
  if (plate && !reduceMotion) {
    let raf = 0;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        plate.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove);
  }

  /* ---------- Маска телефона ---------- */
  const phoneInput = $('input[name="phone"]');
  if (phoneInput) {
    const formatPhone = (raw) => {
      let digits = raw.replace(/\D/g, "");
      if (digits.startsWith("8")) digits = "7" + digits.slice(1);
      if (!digits.startsWith("7")) digits = "7" + digits;
      digits = digits.slice(0, 11);
      const p = digits.slice(1);
      let out = "+7";
      if (p.length > 0) out += " " + p.slice(0, 3);
      if (p.length >= 4) out += " " + p.slice(3, 6);
      if (p.length >= 7) out += " " + p.slice(6, 8);
      if (p.length >= 9) out += " " + p.slice(8, 10);
      return out;
    };
    phoneInput.addEventListener("input", (e) => {
      e.target.value = formatPhone(e.target.value);
    });
    phoneInput.addEventListener("focus", (e) => {
      if (!e.target.value) e.target.value = "+7 ";
    });
  }

  /* ---------- Минимальная дата на сегодня ---------- */
  const dateInput = $('input[name="date"]');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  /* ---------- Валидация формы и отправка ---------- */
  const form = $("#bookingForm");
  const success = $(".form__success");

  const setError = (name, msg) => {
    const err = $(`[data-error="${name}"]`);
    const field = err?.closest(".field");
    if (err) err.textContent = msg || "";
    if (field) field.classList.toggle("field--invalid", Boolean(msg));
  };

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let valid = true;
      const data = new FormData(form);

      const name = (data.get("name") || "").toString().trim();
      const phone = (data.get("phone") || "").toString().trim();
      const service = (data.get("service") || "").toString().trim();
      const agree = form.querySelector('input[name="agree"]')?.checked;

      ["name","phone","service","agree"].forEach(n => setError(n, ""));

      if (name.length < 2) {
        setError("name", "Имя слишком короткое");
        valid = false;
      }
      const digits = phone.replace(/\D/g, "");
      if (digits.length !== 11) {
        setError("phone", "Введите телефон полностью");
        valid = false;
      }
      if (!service) {
        setError("service", "Выберите направление");
        valid = false;
      }
      if (!agree) {
        setError("agree", "Нужно согласие на обработку данных");
        valid = false;
      }
      if (!valid) return;

      const btn = form.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = "Отправляем…";

      // ЗАГЛУШКА: имитация запроса. Замените на реальный endpoint:
      // const res = await fetch("/api/booking", { method: "POST", body: data });
      await new Promise((r) => setTimeout(r, 900));

      btn.innerHTML = original;
      btn.disabled = false;

      form.querySelectorAll(".form__row").forEach(r => r.style.display = "none");
      btn.style.display = "none";
      form.querySelector(".form__legal").style.display = "none";
      if (success) success.hidden = false;
    });
  }

  /* ---------- Плавный скролл с компенсацией sticky-хедера ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length <= 1) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = topbar ? topbar.offsetHeight - 4 : 0;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    history.replaceState(null, "", id);
  });

  /* ---------- Lazy-load бекграунд-изображений (если будут добавлены) ----------
     Пример использования: добавьте <element data-bg="path/to.webp"> и алгоритм
     дозагрузит фон только при попадании в viewport.
  ---------------------------------------------------------------------------- */
  const bgs = $$("[data-bg]");
  if (bgs.length && "IntersectionObserver" in window) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const url = e.target.getAttribute("data-bg");
          if (url) e.target.style.backgroundImage = `url("${url}")`;
          io2.unobserve(e.target);
        }
      });
    }, { rootMargin: "200px" });
    bgs.forEach((el) => io2.observe(el));
  }

})();
