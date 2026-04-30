/* ================================================================
   LuxeAuto Rental — script.js
   Vanilla JS: SVG car silhouettes injection, header state,
   smooth scroll, reveal-on-scroll, 3D-stub configurator,
   insurance calculator, form validation, parallax, lazy media.
================================================================ */

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  document.body.classList.remove('no-js');
  document.body.classList.add('has-js');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Models live in /models/<key>.glb. CAR_DATA is consumed by the configurator. */
  const CAR_DATA = {
    maybach: { type: 'sedan', color: '#1c1d22' },
    bmw7:    { type: 'sedan', color: '#2a1f24' },
    rover:   { type: 'suv',   color: '#2a3329' },
    porsche: { type: 'sedan', color: '#26221d' },
    audi:    { type: 'sedan', color: '#16171b' },
    bentley: { type: 'suv',   color: '#0e0e10' },
  };

  /* Cards & hero now use <model-viewer> directly — no SVG injection. */
  const heroCarHost = $('.hero__mv');

  /* ---------- Header sticky shade ---------- */
  const hdr = $('[data-hdr]');
  const onScroll = () => {
    if (!hdr) return;
    hdr.classList.toggle('is-stuck', window.scrollY > 80);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $('[data-burger]');
  if (burger && hdr) {
    burger.addEventListener('click', () => {
      const open = hdr.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    hdr.querySelectorAll('.hdr__nav a').forEach(a =>
      a.addEventListener('click', () => {
        hdr.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- Smooth scroll ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ---------- Reveal-on-scroll ---------- */
  const revealEls = $$('section, .car, .proof__quotes figure, .proc__list li, .ins__step, .faq details');
  revealEls.forEach(el => el.setAttribute('data-reveal', ''));
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Hero parallax ---------- */
  if (heroCarHost && !reduceMotion) {
    let ticking = false;
    const onMove = () => {
      const y = window.scrollY;
      heroCarHost.style.transform = `translate3d(${y * -0.04}px, ${y * -0.08}px, 0)`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(onMove); ticking = true; }
    }, { passive: true });
  }

  /* ---------- Animated counters ---------- */
  const counters = $$('.proof__metrics b[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const fmt = (n, dec) => dec
      ? (n / Math.pow(10, dec)).toLocaleString('ru-RU', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      : Math.round(n).toLocaleString('ru-RU');
    const animate = (el) => {
      const target = +el.dataset.count;
      const dec = +(el.dataset.decimal || 0);
      if (reduceMotion) { el.textContent = fmt(target, dec); return; }
      const dur = 1400, t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased, dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animate(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  }

  /* ================================================================
     3D-configurator — настоящий glTF через <model-viewer>.
     Файлы: models/<key>.glb (Sketchfab CC BY / CC BY-NC-SA).
     Цвет кузова: ищем материалы с именем body/paint/karoseria
     и меняем baseColorFactor; если не нашли — берём первый материал.
  ================================================================ */
  const stage = $('[data-stage]');
  const mv = stage && stage.querySelector('[data-mv]');
  if (stage && mv) {
    const degOut = $('[data-deg]', stage);
    const loader = $('[data-loader]', stage);

    const hexToRgbLinear = (hex) => {
      const c = hex.replace('#','');
      const n = parseInt(c, 16);
      const srgb = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff].map(v => v / 255);
      const lin = srgb.map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return [lin[0], lin[1], lin[2], 1];
    };

    let bodyColor = '#0a0a0b';

    const paintBody = () => {
      const model = mv.model;
      if (!model) return;
      const linRgba = hexToRgbLinear(bodyColor);
      const re = /(body|paint|karoseria|kuzov|exterior|car_paint|carpaint|coche|coque|carro|outside|main|кузов)/i;
      const targets = [];
      model.materials.forEach(m => { if (re.test(m.name || '')) targets.push(m); });
      const list = targets.length ? targets : (model.materials[0] ? [model.materials[0]] : []);
      list.forEach(m => {
        try { m.pbrMetallicRoughness.setBaseColorFactor(linRgba); } catch (_) {}
      });
    };

    mv.addEventListener('load', () => {
      loader && loader.classList.add('is-hidden');
      paintBody();
    });
    mv.addEventListener('progress', e => {
      if (!loader) return;
      if (e.detail && e.detail.totalProgress >= 1) loader.classList.add('is-hidden');
      else loader.classList.remove('is-hidden');
    });

    /* HUD: live azimuth angle */
    if (degOut) {
      const updateDeg = () => {
        const o = mv.getCameraOrbit();
        let deg = (o.theta * 180 / Math.PI) % 360;
        if (deg < 0) deg += 360;
        degOut.textContent = String(Math.round(deg)).padStart(3, '0') + '°';
      };
      mv.addEventListener('camera-change', updateDeg);
      updateDeg();
    }

    /* Pause auto-rotate when off-screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) mv.setAttribute('auto-rotate', '');
        else mv.removeAttribute('auto-rotate');
      }, { threshold: 0.25 }).observe(stage);
    }

    /* Color chips */
    $$('.cfg__chip[data-color]').forEach(chip => {
      chip.addEventListener('click', () => {
        $$('.cfg__chip[data-color]').forEach(c => { c.classList.remove('is-on'); c.setAttribute('aria-checked','false'); });
        chip.classList.add('is-on'); chip.setAttribute('aria-checked','true');
        bodyColor = chip.dataset.color;
        paintBody();
      });
    });
    /* Model swap */
    const applyModel = (key) => {
      if (!CAR_DATA[key]) return;
      loader && loader.classList.remove('is-hidden');
      mv.setAttribute('src', `models/${key}.glb`);
    };
    const modelSelect = $('[data-cfg-model]');
    if (modelSelect) {
      modelSelect.addEventListener('change', () => applyModel(modelSelect.value));
    }

    $$('[data-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (modelSelect) {
          modelSelect.value = btn.dataset.pick;
          applyModel(btn.dataset.pick);
        }
      });
    });
  }

  /* ---------- Insurance calculator ---------- */
  const insForm = $('[data-ins]');
  if (insForm) {
    const total = $('[data-ins-total]');
    const breakdown = $('[data-ins-breakdown]');
    const daysRange = $('[data-ins-days]');
    const daysOut = $('[data-ins-days-out]');

    const fmtRub = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
    const dayWord = n => {
      const m = n % 10, h = n % 100;
      if (h >= 11 && h <= 14) return 'дней';
      if (m === 1) return 'день';
      if (m >= 2 && m <= 4) return 'дня';
      return 'дней';
    };

    const recalc = () => {
      const cover = +(insForm.querySelector('input[name="cover"]:checked')?.value || 0);
      const driverK = +(insForm.querySelector('input[name="driver"]:checked')?.value || 1);
      const days = +daysRange.value;
      const perDay = cover * driverK;
      const sum = perDay * days;
      total.textContent = fmtRub(sum);
      breakdown.textContent = `${fmtRub(perDay)}/сут × ${days} ${dayWord(days)}`;
      daysOut.textContent = `${days} ${dayWord(days)}`;
    };

    insForm.addEventListener('change', recalc);
    insForm.addEventListener('input', recalc);
    recalc();
  }

  /* ---------- Booking form ---------- */
  const form = $('[data-form]');
  if (form) {
    const msg = $('[data-msg]', form);
    const today = new Date().toISOString().slice(0,10);
    const fromInput = form.querySelector('input[name="from"]');
    const toInput = form.querySelector('input[name="to"]');
    if (fromInput) fromInput.min = today;
    if (toInput) toInput.min = today;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      msg.className = 'book__msg';
      msg.textContent = '';

      if (!form.checkValidity()) {
        msg.classList.add('is-err');
        msg.textContent = 'Проверьте, что все поля заполнены корректно.';
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const f = new FormData(form);
      if (new Date(f.get('to')) <= new Date(f.get('from'))) {
        msg.classList.add('is-err');
        msg.textContent = 'Дата возврата должна быть позже даты выдачи.';
        return;
      }

      msg.classList.add('is-ok');
      msg.textContent = 'Заявка принята. Менеджер позвонит в течение 7 минут.';
      form.reset();
    });
  }

  if ('loading' in HTMLImageElement.prototype) {
    $$('img[data-src]').forEach(img => { img.src = img.dataset.src; img.loading = 'lazy'; img.decoding = 'async'; });
  }

})();
