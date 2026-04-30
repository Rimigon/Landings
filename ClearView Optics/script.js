(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ============== Header scroll state + progress ============== */
    const header = document.querySelector('.header');
    const progress = document.querySelector('.scroll-progress span');

    const onScroll = () => {
        const y = window.scrollY;
        header?.classList.toggle('is-scrolled', y > 8);
        if (progress) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const pct = max > 0 ? (y / max) * 100 : 0;
            progress.style.width = pct + '%';
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ============== Mobile nav ============== */
    const burger = document.querySelector('.burger');
    const mobileNav = document.getElementById('mobile-nav');
    if (burger && mobileNav) {
        burger.addEventListener('click', () => {
            const open = burger.getAttribute('aria-expanded') === 'true';
            burger.setAttribute('aria-expanded', String(!open));
            mobileNav.hidden = open;
        });
        mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            burger.setAttribute('aria-expanded', 'false');
            mobileNav.hidden = true;
        }));
    }

    /* ============== Smooth scroll with header offset ============== */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const id = link.getAttribute('href');
            if (!id || id === '#' || id.length < 2) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            const headerH = header ? header.offsetHeight : 0;
            const top = target.getBoundingClientRect().top + window.scrollY - headerH + 1;
            window.scrollTo({
                top,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    });

    /* ============== Reveal on scroll ============== */
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    } else {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    }

    /* ============== Hero parallax ============== */
    if (!prefersReducedMotion) {
        const items = document.querySelectorAll('[data-parallax]');
        let ticking = false;
        const update = () => {
            const y = window.scrollY;
            items.forEach(el => {
                const speed = parseFloat(el.dataset.parallax);
                el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
            });
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });
    }

    /* ============== Virtual try-on (camera) ============== */
    const camStartBtn = document.getElementById('cam-start');
    const camVideo = document.getElementById('cam-video');
    const camPlaceholder = document.getElementById('cam-placeholder');
    const cameraEl = document.querySelector('.camera');

    if (camStartBtn) {
        camStartBtn.addEventListener('click', async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                if (camPlaceholder) camPlaceholder.querySelector('p').textContent = 'Камера не поддерживается этим браузером.';
                return;
            }
            try {
                camStartBtn.disabled = true;
                camStartBtn.textContent = 'Подключаемся к камере…';
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false });
                camVideo.srcObject = stream;
                cameraEl?.classList.add('is-active');
                camStartBtn.textContent = 'Остановить';
                camStartBtn.disabled = false;
                camStartBtn.dataset.active = 'true';

                camStartBtn.onclick = () => {
                    stream.getTracks().forEach(t => t.stop());
                    camVideo.srcObject = null;
                    cameraEl?.classList.remove('is-active');
                    camStartBtn.textContent = 'Запустить примерку';
                    delete camStartBtn.dataset.active;
                    camStartBtn.onclick = null;
                };
            } catch (err) {
                camStartBtn.disabled = false;
                camStartBtn.textContent = 'Запустить примерку';
                if (camPlaceholder) camPlaceholder.querySelector('p').textContent = 'Доступ к камере не получен. Проверьте разрешения браузера.';
            }
        });
    }

    /* ============== Frame style switcher ============== */
    const frameSvg = document.getElementById('frame-svg');
    const framePresets = {
        round:    '<ellipse cx="80" cy="50" rx="50" ry="36"/><ellipse cx="240" cy="50" rx="50" ry="36"/><line x1="130" y1="50" x2="190" y2="50"/>',
        cat:      '<path d="M30 50 Q40 20 100 25 Q140 30 130 60 Q70 75 30 50Z"/><path d="M290 50 Q280 20 220 25 Q180 30 190 60 Q250 75 290 50Z"/><line x1="130" y1="48" x2="190" y2="48"/>',
        aviator:  '<path d="M40 32 L130 32 L120 78 Q80 90 50 78 Z"/><path d="M280 32 L190 32 L200 78 Q240 90 270 78 Z"/><line x1="130" y1="42" x2="190" y2="42"/>',
        square:   '<rect x="30" y="22" width="100" height="56" rx="6"/><rect x="190" y="22" width="100" height="56" rx="6"/><line x1="130" y1="50" x2="190" y2="50"/>',
        oval:     '<ellipse cx="80" cy="50" rx="55" ry="30"/><ellipse cx="240" cy="50" rx="55" ry="30"/><line x1="135" y1="50" x2="185" y2="50"/>'
    };
    document.querySelectorAll('.catalog__chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.catalog__chip').forEach(c => c.classList.remove('is-active'));
            chip.classList.add('is-active');
            const preset = framePresets[chip.dataset.frame];
            if (frameSvg && preset) frameSvg.innerHTML = preset;
        });
    });

    /* ============== Knowledge filter ============== */
    document.querySelectorAll('.knowledge__filter .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.knowledge__filter .chip').forEach(c => {
                c.classList.remove('is-active');
                c.setAttribute('aria-selected', 'false');
            });
            chip.classList.add('is-active');
            chip.setAttribute('aria-selected', 'true');
            const cat = chip.dataset.cat;
            document.querySelectorAll('.article').forEach(a => {
                a.classList.toggle('is-hidden', cat !== 'all' && a.dataset.cat !== cat);
            });
        });
    });

    /* ============== Booking form ============== */
    const form = document.getElementById('booking-form');
    const formSuccess = document.getElementById('form-success');
    const phoneInput = form?.querySelector('input[name="phone"]');

    if (phoneInput) {
        phoneInput.addEventListener('input', e => {
            let v = e.target.value.replace(/[^\d+]/g, '');
            if (v.startsWith('8')) v = '+7' + v.slice(1);
            if (!v.startsWith('+')) v = '+' + v;
            e.target.value = v.slice(0, 16);
        });
    }

    const dateInput = form?.querySelector('input[name="date"]');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }

    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (!form.reportValidity()) return;
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправляем…';

            // TODO: replace with real endpoint, e.g. fetch('/api/booking', { method: 'POST', body: new FormData(form) })
            setTimeout(() => {
                form.reset();
                if (formSuccess) {
                    formSuccess.hidden = false;
                    formSuccess.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
                }
                submitBtn.disabled = false;
                submitBtn.textContent = 'Записаться на приём';
            }, 700);
        });
    }

    /* ============== Real map (Leaflet + OpenStreetMap) ============== */
    const initMap = () => {
        const mapEl = document.getElementById('map');
        if (!mapEl || typeof L === 'undefined') return;

        const coords = [55.76068, 37.63830]; // Чистопрудный бульвар, 12, Москва
        const map = L.map(mapEl, {
            center: coords,
            zoom: 16,
            scrollWheelZoom: false,
            zoomControl: true,
            attributionControl: true
        });

        const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '© OpenStreetMap, © CARTO'
        });
        tiles.on('tileerror', () => {
            map.removeLayer(tiles);
            L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap Deutschland'
            }).addTo(map);
        });
        tiles.addTo(map);

        const icon = L.divIcon({
            className: 'cv-marker-wrap',
            html: '<div class="cv-marker"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });

        L.marker(coords, { icon, title: 'ClearView Optics' })
            .addTo(map)
            .bindPopup('<strong>ClearView Optics</strong><br>Чистопрудный бульвар, 12');

        mapEl.addEventListener('click', () => map.scrollWheelZoom.enable(), { once: true });
        map.on('mouseout', () => map.scrollWheelZoom.disable());
    };

    if (document.readyState === 'loading') {
        window.addEventListener('load', initMap);
    } else {
        initMap();
    }
})();
