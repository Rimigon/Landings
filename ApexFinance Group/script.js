/* ApexFinance Group — script.js
   Vanilla JS, без зависимостей. Подключается с defer. */

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Year + дата выпуска ---------- */
  $('#year').textContent = new Date().getFullYear();
  const d = new Date();
  $('#issueNo').textContent =
    String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');

  /* ---------- 2. Sticky header tint on scroll ---------- */
  const header = $('.site-header');
  const onScroll = () => {
    header.classList.toggle('is-stuck', window.scrollY > 4);
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    $('#readingProgress').style.width = Math.min(100, Math.max(0, pct)) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Mobile nav ---------- */
  const burger = $('.burger');
  const mobileNav = $('#mobileNav');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    if (open) { mobileNav.hidden = true; }
    else { mobileNav.hidden = false; }
  });
  mobileNav.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
      burger.setAttribute('aria-expanded', 'false');
      mobileNav.hidden = true;
    }
  });

  /* ---------- 4. Smooth scroll for in-page anchors ---------- */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', id);
  });

  /* ---------- 5. Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('[data-reveal]').forEach(el => io.observe(el));
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }

  /* ---------- 6. Hero live YTD rate (псевдо-данные) ---------- */
  const liveRate = $('#liveRate');
  if (liveRate) {
    let base = 18.4;
    const tick = () => {
      const jitter = (Math.random() - 0.5) * 0.18;
      base = Math.min(22, Math.max(15, base + jitter));
      liveRate.textContent = (base >= 0 ? '+' : '') + base.toFixed(2) + ' %';
    };
    tick();
    if (!reduceMotion) setInterval(tick, 2400);
  }

  /* ---------- 7. ROI калькулятор ---------- */
  const fmtRub = (n) => {
    const abs = Math.round(n);
    return abs.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽';
  };
  const fmtPct = n => Math.round(n) + ' %';

  const roi = {
    revenue: $('#revenue'),
    margin: $('#margin'),
    industry: $('#industry'),
    scope: () => ($$('input[name=scope]:checked')[0] || {}).value || '1.0',
    out: {
      revenue: $('#revenueOut'),
      margin: $('#marginOut'),
      base: $('#resBase'),
      low: $('#resLow'),
      high: $('#resHigh'),
      conf: $('#confTxt'),
      bar: $('#confBar')
    }
  };

  const setRangeFill = (input) => {
    const min = +input.min, max = +input.max, val = +input.value;
    const p = ((val - min) / (max - min)) * 100;
    input.style.setProperty('--p', p + '%');
  };

  const recalcROI = () => {
    const revenue = +roi.revenue.value;
    const marginPct = +roi.margin.value;
    const ind = +roi.industry.value;
    const scope = +roi.scope();

    setRangeFill(roi.revenue);
    setRangeFill(roi.margin);

    roi.out.revenue.textContent = fmtRub(revenue);
    roi.out.margin.textContent = fmtPct(marginPct);

    // Эвристика: дополнительная EBITDA ≈ выручка * margin% * uplift
    // Базовый аплифт 7%, корректируется отраслью и объёмом мандата.
    const uplift = 0.07 * ind * scope;
    const baseGain = revenue * (marginPct / 100) * uplift;
    const low = baseGain * 0.65;
    const high = baseGain * 1.45;

    roi.out.base.textContent = fmtRub(baseGain);
    roi.out.low.textContent = fmtRub(low);
    roi.out.high.textContent = fmtRub(high);

    // Уверенность: масштаб бизнеса + глубина мандата → выше уверенность
    const sizeFactor = Math.min(1, Math.log10(revenue) / 9.3);
    const conf = Math.round(45 + 35 * sizeFactor + 10 * (scope - 0.6));
    const confC = Math.min(95, Math.max(45, conf));
    roi.out.conf.textContent = confC + ' %';
    roi.out.bar.style.width = confC + '%';
  };

  ['input', 'change'].forEach(ev => {
    [roi.revenue, roi.margin, roi.industry].forEach(el => el.addEventListener(ev, recalcROI));
    $$('input[name=scope]').forEach(el => el.addEventListener(ev, recalcROI));
  });
  recalcROI();

  /* ---------- 8. CSV-экспорт расчёта ---------- */
  $('#exportRoi').addEventListener('click', () => {
    const rows = [
      ['Параметр', 'Значение'],
      ['Выручка, ₽', roi.revenue.value],
      ['Маржа EBITDA, %', roi.margin.value],
      ['Отрасль (коэф.)', roi.industry.value],
      ['Глубина мандата (коэф.)', roi.scope()],
      ['Базовая оценка прироста, ₽', roi.out.base.textContent.replace(/[^\d-]/g, '')],
      ['Консервативная оценка, ₽', roi.out.low.textContent.replace(/[^\d-]/g, '')],
      ['Оптимистичная оценка, ₽', roi.out.high.textContent.replace(/[^\d-]/g, '')],
      ['Уверенность модели, %', roi.out.conf.textContent.replace(/[^\d]/g, '')]
    ];
    const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    downloadBlob(csv, 'apexfinance-roi.csv', 'text/csv;charset=utf-8');
  });

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
  }

  /* ---------- 9. Клиентский портал — демо-вход ---------- */
  const DEMO = { email: 'cfo@demo', pass: 'apex2026' };
  const loginForm = $('#loginForm');
  const dashboard = $('#dashboard');
  const logErr = $('#logErr');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    logErr.textContent = '';
    const email = $('#logEmail').value.trim().toLowerCase();
    const pass = $('#logPass').value;
    if (!email || !pass) { logErr.textContent = 'Введите e-mail и пароль'; return; }
    if (email !== DEMO.email || pass !== DEMO.pass) {
      logErr.textContent = 'Неверные данные. Подсказка: cfo@demo / apex2026';
      return;
    }
    // имитация 2FA
    if ($('#log2fa').checked) {
      const code = prompt('Введите 6-значный 2FA код (демо: 123456)');
      if (code !== '123456') { logErr.textContent = 'Неверный 2FA-код'; return; }
    }
    sessionStorage.setItem('afg_session', '1');
    showDashboard();
  });

  function showDashboard() {
    loginForm.hidden = true;
    dashboard.hidden = false;
    dashboard.querySelector('h3 span').textContent = 'CFO Demo';
  }
  function showLogin() {
    dashboard.hidden = true;
    loginForm.hidden = false;
    sessionStorage.removeItem('afg_session');
  }
  if (sessionStorage.getItem('afg_session') === '1') showDashboard();

  $('#logoutBtn').addEventListener('click', showLogin);

  /* ---------- 10. Экспорт отчётов из портала ---------- */
  $$('[data-export]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.export;
      const map = {
        'pl-q1': { name: 'PL_Q1_2026.txt', body: 'ApexFinance Group\nP&L Q1 2026 (демо-выгрузка)\n\nВыручка: 248 400 000 ₽\nСебестоимость: 162 100 000 ₽\nEBITDA: 51 200 000 ₽\nЧистая прибыль: 36 700 000 ₽\n' },
        'cf-36': { name: 'Cashflow_36m.csv', body: '﻿Месяц;Поступления;Выплаты;Сальдо\n01-2026;28000000;21500000;6500000\n02-2026;31200000;22800000;8400000\n03-2026;29500000;24100000;5400000\n' },
        'dd-042': { name: 'DD_Deal_042.txt', body: 'Due Diligence — сделка #042\nСтатус: завершено\nКлюч. находки: 7\nПодготовлено ApexFinance Group.\n' }
      };
      const f = map[id];
      if (!f) return;
      downloadBlob(f.body, f.name, f.name.endsWith('.csv') ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8');
    });
  });

  /* ---------- 11. Lead-форма ---------- */
  const lead = $('#leadForm');
  const leadStatus = $('#leadStatus');
  lead.addEventListener('submit', e => {
    e.preventDefault();
    leadStatus.classList.remove('is-ok', 'is-err');
    let valid = true;
    $$('input, textarea', lead).forEach(el => el.removeAttribute('aria-invalid'));

    const required = $$('input[required], textarea[required]', lead);
    required.forEach(el => {
      if (!el.checkValidity()) { el.setAttribute('aria-invalid', 'true'); valid = false; }
    });
    const emailEl = lead.querySelector('input[name=email]');
    if (emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      emailEl.setAttribute('aria-invalid', 'true'); valid = false;
    }
    const consent = lead.querySelector('input[name=consent]');
    if (!consent.checked) { consent.setAttribute('aria-invalid', 'true'); valid = false; }

    if (!valid) {
      leadStatus.textContent = 'Проверьте поля, отмеченные красным.';
      leadStatus.classList.add('is-err');
      return;
    }

    leadStatus.textContent = 'Отправка…';
    setTimeout(() => {
      leadStatus.textContent = 'Готово. Партнёр свяжется в течение 60 минут в рабочее время.';
      leadStatus.classList.add('is-ok');
      lead.reset();
    }, 700);
  });

  /* ---------- 12. Lazy-load для офсайт-картинок (если будут добавлены) ---------- */
  $$('img[data-src]').forEach(img => {
    if ('loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy'; img.src = img.dataset.src;
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) { img.src = img.dataset.src; io.unobserve(img); }
        });
      });
      io.observe(img);
    }
  });

  /* ---------- 13. Карта OpenStreetMap (Leaflet) ---------- */
  const mapEl = $('#map');
  if (mapEl && window.L) {
    const coords = [55.7503, 37.5396];
    const map = L.map(mapEl, {
      center: coords,
      zoom: 16,
      attributionControl: false,
      scrollWheelZoom: false,
      zoomControl: true
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      crossOrigin: true
    }).addTo(map);

    const pin = L.divIcon({
      className: 'afg-pin-wrap',
      html: '<span class="afg-pin-halo"></span><span class="afg-pin-badge">AF</span>',
      iconSize: [48, 64],
      iconAnchor: [24, 60],
      popupAnchor: [0, -56]
    });
    L.marker(coords, { icon: pin, title: 'ApexFinance Group', riseOnHover: true })
      .addTo(map)
      .bindPopup('<b>ApexFinance Group</b><br>Пресненская наб., 12');

    map.on('click', () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());
  }

})();
