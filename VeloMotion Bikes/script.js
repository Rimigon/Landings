/* =========================================================
   VeloMotion Bikes — script.js
   Vanilla JS. No build, no dependencies. Defer-loaded.
   ========================================================= */

(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt = n => n.toLocaleString('ru-RU');

  /* ---------- 1. Smooth scroll (respects reduced-motion via CSS) ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').split('?')[0];
      if (id.length < 2) return;
      const t = document.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // если у ссылки есть пресет — применяем
      const preset = a.getAttribute('href').match(/preset=(\w+)/)?.[1];
      if (preset) applyPreset(preset);
      history.replaceState(null, '', id);
    });
  });

  /* ---------- 2. Reveal on scroll (IntersectionObserver) ---------- */
  $$('.section, .card, .review, .trust__cell, .hero__title, .hero__lead, .hero__visual')
    .forEach(el => el.setAttribute('data-reveal',''));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal]').forEach(el => io.observe(el));
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }

  /* ---------- 3. Sticky mobile CTA — show after hero ---------- */
  const sticky = $('.sticky-cta');
  const hero = $('.hero');
  if (sticky && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      sticky.classList.toggle('is-visible', !entry.isIntersecting);
    }, { threshold: 0 }).observe(hero);
  }

  /* ---------- 4. Subtle parallax on hero callouts ---------- */
  const callouts = $$('.callout');
  if (callouts.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const onScroll = () => {
      const y = window.scrollY;
      callouts.forEach((c, i) => {
        c.style.transform = `translateY(${y * (0.04 + i * 0.02) * -1}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* =========================================================
     CONFIGURATOR
  ========================================================= */
  const TYPE_LABEL = { urban: 'Город', gravel: 'Гравел', mtb: 'МТБ', road: 'Шоссе' };
  const TYPE_PRICE = { urban: 0, gravel: 18000, mtb: 24000, road: 42000 };
  const FRAME_LABEL = { alu: 'Алюминий', steel: 'Сталь Reynolds', carbon: 'Карбон T1000', 'carbon-pro': 'Карбон T1100' };
  const FRAME_PRICE = { alu: 0, steel: 12000, carbon: 58000, 'carbon-pro': 96000 };
  const FRAME_KG    = { alu: 1.4, steel: 1.9, carbon: 1.1, 'carbon-pro': 1.04 };
  const DRIVE_LABEL = { claris: 'Claris 2×8', tiagra: 'Tiagra 2×10', ultegra: 'Ultegra Di2', axs: 'SRAM Rival AXS' };
  const DRIVE_PRICE = { claris: 0, tiagra: 14000, ultegra: 74000, axs: 62000 };
  const WHEELS_LABEL = { alloy: 'Алюминий', 'alloy-deep': 'Алюминий 35', 'carbon-30': 'Карбон 30', 'carbon-50': 'Карбон 50' };
  const WHEELS_PRICE = { alloy: 0, 'alloy-deep': 9000, 'carbon-30': 34000, 'carbon-50': 58000 };
  const COLOR_LABEL = {
    '#0a0a0a':'Графит','#f4f4f4':'Мел','#d63b2f':'Огонь','#1d4ed8':'Кобальт',
    '#16a34a':'Хвоя','#facc15':'Лимон','#9333ea':'Аметист','#f97316':'Ржавчина'
  };
  const BASE_PRICE = 79000;
  const BASE_WEIGHT = 9.4; // без рамы

  const steps = $$('.step');
  const panes = $$('.config__pane');
  let current = 1;

  const showStep = n => {
    current = Math.max(1, Math.min(6, n));
    steps.forEach(s => {
      const isActive = +s.dataset.step === current;
      s.classList.toggle('is-active', isActive);
      s.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    panes.forEach(p => p.classList.toggle('is-active', +p.dataset.pane === current));
  };

  steps.forEach(s => s.addEventListener('click', () => showStep(+s.dataset.step)));
  $('#prevStep')?.addEventListener('click', () => showStep(current - 1));
  $('#nextStep')?.addEventListener('click', () => {
    if (current === 6) { document.getElementById('contact').scrollIntoView({behavior:'smooth'}); return; }
    showStep(current + 1);
  });

  // ростовка
  const heightInput = $('#height');
  const heightOut   = $('#heightOut');
  const sizeOpts    = $$('#sizeOpts input');
  const frameSize   = $('#frameSize');

  const sizeFromHeight = h => {
    if (h < 162) return 'S';
    if (h < 172) return 'M';
    if (h < 184) return 'L';
    return 'XL';
  };
  const sizeLabel = { S: 'S (50)', M: 'M (52)', L: 'L (54)', XL: 'XL (56)' };

  let userPickedSize = false;
  heightInput?.addEventListener('input', e => {
    heightOut.textContent = `${e.target.value} см`;
    if (!userPickedSize) {
      const s = sizeFromHeight(+e.target.value);
      sizeOpts.forEach(o => o.checked = (o.value === s));
      frameSize.textContent = sizeLabel[s];
    }
    update();
  });
  sizeOpts.forEach(o => o.addEventListener('change', () => { userPickedSize = true; update(); }));

  // основной апдейт сборки
  const summaryFrame = $('#summaryFrame');
  const update = () => {
    const type   = $('input[name="type"]:checked')?.value || 'urban';
    const size   = $('input[name="size"]:checked')?.value || 'L';
    const frame  = $('input[name="frame"]:checked')?.value || 'alu';
    const drive  = $('input[name="drive"]:checked')?.value || 'claris';
    const wheels = $('input[name="wheels"]:checked')?.value || 'alloy';
    const color  = $('input[name="color"]:checked')?.value || '#0a0a0a';

    const price = BASE_PRICE + TYPE_PRICE[type] + FRAME_PRICE[frame] + DRIVE_PRICE[drive] + WHEELS_PRICE[wheels];
    const weight = +(BASE_WEIGHT + FRAME_KG[frame] - (wheels.startsWith('carbon') ? 0.6 : 0)).toFixed(1);

    $('#sumType').textContent   = TYPE_LABEL[type];
    $('#sumSize').textContent   = sizeLabel[size];
    $('#sumFrame').textContent  = FRAME_LABEL[frame];
    $('#sumDrive').textContent  = DRIVE_LABEL[drive];
    $('#sumWheels').textContent = WHEELS_LABEL[wheels];
    $('#sumColor').textContent  = COLOR_LABEL[color] || color;
    $('#sumWeight').textContent = `${weight.toFixed(1).replace('.', ',')} кг`;
    $('#sumPrice').textContent  = `${fmt(price)} ₽`;

    $('#summaryName').textContent =
      `${TYPE_LABEL[type]} · ${FRAME_LABEL[frame].split(' ')[0]} · ${size}`;

    if (summaryFrame) {
      summaryFrame.style.setProperty('--bike-color', color);
    }
  };

  $$('input[name="type"], input[name="frame"], input[name="drive"], input[name="wheels"], input[name="color"]')
    .forEach(i => i.addEventListener('change', update));

  // пресеты из ссылок «карточка → конфигуратор»
  function applyPreset(preset) {
    const map = {
      urban:  { type: 'urban',  frame: 'steel',      drive: 'tiagra',  wheels: 'alloy',      color: '#0a0a0a' },
      gravel: { type: 'gravel', frame: 'carbon',     drive: 'axs',     wheels: 'carbon-30',  color: '#f97316' },
      mtb:    { type: 'mtb',    frame: 'alu',        drive: 'tiagra',  wheels: 'alloy-deep', color: '#16a34a' },
      road:   { type: 'road',   frame: 'carbon-pro', drive: 'ultegra', wheels: 'carbon-50',  color: '#d63b2f' },
      ebike:  { type: 'urban',  frame: 'alu',        drive: 'tiagra',  wheels: 'alloy',      color: '#1d4ed8' }
    };
    const p = map[preset]; if (!p) return;
    Object.entries(p).forEach(([k, v]) => {
      const el = document.querySelector(`input[name="${k}"][value="${v}"]`);
      if (el) el.checked = true;
    });
    showStep(1);
    update();
  }

  // первый запуск
  update();

  /* =========================================================
     COMPARE
  ========================================================= */
  const MODELS = {
    streetline: {
      name: 'Streetline 7', cat: 'urban',
      vals: { 'Тип': 'Город', 'Рама': 'Сталь Reynolds 525', 'Вес, кг': 10.4,
        'Трансмиссия': 'Shimano Tiagra 2×10', 'Тормоза': 'Гидрав. диски',
        'Колёса': '700C алюминий', 'Цена, ₽': 89900, 'Гарантия': '2 года' }
    },
    driftcore: {
      name: 'Driftcore GR', cat: 'gravel',
      vals: { 'Тип': 'Гравел', 'Рама': 'Карбон T1000', 'Вес, кг': 8.2,
        'Трансмиссия': 'SRAM Rival AXS 12s', 'Тормоза': 'Гидрав. диски 160 мм',
        'Колёса': '700C карбон 30', 'Цена, ₽': 189000, 'Гарантия': '5 лет' }
    },
    ridge: {
      name: 'Ridge X29', cat: 'mtb',
      vals: { 'Тип': 'МТБ', 'Рама': 'Алюминий 6066', 'Вес, кг': 12.1,
        'Трансмиссия': 'Shimano Deore 1×12', 'Тормоза': 'Гидрав. диски 180 мм',
        'Колёса': '29" алюминий', 'Цена, ₽': 124500, 'Гарантия': '2 года' }
    },
    apex: {
      name: 'Apex R-Pro', cat: 'road',
      vals: { 'Тип': 'Шоссе', 'Рама': 'Карбон T1100', 'Вес, кг': 6.8,
        'Трансмиссия': 'Shimano Ultegra Di2', 'Тормоза': 'Гидрав. диски',
        'Колёса': '700C карбон 50', 'Цена, ₽': 389000, 'Гарантия': '5 лет' }
    },
    volt: {
      name: 'Volt-City E2', cat: 'urban',
      vals: { 'Тип': 'E-bike', 'Рама': 'Алюминий 6061', 'Вес, кг': 22.0,
        'Трансмиссия': 'Shimano Deore + Bosch', 'Тормоза': 'Гидрав. диски',
        'Колёса': '27.5" алюминий', 'Цена, ₽': 249000, 'Гарантия': '2 года' }
    }
  };

  const compareSelects = $$('.compare__pickers select');
  const compareTbody = $('#compareTable tbody');

  const renderCompare = () => {
    if (!compareTbody) return;
    const cols = compareSelects.map(s => MODELS[s.value]).filter(Boolean);
    const keys = Object.keys(cols[0].vals);

    // header model names
    const thead = $('#compareTable thead tr');
    thead.innerHTML = '<th scope="col">параметр</th>' +
      cols.map(m => `<th scope="col">${m.name}</th>`).join('');

    let html = '';
    keys.forEach(k => {
      const vals = cols.map(m => m.vals[k]);
      // determine "best" for numeric (вес ↓, цена ↓)
      let bestIdx = -1;
      const numeric = vals.every(v => typeof v === 'number');
      if (numeric && (k === 'Вес, кг' || k === 'Цена, ₽')) {
        const min = Math.min(...vals);
        bestIdx = vals.indexOf(min);
      }
      html += `<tr><th scope="row">${k}</th>` +
        vals.map((v, i) => {
          const formatted = (typeof v === 'number' && k === 'Цена, ₽') ? `${fmt(v)} ₽`
                          : (typeof v === 'number' && k === 'Вес, кг') ? v.toFixed(1).replace('.', ',')
                          : v;
          return `<td class="${i === bestIdx ? 'is-best' : ''}">${formatted}</td>`;
        }).join('') + '</tr>';
    });
    compareTbody.innerHTML = html;
  };

  compareSelects.forEach(s => s.addEventListener('change', renderCompare));
  renderCompare();

  /* =========================================================
     REVIEWS — GraphQL stub.
     В проде заменить fetchReviewsStub() на fetchReviews().
     Пример endpoint: POST /graphql
       query Reviews($cat: String, $limit: Int) {
         reviews(category: $cat, limit: $limit) {
           id name avatar rating model category createdAt text
         }
       }
  ========================================================= */
  async function fetchReviews(category = 'all', limit = 6) {
    const query = `
      query Reviews($cat: String, $limit: Int) {
        reviews(category: $cat, limit: $limit) {
          id name avatar rating model category createdAt text
        }
      }`;
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { cat: category === 'all' ? null : category, limit } })
    });
    const json = await res.json();
    return json.data?.reviews ?? [];
  }

  // заглушка, пока endpoint не подключён
  const REVIEWS_STUB = [
    { id:'1', name:'Никита К.',    rating:5, model:'Driftcore GR',   category:'gravel', createdAt:'2026-04-12', text:'Брал под Тверскую трассу — собрали под мой рост, посадку выставили на станке. Первая сотня — без боли в шее. Это вообще норма?'},
    { id:'2', name:'Алина С.',     rating:5, model:'Streetline 7',   category:'urban',  createdAt:'2026-04-08', text:'Сталь Reynolds — это любовь. Гасит московские бордюры, выглядит как из журнала. Цвет «огонь» — заметили все курьеры.'},
    { id:'3', name:'Илья В.',      rating:5, model:'Apex R-Pro',     category:'road',   createdAt:'2026-04-02', text:'Готовился к Гран-при «Тушино». 6.8 кг, Di2, всё по делу. Сэкономил 14 минут на круге vs мой старый Trek.'},
    { id:'4', name:'Марина Д.',    rating:4, model:'Ridge X29',      category:'mtb',    createdAt:'2026-03-28', text:'Хорошо отрабатывает корни, но я бы взяла длиннее ход вилки. Механики предупреждали — теперь понимаю про что.'},
    { id:'5', name:'Артём П.',     rating:5, model:'Volt-City E2',   category:'urban',  createdAt:'2026-03-22', text:'Каждый день 18 км из Бутово в центр. Заряда хватает на 3 дня. Сервис первого года реально включён — поменяли тормоза без вопросов.'},
    { id:'6', name:'Ольга Т.',     rating:5, model:'Driftcore GR',   category:'gravel', createdAt:'2026-03-18', text:'Тест-драйв 30 дней — не вернула. После 400 км вокруг Карелии всё ещё кажется новым. Журнал сборки положу в рамку.'},
    { id:'7', name:'Дмитрий Ш.',   rating:4, model:'Streetline 7',   category:'urban',  createdAt:'2026-03-11', text:'Ожидал чуть быстрее доставку — пришёл за 5 дней вместо обещанных 4. В остальном — пушка.'},
    { id:'8', name:'Сергей Б.',    rating:5, model:'Apex R-Pro',     category:'road',   createdAt:'2026-03-04', text:'Колёса 50 на ветру держат идеально. Подгонка посадки сэкономила мне визит к физиотерапевту.'},
    { id:'9', name:'Юлия Н.',      rating:5, model:'Ridge X29',      category:'mtb',    createdAt:'2026-02-26', text:'Девочки, не бойтесь МТБ — собрали под мои 168 см, всё лёгкое и удобное. Качусь на свидания в лес.'}
  ];

  const fetchReviewsStub = (category = 'all', limit = 6) => new Promise(r => {
    setTimeout(() => {
      const filtered = category === 'all' ? REVIEWS_STUB : REVIEWS_STUB.filter(x => x.category === category);
      r(filtered.slice(0, limit));
    }, 220);
  });

  const reviewsList = $('#reviewsList');
  const reviewsCount = $('#reviewsCount');

  const renderReviews = (items) => {
    if (!reviewsList) return;
    reviewsList.innerHTML = items.map(r => {
      const initials = r.name.split(' ').map(p => p[0]).slice(0,2).join('');
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      const date = new Date(r.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
      return `
        <article class="review">
          <div class="review__head">
            <span class="review__avatar" aria-hidden="true">${initials}</span>
            <div>
              <div class="review__name">${r.name}</div>
              <div class="review__meta">${date}</div>
            </div>
          </div>
          <div class="review__stars" aria-label="${r.rating} из 5">${stars}</div>
          <p class="review__text">${r.text}</p>
          <span class="review__model">${r.model}</span>
        </article>`;
    }).join('');
  };

  const loadReviews = async (cat = 'all') => {
    if (reviewsList) reviewsList.setAttribute('aria-busy','true');
    try {
      // в проде: const items = await fetchReviews(cat, 6);
      const items = await fetchReviewsStub(cat, 6);
      renderReviews(items);
      if (reviewsCount) reviewsCount.textContent = `· ${REVIEWS_STUB.length}+ отзывов`;
    } catch (err) {
      console.warn('reviews error', err);
      if (reviewsList) reviewsList.innerHTML = '<p style="padding:1rem">Не удалось загрузить отзывы. Попробуйте обновить страницу.</p>';
    } finally {
      if (reviewsList) reviewsList.removeAttribute('aria-busy');
    }
  };

  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.remove('is-active'));
    c.classList.add('is-active');
    loadReviews(c.dataset.filter);
  }));

  // ленивая загрузка отзывов: только когда блок в зоне видимости
  const reviewsSection = $('#reviews');
  if (reviewsSection && 'IntersectionObserver' in window) {
    const lazyIO = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { loadReviews('all'); lazyIO.disconnect(); }
    }, { rootMargin: '200px' });
    lazyIO.observe(reviewsSection);
  } else {
    loadReviews('all');
  }

  /* =========================================================
     CONTACT FORM
  ========================================================= */
  const form = $('#orderForm');
  const formHint = $('#formHint');

  const setHint = (msg, cls = '') => {
    if (!formHint) return;
    formHint.className = 'form__hint' + (cls ? ' ' + cls : '');
    formHint.textContent = msg;
  };

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name  = (fd.get('name')  || '').toString().trim();
    const phone = (fd.get('phone') || '').toString().trim();
    const agree = fd.get('agree') === 'on';

    if (name.length < 2) return setHint('Укажите имя — минимум 2 символа.', 'is-error');
    if (!/^[+0-9 ()\-]{7,20}$/.test(phone)) return setHint('Проверьте формат телефона.', 'is-error');
    if (!agree) return setHint('Без согласия не отправим — это требование закона.', 'is-error');

    setHint('Отправляем…');

    // прицепим текущую сборку, чтобы менеджер видел контекст
    const payload = {
      name, phone,
      email:   fd.get('email') || '',
      message: fd.get('message') || '',
      build: {
        type:   $('#sumType')?.textContent,
        size:   $('#sumSize')?.textContent,
        frame:  $('#sumFrame')?.textContent,
        drive:  $('#sumDrive')?.textContent,
        wheels: $('#sumWheels')?.textContent,
        color:  $('#sumColor')?.textContent,
        weight: $('#sumWeight')?.textContent,
        price:  $('#sumPrice')?.textContent
      },
      ts: new Date().toISOString()
    };

    try {
      // В проде раскомментировать:
      // const res = await fetch('/api/orders', {
      //   method: 'POST', headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      // if (!res.ok) throw new Error('bad status ' + res.status);
      await new Promise(r => setTimeout(r, 600));
      console.info('[VeloMotion] form payload', payload);
      form.reset();
      setHint('Принято. Мастер позвонит в течение 15 минут.', 'is-ok');
    } catch (err) {
      console.error(err);
      setHint('Не удалось отправить. Напишите в Telegram @velomotion.', 'is-error');
    }
  });

  /* =========================================================
     MAP — Leaflet + бесплатные растровые тайлы.
     Основной провайдер: CartoDB (basemaps.cartocdn.com) — открытая
     политика, без API-ключа, не блокирует file:// и hotlink.
     Фолбэк: OSM France (tile.openstreetmap.fr/osmfr).
     Если оба недоступны (например, оффлайн) — показываем плейсхолдер.
  ========================================================= */
  function initMap() {
    if (typeof L === 'undefined') return;
    const el = document.getElementById('map');
    if (!el) return;

    const SHOWROOMS = [
      { city: 'Москва',          addr: 'Цветной бульвар, 14',   coords: [55.7707, 37.6214], color: '#d63b2f' },
      { city: 'Санкт-Петербург', addr: 'Большая Конюшенная, 9', coords: [59.9376, 30.3253], color: '#0a0a0a' }
    ];

    const PROVIDERS = [
      {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        opts: {
          subdomains: 'abcd', maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://carto.com/attributions">CARTO</a>'
        }
      },
      {
        url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
        opts: {
          subdomains: 'abc', maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap France</a>'
        }
      }
    ];

    const map = L.map(el, {
      center: [57.85, 33.95],
      zoom: 5,
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true
    });

    let providerIdx = 0;
    let layer = null;

    const useProvider = (i) => {
      if (layer) map.removeLayer(layer);
      const p = PROVIDERS[i];
      layer = L.tileLayer(p.url, p.opts).addTo(map);
      let errors = 0;
      layer.on('tileerror', () => {
        if (++errors > 4 && i + 1 < PROVIDERS.length) {
          console.warn('[VeloMotion] tile provider blocked, switching to fallback');
          useProvider(i + 1);
        } else if (errors > 4) {
          el.classList.add('is-fallback');
        }
      });
    };
    useProvider(providerIdx);

    map.once('focus click', () => map.scrollWheelZoom.enable());

    SHOWROOMS.forEach(s => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="vm-pin">
                 <span class="vm-pin__dot" style="background:${s.color}"></span>
                 <span class="vm-pin__label">${s.city}</span>
               </div>`,
        iconSize: [80, 44],
        iconAnchor: [40, 44]
      });
      L.marker(s.coords, { icon, title: `${s.city} · ${s.addr}` })
        .addTo(map)
        .bindPopup(
          `<b>${s.city}</b>${s.addr}<small>тест-драйв 6 моделей · 10:00—21:00</small>`
        );
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e], o) => {
        if (e.isIntersecting) { setTimeout(() => map.invalidateSize(), 80); o.disconnect(); }
      }, { threshold: 0.1 }).observe(el);
    }
  }
  initMap();

  /* =========================================================
     LAZY-LOAD: на лендинге картинок нет (всё SVG inline),
     но если будут добавляться — этот хелпер уже здесь.
  ========================================================= */
  $$('img[data-src]').forEach(img => {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e], o) => {
        if (e.isIntersecting) { img.src = img.dataset.src; o.disconnect(); }
      }, { rootMargin: '200px' }).observe(img);
    } else {
      img.src = img.dataset.src;
    }
  });

})();
