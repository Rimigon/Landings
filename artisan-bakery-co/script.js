/* =========================================================
   POLBA I PECH — landing logic
   Vanilla JS only. No build step.
   ========================================================= */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Mobile nav ---------- */
  const burger = $('.burger');
  const mnav   = $('#mobile-nav');
  if (burger && mnav) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mnav.hidden = open;
    });
    mnav.addEventListener('click', e => {
      if (e.target.matches('a')) {
        burger.setAttribute('aria-expanded', 'false');
        mnav.hidden = true;
      }
    });
  }

  /* ---------- 2. Smooth scroll with sticky-header offset ---------- */
  const topbar = $('.topbar');
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = (topbar?.offsetHeight || 0) + 12;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });

  /* ---------- 3. Active nav link by scroll position ---------- */
  const navLinks = $$('.nav a');
  const sections = navLinks
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const navObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          navLinks.forEach(l => l.classList.toggle('is-active',
            l.getAttribute('href') === '#' + en.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    sections.forEach(s => navObs.observe(s));
  }

  /* ---------- 4. Reveal on scroll ---------- */
  const revealTargets = $$(
    '.about > *, .freshness__head, .batch, .catalog__head, .filters, .good, .preorder__copy, .form, .recipes__head, .recipe, .process__head, .step, .reviews__head, .review, .visit__copy, .visit__map, .news'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window && !reduceMotion) {
    const revObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          revObs.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealTargets.forEach(el => revObs.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- 5. Catalog filter ---------- */
  const filters = $$('.filter');
  const goods   = $$('.good');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-selected', b === btn);
    });
    const f = btn.dataset.filter;
    goods.forEach(g => {
      const cats = (g.dataset.cat || '').split(/\s+/);
      g.hidden = !(f === 'all' || cats.includes(f));
    });
  }));

  /* ---------- 6. Basket ---------- */
  const basket = new Map();
  const basketList = $('#basketList');
  const basketSum  = $('#basketSum');
  const stickyCount = $('#stickyCount');
  const stickyCta   = $('.sticky-cta');

  function renderBasket() {
    if (!basketList) return;
    basketList.innerHTML = '';
    if (basket.size === 0) {
      basketList.innerHTML = '<li class="basket__empty">Пока пусто. Добавьте позиции из каталога.</li>';
      basketSum.textContent = '0';
      if (stickyCount) { stickyCount.hidden = true; stickyCount.textContent = '0'; }
      return;
    }
    let total = 0, count = 0;
    basket.forEach((item, id) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${item.name}</span>
        <span class="basket__qty">
          <button type="button" data-act="dec" aria-label="Убрать">−</button>
          <span>${item.qty}</span>
          <button type="button" data-act="inc" aria-label="Добавить">+</button>
        </span>
        <span>${item.price * item.qty} ₽</span>
        <button type="button" class="basket__rm" data-act="rm" aria-label="Удалить">✕</button>`;
      li.dataset.id = id;
      basketList.appendChild(li);
      total += item.price * item.qty;
      count += item.qty;
    });
    basketSum.textContent = total.toLocaleString('ru-RU');
    if (stickyCount) { stickyCount.hidden = false; stickyCount.textContent = String(count); }
  }

  $$('.good__add').forEach(btn => btn.addEventListener('click', () => {
    const id    = btn.dataset.id;
    const name  = btn.dataset.name;
    const price = Number(btn.dataset.price);
    const cur = basket.get(id);
    basket.set(id, { name, price, qty: cur ? cur.qty + 1 : 1 });
    btn.classList.add('is-added');
    btn.textContent = '✓ в коробе';
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
      btn.classList.remove('is-added');
      btn.textContent = '+ ещё';
    }, 1400);
    renderBasket();
  }));

  basketList?.addEventListener('click', e => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const id = li.dataset.id;
    const item = basket.get(id);
    if (!item) return;
    const act = e.target.dataset.act;
    if (act === 'inc') item.qty++;
    if (act === 'dec') item.qty--;
    if (act === 'rm' || item.qty <= 0) basket.delete(id);
    renderBasket();
  });

  /* ---------- 7. Sticky CTA visibility ---------- */
  if (stickyCta) {
    const hero = $('#hero');
    const onScroll = () => {
      const past = window.scrollY > (hero?.offsetHeight || 600) * 0.6;
      stickyCta.classList.toggle('is-visible', past);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 8. Forms validation ---------- */
  function showError(field, msg) {
    field.classList.toggle('is-invalid', !!msg);
    const err = field.querySelector('.field__err');
    if (err) err.textContent = msg || '';
  }

  const preForm = $('#preorderForm');
  preForm?.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    const fields = $$('.field', preForm);
    fields.forEach(f => {
      const inp = f.querySelector('input');
      if (!inp || inp.type === 'checkbox') return;
      let msg = '';
      if (inp.required && !inp.value.trim()) msg = 'Заполните это поле';
      else if (inp.minLength && inp.value.trim().length < inp.minLength) msg = 'Слишком коротко';
      else if (inp.name === 'contact') {
        const v = inp.value.trim();
        const ok2 = /^\+?\d[\d\s().-]{6,}$/.test(v) || /^@[A-Za-z0-9_]{3,}$/.test(v);
        if (!ok2) msg = 'Телефон или @username в Telegram';
      }
      showError(f, msg);
      if (msg) ok = false;
    });
    const agree = preForm.querySelector('input[name="agree"]');
    if (agree && !agree.checked) {
      ok = false;
      agree.parentElement.classList.add('is-invalid');
    } else {
      agree?.parentElement.classList.remove('is-invalid');
    }
    if (basket.size === 0) {
      ok = false;
      basketList.classList.add('is-invalid');
      const empty = basketList.querySelector('.basket__empty');
      if (empty) empty.textContent = 'Добавьте хотя бы одну позицию.';
    }

    if (!ok) {
      preForm.querySelector('.is-invalid input, .basket.is-invalid')?.focus?.();
      return;
    }

    const data = new FormData(preForm);
    const name    = data.get('name');
    const contact = data.get('contact');
    const slot    = data.get('slot');
    const items = [];
    let total = 0;
    basket.forEach(it => {
      items.push(`• ${it.name} × ${it.qty} = ${it.price * it.qty} ₽`);
      total += it.price * it.qty;
    });

    const message =
      `Предзаказ в «Полба и Печь»\n` +
      `Имя: ${name}\n` +
      `Контакт: ${contact}\n` +
      `Время самовыноса: ${slot}\n\n` +
      `Короб:\n${items.join('\n')}\n\n` +
      `Итого: ${total} ₽`;

    const tgBot   = 'polba_i_pech_bot';
    const email   = 'order@polba-i-pech.example';
    const tgUrl   = `https://t.me/${tgBot}?text=${encodeURIComponent(message)}`;
    const mailUrl = `mailto:${email}?subject=${encodeURIComponent('Предзаказ — ' + name)}&body=${encodeURIComponent(message)}`;

    window.open(tgUrl, '_blank', 'noopener');
    setTimeout(() => { window.location.href = mailUrl; }, 400);

    preForm.innerHTML = `
      <h3 style="font-family:var(--f-display);font-size:1.6rem;margin:0 0 8px">Заказ оформляется.</h3>
      <p>Открыли Telegram-бот <strong>@${tgBot}</strong> с готовым сообщением — нажмите «Старт» и отправьте, чтобы подтвердить заказ.</p>
      <p>Параллельно открылось письмо на адрес пекарни. Если что-то пошло не так — отправьте его вручную или позвоните <a href="tel:+74950000000" style="border-bottom:1px solid currentColor">+7 495 000-00-00</a>.</p>
      <p style="margin-top:14px"><a class="btn btn--primary" href="${tgUrl}" target="_blank" rel="noopener">Открыть Telegram-бот ещё раз</a></p>`;
  });

  const news = $('#newsForm');
  news?.addEventListener('submit', e => {
    e.preventDefault();
    const inp = news.querySelector('input[type=email]');
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(inp.value.trim())) {
      inp.style.borderColor = 'var(--c-accent)';
      inp.focus();
      return;
    }
    /* prod: fetch('/api/subscribe', ...) */
    news.innerHTML = '<p style="font-family:var(--f-display);font-style:italic;font-size:1.2rem">Готово. Первое письмо — в понедельник, 06:30.</p>';
  });

  /* ---------- 9. Lazy-loading for any future <img> ---------- */
  $$('img').forEach(img => {
    if (!img.loading) img.loading = 'lazy';
    if (!img.decoding) img.decoding = 'async';
  });

  /* ---------- 11. Subtle hero parallax ---------- */
  const visual = $('.hero__visual');
  if (visual && !reduceMotion) {
    let raf = 0;
    window.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 600);
        visual.style.transform = `translateY(${y * 0.08}px) rotate(${y * 0.01}deg)`;
      });
    }, { passive: true });
  }

  /* ---------- 12. Ticker pause on hover ---------- */
  const ticker = $('.ticker');
  const track  = $('.ticker__track');
  if (ticker && track) {
    ticker.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
    ticker.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
  }

})();
