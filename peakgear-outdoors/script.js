(() => {
  'use strict';

  /* ---------- 1. HEADER STATE + SCROLL PROGRESS ---------- */
  const hdr = document.querySelector('[data-hdr]');
  const bar = document.getElementById('scrollbar');
  const updateScroll = () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = pct + '%';
    hdr.toggleAttribute('data-scrolled', h.scrollTop > 24);
  };
  document.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  /* ---------- 2. MOBILE NAV ---------- */
  const burger = document.querySelector('.burger');
  const mNav = document.getElementById('m-nav');
  burger?.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    mNav.hidden = open;
  });
  mNav?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      mNav.hidden = true;
    })
  );

  /* ---------- 3. SMOOTH ANCHORS (respects reduced motion) ---------- */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });

  /* ---------- 4. SCROLL-IN ANIMATIONS ---------- */
  document
    .querySelectorAll('section, .card, .g, .ugc__c, .shops__list li, .faq__list li')
    .forEach(el => el.setAttribute('data-fx', ''));
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
  );
  document.querySelectorAll('[data-fx]').forEach(el => io.observe(el));

  /* ---------- 5. HERO PHOTO PARALLAX ---------- */
  const heroImg = document.querySelector('.hero__img');
  if (heroImg && !reduced) {
    document.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY;
        if (y < 800) heroImg.style.transform = `scale(1.04) translateY(${y * 0.08}px)`;
      },
      { passive: true }
    );
  }

  /* ---------- 6. SEASON QUICK PICK -> FILTER ---------- */
  document.querySelectorAll('[data-quickseason]').forEach(b => {
    b.addEventListener('click', () => {
      const v = b.dataset.quickseason;
      const radio = document.querySelector(`input[name="season"][value="${v}"]`);
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
      document.getElementById('sezon').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- 7. FILTER OUTPUT ---------- */
  const form = document.querySelector('[data-filter]');
  const out = document.querySelector('[data-filter-out]');
  const labels = {
    season: { vesna: 'весна', leto: 'лето', osen: 'осень', zima: 'зима' },
    terrain: { ravnina: 'равнина', les: 'лес', gory: 'горы', arktika: 'арктика' },
    days: { '1': '1 день', '2-4': '2–4 дня', '5+': '5+ дней' }
  };
  const recount = () => {
    if (!form || !out) return;
    const fd = new FormData(form);
    const s = labels.season[fd.get('season')] ?? '—';
    const t = labels.terrain[fd.get('terrain')] ?? '—';
    const d = labels.days[fd.get('days')] ?? '—';
    const seed = (s + t + d).length;
    const count = 12 + (seed % 18);
    out.textContent = `Подобрано: ${count} позиций под ${s} · ${t} · ${d}`;
  };
  form?.addEventListener('change', recount);
  recount();

  /* ---------- 8. CATEGORY TABS ---------- */
  const tabs = document.querySelectorAll('.cat__tabs button');
  const cards = document.querySelectorAll('.bento [data-cat]');
  tabs.forEach(t =>
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('is-active'));
      t.classList.add('is-active');
      const c = t.dataset.cat;
      cards.forEach(card => {
        const show = c === 'all' || card.dataset.cat === c;
        card.style.display = show ? '' : 'none';
      });
    })
  );

  /* ---------- 9. LOAD MORE (placeholder) ---------- */
  document.querySelector('[data-more]')?.addEventListener('click', e => {
    e.target.disabled = true;
    e.target.textContent = 'Все позиции загружены';
  });

  /* ---------- 10. CART COUNTER (demo) ---------- */
  const cartEl = document.querySelector('[data-cart-count]');
  let cart = 0;
  document.querySelectorAll('.card:not(.card--lead)').forEach(card => {
    card.addEventListener('click', () => {
      cart++;
      cartEl.textContent = cart;
      cartEl.parentElement.setAttribute('aria-label', `Корзина: ${cart} товаров`);
      cartEl.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }],
        { duration: 240 }
      );
    });
  });

  /* ---------- 11. LEAD FORM VALIDATION ---------- */
  const lead = document.querySelector('[data-leadform]');
  lead?.addEventListener('submit', e => {
    e.preventDefault();
    const field = lead.querySelector('.field');
    const input = field.querySelector('input[type="email"]');
    const ok = lead.querySelector('[data-ok]');
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    field.classList.toggle('is-invalid', !valid);
    if (!valid) {
      input.focus();
      return;
    }
    ok.hidden = false;
    lead.querySelector('button[type="submit"]').disabled = true;
    /* TODO: replace with real submit, e.g.
       fetch('/api/lead', { method:'POST', body: new FormData(lead) }) */
  });

  /* ---------- 12. FREE MAPS (Leaflet + CARTO, без ключа) ---------- */
  const tilePrimary =
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const tileFallback = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png';

  const pin = (mod = '') =>
    L.divIcon({
      className: '',
      html: `<div class="pg-pin ${mod}"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -24]
    });

  const initLeaflet = (id, center, zoom, points) => {
    const el = document.getElementById(id);
    if (!el || typeof L === 'undefined') return;
    const map = L.map(el, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: false
    }).setView(center, zoom);
    const layer = L.tileLayer(tilePrimary, { subdomains: 'abcd', maxZoom: 19 });
    let switched = false;
    layer.on('tileerror', () => {
      if (switched) return;
      switched = true;
      map.removeLayer(layer);
      L.tileLayer(tileFallback, { maxZoom: 18 }).addTo(map);
    });
    layer.addTo(map);
    const group = L.featureGroup();
    points.forEach(p => {
      const m = L.marker(p.coords, { icon: pin(p.mod || ''), title: p.title });
      m.bindPopup(`<div class="pg-popup"><strong>${p.title}</strong>${p.sub ? p.sub : ''}</div>`);
      group.addLayer(m);
    });
    group.addTo(map);
    if (points.length > 1) map.fitBounds(group.getBounds().pad(0.25));
    el.addEventListener('click', () => map.scrollWheelZoom.enable(), { once: true });
  };

  // карта маршрутов — известные туристические локации РФ
  initLeaflet('map-routes', [60, 50], 3, [
    { coords: [67.65, 33.7], title: 'Хибины', sub: '4–6 дней · горы' },
    { coords: [43.65, 41.43], title: 'Кавказский заповедник', sub: '3–5 дней · горы' },
    { coords: [50.07, 87.42], title: 'Алтай · Мультинские озёра', sub: '5–7 дней' },
    { coords: [62.0, 33.7], title: 'Карелия · Ладога', sub: '2–4 дня' },
    { coords: [55.16, 59.94], title: 'Урал · Таганай', sub: '2–3 дня' },
    { coords: [66.5, 65.8], title: 'Полярный Урал', sub: '6–7 дней · арктика' }
  ]);

  // карта магазинов — Москва + СПб
  initLeaflet('map-shops', [57.5, 35], 5, [
    { coords: [55.7625, 37.6149], title: 'Москва · Центр', sub: '<br>Большая Дмитровка, 12' },
    { coords: [55.8484, 37.5605], title: 'Москва · Север', sub: '<br>Дмитровское ш., 73' },
    { coords: [55.6597, 37.5354], title: 'Москва · Юго-Запад', sub: '<br>Профсоюзная, 56' },
    { coords: [59.9311, 30.3609], title: 'СПб · Центр', sub: '<br>Невский, 88' },
    { coords: [59.9651, 30.3104], title: 'СПб · Петроградка', sub: '<br>Каменноостровский, 24' },
    { coords: [55.7591, 37.8589], title: 'Склад / самовывоз', sub: '<br>МО, Реутов', mod: 'pg-pin--moss' }
  ]);

  /* ---------- 13. PREVENT FLASH OF UNSTYLED CONTENT ---------- */
  document.documentElement.dataset.ready = 'true';
})();
