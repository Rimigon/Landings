/* QuickFix Repair — interactions
   Vanilla JS, no dependencies. Defer-loaded. */

(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- 2. Sticky CTA visibility ---------- */
  const stickyCta = document.querySelector('[data-sticky-cta]');
  const orderSection = document.getElementById('order');
  if (stickyCta && orderSection && 'IntersectionObserver' in window) {
    const heroEnd = document.querySelector('.hero');
    const showAfter = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === heroEnd)        stickyCta.classList.toggle('is-visible', !e.isIntersecting && !orderInView);
        if (e.target === orderSection)   { orderInView = e.isIntersecting; if (orderInView) stickyCta.classList.remove('is-visible'); }
      });
    }, { threshold: 0 });
    let orderInView = false;
    showAfter.observe(heroEnd);
    showAfter.observe(orderSection);
  }

  /* ---------- 3. Smooth in-page scrolling with header offset ---------- */
  const headerH = () => (document.querySelector('.topbar')?.offsetHeight || 0) + 8;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - headerH();
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ---------- 4. Hero ETA "live" feel ---------- */
  const liveId = document.querySelector('[data-live-id]');
  const etaEl  = document.querySelector('[data-eta]');
  if (etaEl && !reduced) {
    let mins = 11;
    setInterval(() => {
      mins = mins <= 6 ? 14 : mins - 1;
      etaEl.textContent = `в ${(2.3 - (14 - mins) * 0.15).toFixed(1)} км · ${mins} мин`;
    }, 4000);
  }
  if (liveId && !reduced) {
    setInterval(() => {
      const n = String(Math.floor(241 + Math.random() * 9)).padStart(3, '0');
      liveId.textContent = '008-' + n;
    }, 5200);
  }

  /* ---------- 5. Tracker — refresh + animated pin ---------- */
  const refreshBtn = document.querySelector('[data-tracker-refresh]');
  const stepsEls   = document.querySelectorAll('[data-tracker-steps] .t-step');
  const bar        = document.querySelector('[data-tracker-bar]');
  const eta        = document.querySelector('[data-tracker-eta]');
  const pin        = document.querySelector('[data-tracker-pin]');
  const map        = document.querySelector('[data-map]');

  let trackerStep = 2; // index of currently active step (0-based)
  const renderTracker = () => {
    stepsEls.forEach((el, i) => {
      el.classList.toggle('is-done',   i <  trackerStep);
      el.classList.toggle('is-active', i === trackerStep);
    });
    if (bar) bar.style.width = (((trackerStep + 1) / stepsEls.length) * 100).toFixed(1) + '%';
    if (eta) {
      const labels = ['принято', 'смета', '≈ 11 мин', 'диагностика', 'идёт ремонт', 'готово'];
      eta.textContent = labels[trackerStep] || '—';
    }
  };

  // Animated pin path (percentage points along the demo route)
  const path = [
    { x: 5,  y: 78 }, { x: 18, y: 70 }, { x: 32, y: 72 }, { x: 46, y: 60 },
    { x: 60, y: 50 }, { x: 74, y: 38 }, { x: 86, y: 26 }, { x: 95, y: 22 },
  ];
  let pinIdx = 0;
  const movePin = () => {
    if (!pin || !map) return;
    const p = path[pinIdx % path.length];
    pin.style.left = p.x + '%';
    pin.style.top  = p.y + '%';
    pinIdx++;
  };
  if (pin) {
    pin.style.left = path[0].x + '%';
    pin.style.top  = path[0].y + '%';
    if (!reduced) setInterval(movePin, 5000);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (trackerStep < stepsEls.length - 1) trackerStep++;
      renderTracker();
    });
  }

  /* ---------- 6. FAQ — close others on open ---------- */
  document.querySelectorAll('.faq__item').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) {
        document.querySelectorAll('.faq__item[open]').forEach((o) => { if (o !== d) o.open = false; });
      }
    });
  });

  /* ---------- 7. Phone mask (RU) ---------- */
  const phone = document.querySelector('input[name="phone"]');
  if (phone) {
    const format = (digits) => {
      const d = digits.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
      const p = d.padEnd(11, '_');
      const a = p.slice(1, 4), b = p.slice(4, 7), c = p.slice(7, 9), e = p.slice(9, 11);
      let out = '+7 ';
      if (d.length > 1)  out += '(' + a.replace(/_/g, '_') + ')';
      if (d.length > 4)  out += ' ' + b.replace(/_/g, '_');
      if (d.length > 7)  out += '-' + c.replace(/_/g, '_');
      if (d.length > 9)  out += '-' + e.replace(/_/g, '_');
      return d.length <= 1 ? '+7 ' : out;
    };
    phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7 '; });
    phone.addEventListener('input', () => { phone.value = format(phone.value); });
    phone.addEventListener('blur',  () => { if (phone.value.replace(/\D/g, '').length < 11) phone.value = ''; });
  }

  /* ---------- 8. Step-by-step form ---------- */
  const form     = document.querySelector('[data-form]');
  if (form) {
    const steps    = form.querySelectorAll('.form__step');
    const pills    = form.querySelectorAll('.form__pill');
    const formBar  = form.querySelector('[data-form-bar]');
    const status   = form.querySelector('#form-status');
    let cur = 0;

    const setInvalid = (el, invalid) => el.setAttribute('aria-invalid', invalid ? 'true' : 'false');

    const validateStep = (idx) => {
      const fields = steps[idx].querySelectorAll('input, textarea');
      let ok = true;
      let firstBad = null;
      // For step 1 (radios), need at least one checked
      if (idx === 0) {
        const radios = steps[idx].querySelectorAll('input[type="radio"][name="device"]');
        const checked = Array.from(radios).some((r) => r.checked);
        if (!checked) {
          ok = false;
          firstBad = radios[0];
          status.textContent = 'Выберите тип техники.';
          status.dataset.state = 'error';
        }
      } else {
        fields.forEach((f) => {
          if (f.type === 'radio') return;
          const valid = f.checkValidity();
          setInvalid(f, !valid);
          if (!valid) { ok = false; firstBad = firstBad || f; }
        });
        if (!ok) {
          status.textContent = 'Заполните выделенные поля.';
          status.dataset.state = 'error';
        }
      }
      if (firstBad) firstBad.focus();
      if (ok) { status.textContent = ''; status.dataset.state = ''; }
      return ok;
    };

    const goTo = (idx, opts = {}) => {
      cur = Math.max(0, Math.min(idx, steps.length - 1));
      steps.forEach((s, i) => s.classList.toggle('is-active', i === cur));
      pills.forEach((p, i) => {
        p.classList.toggle('is-active', i === cur);
        p.classList.toggle('is-done',   i <  cur);
      });
      if (formBar) formBar.style.width = (((cur + 1) / steps.length) * 100).toFixed(1) + '%';
      if (opts.focus) {
        const firstField = steps[cur].querySelector('input:not([type="hidden"]), textarea, button');
        if (firstField) setTimeout(() => firstField.focus({ preventScroll: true }), 50);
      }
    };

    form.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', () => {
      if (validateStep(cur)) goTo(cur + 1, { focus: true });
    }));
    form.querySelectorAll('[data-prev]').forEach((b) => b.addEventListener('click', () => goTo(cur - 1, { focus: true })));

    pills.forEach((p, i) => p.addEventListener('click', () => {
      if (i < cur) goTo(i, { focus: true });
      else if (i === cur) return;
      else { if (validateStep(cur)) goTo(i, { focus: true }); }
    }));

    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && cur < steps.length - 1 && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (validateStep(cur)) goTo(cur + 1, { focus: true });
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateStep(cur)) return;
      const data = Object.fromEntries(new FormData(form).entries());
      // Demo: in production, POST to /api/lead
      // fetch('/api/lead', { method: 'POST', body: JSON.stringify(data), headers: {'Content-Type':'application/json'} })
      status.dataset.state = 'ok';
      status.textContent = `Заявка принята. Диспетчер позвонит ${data.name || ''} в течение 5 минут.`;
      form.querySelectorAll('input, textarea, button').forEach((el) => { if (el.type !== 'button') el.disabled = true; });
    });

    goTo(0);
  }

  /* ---------- 9. Image lazy-loading attribute fallback ----------
     Native loading="lazy" is used in markup; no images yet, but the
     hook is here for future <img> elements added in production. */
  document.querySelectorAll('img:not([loading])').forEach((img) => img.setAttribute('loading', 'lazy'));

  /* ---------- 10. Render initial tracker state ---------- */
  renderTracker();
})();
