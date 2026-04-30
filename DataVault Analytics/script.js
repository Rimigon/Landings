/* DataVault Analytics — landing JS */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- year ---------- */
  const y = $('[data-year]');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- nav: shrink on scroll + active link ---------- */
  const nav = $('[data-nav]');
  const links = $$('.nav__menu a');
  const sections = links
    .map(a => $(a.getAttribute('href')))
    .filter(Boolean);

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 80);

    /* reading progress */
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (window.scrollY / max) * 100 : 0;
    const bar = $('[data-progress]');
    if (bar) bar.style.width = p + '%';

    /* float CTA */
    const float = $('[data-float]');
    if (float) float.classList.toggle('is-visible', p > 25 && p < 92);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* active section in nav */
  if ('IntersectionObserver' in window && sections.length) {
    const map = new Map(sections.map((s, i) => [s, links[i]]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('is-active'));
          const link = map.get(e.target);
          if (link) link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- mobile burger ---------- */
  const burger = $('[data-burger]');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('.nav__menu a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-in'));
  }

  /* ---------- counters ---------- */
  const animateCounter = (el) => {
    const target   = parseFloat(el.dataset.target) || 0;
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    if (reduced) {
      el.textContent = prefix + formatNum(target, decimals) + suffix;
      return;
    }
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = target * eased;
      el.textContent = prefix + formatNum(v, decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const formatNum = (n, d) => {
    if (d > 0) return n.toFixed(d).replace('.', ',');
    return Math.round(n).toLocaleString('ru-RU');
  };

  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          co.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    $$('[data-counter]').forEach(el => co.observe(el));
  } else {
    $$('[data-counter]').forEach(animateCounter);
  }

  /* ---------- demo: tabs + skeleton + content swap ---------- */
  const demoData = {
    finance: {
      kpis: [
        ['Revenue MTD', '₽4.82M', '+12.7%', 'up'],
        ['Gross margin', '68.4%', '+1.9 пп', 'up'],
        ['Burn',         '₽1.04M', '-8.1%', 'down']
      ],
      rows: [
        ['Enterprise',  '₽2 480 000', '+14.2%', 'up',   '72%'],
        ['Mid-market',  '₽1 320 000', '+9.8%',  'up',   '66%'],
        ['SMB',         '₽720 000',   '-3.1%',  'down', '58%'],
        ['Self-serve',  '₽300 000',   '+22.7%', 'up',   '81%']
      ],
      cols: ['Сегмент','Выручка','Δ к плану','Маржа']
    },
    marketing: {
      kpis: [
        ['CAC',  '₽3 240',  '-11.4%', 'up'],
        ['LTV',  '₽58 700', '+7.2%',  'up'],
        ['ROAS', '4.2×',    '+0.6×',  'up']
      ],
      rows: [
        ['Direct',           '₽1 820 000', '+18.0%', 'up',   '4.8×'],
        ['Performance',      '₽1 260 000', '+6.4%',  'up',   '3.9×'],
        ['SEO',              '₽640 000',   '+24.1%', 'up',   '6.1×'],
        ['Партнёрский',      '₽410 000',   '-2.3%',  'down', '2.7×']
      ],
      cols: ['Канал','Выручка','Δ MoM','ROAS']
    },
    ops: {
      kpis: [
        ['SLA',     '99.94%', '+0.06 пп', 'up'],
        ['NPS',     '62',     '+4',       'up'],
        ['Очередь', '12 мин', '-3 мин',   'up']
      ],
      rows: [
        ['Поддержка',  '4 230 тикетов', '-12.0%', 'up',   '98%'],
        ['Логистика',  '8 140 заказов', '+6.2%',  'up',   '99%'],
        ['Склад',      '212 SKU',       '0.0%',   'up',   '97%'],
        ['Интеграции', '14 алертов',    '-40.0%', 'up',   '100%']
      ],
      cols: ['Зона','Объём','Δ','SLA']
    },
    product: {
      kpis: [
        ['DAU',         '14 820', '+6.1%', 'up'],
        ['Retention 30d', '47.8%', '+2.1 пп', 'up'],
        ['Activation',  '63.4%',  '+4.7 пп', 'up']
      ],
      rows: [
        ['Onboarding',  'Funnel-1', '78%',   'up',   '+3.2 пп'],
        ['Aha-moment',  'Funnel-2', '54%',   'up',   '+1.8 пп'],
        ['Habit',       'Funnel-3', '38%',   'up',   '+2.6 пп'],
        ['Power user',  'Funnel-4', '12%',   'down', '-0.4 пп']
      ],
      cols: ['Этап','ID','Конверсия','Δ']
    }
  };

  const tabs = $$('.demo__tab');
  const panel = $('[data-panel]');
  const skeleton = panel ? panel.querySelector('[data-skeleton]') : null;
  const content = panel ? panel.querySelector('[data-content]') : null;

  const renderDemo = (key) => {
    const d = demoData[key];
    if (!d || !content) return;
    /* KPIs */
    const kpisEl = content.querySelector('.demo__kpis');
    kpisEl.innerHTML = d.kpis.map(([l,v,delta,dir]) => `
      <div class="kpi">
        <span class="kpi__label">${l}</span>
        <span class="kpi__value">${v}</span>
        <span class="kpi__delta kpi__delta--${dir}">${delta}</span>
      </div>`).join('');
    /* Table */
    const thead = content.querySelector('.demo__table thead tr');
    thead.innerHTML = d.cols.map(c => `<th>${c}</th>`).join('');
    const tbody = content.querySelector('[data-rows]');
    tbody.innerHTML = d.rows.map(r => {
      if (r.length === 5) return `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="${r[3]}">${r[2]}</td><td>${r[4]}</td></tr>`;
      return `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`;
    }).join('');
    /* re-trigger chart draw */
    content.querySelectorAll('[data-line],[data-line2]').forEach(p => {
      p.style.animation = 'none';
      // force reflow
      void p.getBoundingClientRect();
      p.style.animation = '';
    });
  };

  const showLoading = (cb) => {
    if (!panel) return cb();
    if (reduced) return cb();
    skeleton.hidden = false;
    content.style.opacity = '0';
    setTimeout(() => {
      cb();
      skeleton.hidden = true;
      content.style.transition = 'opacity .35s var(--ease, ease)';
      content.style.opacity = '1';
    }, 420);
  };

  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-selected','false'); });
    t.classList.add('is-active');
    t.setAttribute('aria-selected','true');
    showLoading(() => renderDemo(t.dataset.tab));
  }));

  /* ---------- integrations filter ---------- */
  const chips = $$('.chip');
  const items = $$('.int');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('is-active'));
    c.classList.add('is-active');
    const f = c.dataset.filter;
    items.forEach(i => i.classList.toggle('is-hidden', !(f === 'all' || i.dataset.cat === f)));
  }));

  /* ---------- pricing seats calculator ---------- */
  const seats = $('[data-seats]');
  const seatsOut = $('#seatsOut');
  const priceEls = $$('[data-price]');

  const updatePrice = () => {
    if (!seats || !priceEls.length) return;
    const n = parseInt(seats.value, 10);
    if (seatsOut) seatsOut.textContent = n;

    priceEls.forEach(priceEl => {
      const base = parseInt(priceEl.dataset.base, 10);
      const per  = parseInt(priceEl.dataset.per, 10);
      const incl = parseInt(priceEl.dataset.incl, 10);
      if (Number.isNaN(base) || Number.isNaN(per) || Number.isNaN(incl)) return;
      const extra = Math.max(0, n - incl);
      const total = base + extra * per;
      priceEl.textContent = total.toLocaleString('ru-RU');

      const plan = priceEl.closest('.plan');
      const extraEl = plan ? plan.querySelector('[data-extra]') : null;
      if (extraEl) {
        if (extra > 0) {
          extraEl.hidden = false;
          extraEl.textContent = `+ ${extra} × ${per.toLocaleString('ru-RU')} ₽`;
        } else {
          extraEl.hidden = true;
        }
      }
    });
  };
  if (seats) {
    seats.addEventListener('input', updatePrice);
    updatePrice();
  }

  /* ---------- form validation ---------- */
  const form = $('[data-form]');
  if (form) {
    const ok = form.querySelector('[data-ok]');
    const showErr = (name, on) => {
      const err = form.querySelector(`[data-err="${name}"]`);
      const row = err ? err.closest('.form__row') : null;
      if (err) err.hidden = !on;
      if (row) row.classList.toggle('is-invalid', on);
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      const email = form.email.value.trim();
      const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      showErr('email', !okEmail); valid = valid && okEmail;

      const okSize = form.size.value !== '';
      showErr('size', !okSize); valid = valid && okSize;

      const okAgree = form.querySelector('[data-agree]').checked;
      showErr('agree', !okAgree); valid = valid && okAgree;

      if (!valid) return;

      // TODO: подключить реальный endpoint
      // fetch('/api/lead', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, size: form.size.value})});

      if (ok) ok.hidden = false;
      form.reset();
      updatePrice();
    });
  }

  /* ---------- subtle parallax for hero panel ---------- */
  if (!reduced) {
    const panel = $('.hero__panel');
    if (panel) {
      window.addEventListener('scroll', () => {
        const r = panel.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const offset = Math.max(-30, Math.min(30, (window.innerHeight/2 - r.top - r.height/2) * 0.05));
        panel.style.transform = `translateY(${-offset}px)`;
      }, { passive: true });
    }
  }

  /* ---------- lazy load images (если будут добавлены) ---------- */
  if ('loading' in HTMLImageElement.prototype) {
    $$('img[data-src]').forEach(img => { img.src = img.dataset.src; });
  } else if ('IntersectionObserver' in window) {
    const lo = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.src = e.target.dataset.src;
          lo.unobserve(e.target);
        }
      });
    });
    $$('img[data-src]').forEach(img => lo.observe(img));
  }

  /* ---------- интерактив-карта (заглушка)
     Пример подключения Yandex Maps:
     <script src="https://api-maps.yandex.ru/2.1/?apikey=YOUR_KEY&lang=ru_RU"></script>
     ymaps.ready(() => new ymaps.Map('map', { center:[55.751244, 37.618423], zoom: 11 }));
  */

})();
