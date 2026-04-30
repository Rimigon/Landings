(() => {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('js');
  window.addEventListener('load', () => {
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
  });

  const nav = document.getElementById('nav');
  const sticky = document.querySelector('.sticky-cta');
  const progressBar = document.getElementById('progressBar');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 60);
    sticky.classList.toggle('is-show', y > window.innerHeight * 0.7);
    const h = document.documentElement;
    const pct = (y / (h.scrollHeight - h.clientHeight)) * 100;
    progressBar.style.width = pct + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  if (!reduceMotion) {
    const rows = document.querySelectorAll('.t-row');
    const hero = document.querySelector('.hero');
    let raf;
    const onMove = e => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        rows.forEach((r, i) => {
          const k = (i + 1) * 6;
          r.style.transform = `translate3d(${x * k}px, ${y * (k * 0.5)}px, 0)`;
        });
      });
    };
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', () => rows.forEach(r => r.style.transform = ''));
  }

  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('is-in'));

  const sceneMap = {
    lobby:   'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1600&q=70&auto=format',
    suite:   'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1600&q=70&auto=format',
    spa:     'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=70&auto=format',
    rooftop: 'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=1600&q=70&auto=format'
  };
  const tabs = document.querySelectorAll('.tour__tabs button');
  const tourImg = document.getElementById('tourImg');
  const tourFrame = document.getElementById('tourFrame');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-selected','false'); });
      t.classList.add('is-active'); t.setAttribute('aria-selected','true');
      const scene = t.dataset.scene;
      tourFrame.dataset.scene = scene;
      if (sceneMap[scene]) {
        tourImg.style.opacity = 0;
        const next = new Image();
        next.onload = () => { tourImg.src = next.src; tourImg.style.opacity = 1; };
        next.src = sceneMap[scene];
      }
    });
  });
  tourImg.style.transition = 'opacity .35s ease';
  document.getElementById('tourPlay').addEventListener('click', () => {
    alert('Здесь подключается реальный 360°-плеер (Kuula / Marzipano / Matterport). Сцена: ' + tourFrame.dataset.scene);
  });

  const rates = { EUR: 1, USD: 1.08, AED: 3.97, GBP: 0.85, RUB: 96 };
  const symbols = { EUR: '€', USD: '$', AED: 'د.إ', GBP: '£', RUB: '₽' };
  const form = document.getElementById('bookingForm');
  const totalEl = document.getElementById('bkTotal');
  const metaEl = document.getElementById('bkMeta');
  const fmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

  const recalc = () => {
    const hotel = form.hotel.value;
    const cur = form.currency.value;
    const ci = form.checkin.value;
    const co = form.checkout.value;
    const guests = parseInt(form.guests.value, 10) || 1;
    if (!hotel || !ci || !co) {
      totalEl.textContent = '—';
      metaEl.textContent = 'Выберите отель и даты для расчёта';
      return;
    }
    const nights = Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));
    if (nights < 1 || isNaN(nights)) {
      totalEl.textContent = '—';
      metaEl.textContent = 'Дата выезда должна быть позже заезда';
      return;
    }
    const opt = form.hotel.selectedOptions[0];
    const baseEur = parseFloat(opt.dataset.rate) || 0;
    const guestK = 1 + Math.max(0, guests - 2) * 0.18;
    const totalEur = baseEur * nights * guestK;
    const promo = form.promo.value.trim().toUpperCase();
    const discount = promo === 'NSPRIVATE' ? 0.78 : 1;
    const final = totalEur * discount * (rates[cur] || 1);
    totalEl.textContent = `${fmt.format(final)} ${symbols[cur] || ''}`;
    const dn = nights === 1 ? 'ночь' : (nights < 5 ? 'ночи' : 'ночей');
    metaEl.textContent = `${nights} ${dn} · ${guests} гост${guests===1?'ь':guests<5?'я':'ей'}${promo === 'NSPRIVATE' ? ' · скидка Private −22%' : ''}`;
  };
  form.addEventListener('input', recalc);
  form.addEventListener('change', recalc);

  const today = new Date().toISOString().slice(0,10);
  form.checkin.min = today;
  form.checkout.min = today;
  form.checkin.addEventListener('change', () => {
    if (form.checkin.value) form.checkout.min = form.checkin.value;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.hotel.value || !form.checkin.value || !form.checkout.value) {
      alert('Заполните отель и даты.');
      return;
    }
    alert('Спасибо. Мы зафиксировали запрос. С вами свяжется консьерж в течение 30 минут.');
  });

  document.getElementById('currency').addEventListener('change', e => {
    document.getElementById('bk-cur').value = e.target.value;
    recalc();
  });
  document.getElementById('bk-cur').addEventListener('change', e => {
    document.getElementById('currency').value = e.target.value;
  });

  const chips = document.querySelectorAll('.chip');
  const evts = document.querySelectorAll('.evt');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('is-active'));
    c.classList.add('is-active');
    const f = c.dataset.loc;
    evts.forEach(e => { e.hidden = !(f === 'all' || e.dataset.loc === f); });
  }));

  const lead = document.getElementById('leadForm');
  lead.addEventListener('submit', e => {
    e.preventDefault();
    const v = document.getElementById('leadEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      alert('Проверьте e-mail.');
      return;
    }
    lead.innerHTML = '<p style="font-family:var(--f-display);font-style:italic;font-size:1.4rem;color:var(--gold);margin:0;padding:18px 0">Готово. Письмо с доступом отправлено.</p>';
  });
})();
