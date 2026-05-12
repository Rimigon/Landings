/**
 * TerraBuild Construction — Interactive Scripts
 * Vanilla JS, no dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  // Preloader
  const preloader = document.querySelector('.preloader');
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('preloader--hidden');
      document.body.style.overflow = '';
    }, 1500);
  });
  
  document.body.style.overflow = 'hidden';

  // Header scroll behavior
  const header = document.getElementById('header');
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
      header.classList.add('header--hidden');
    } else {
      header.classList.remove('header--hidden');
    }
    
    lastScroll = currentScroll;
  });

  // Mobile navigation
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  
  burger?.addEventListener('click', () => {
    const isActive = burger.classList.contains('header__burger--active');
    burger.classList.toggle('header__burger--active', !isActive);
    burger.setAttribute('aria-expanded', !isActive);
    nav.classList.toggle('nav--mobile--active', !isActive);
  });

  // Close mobile nav on link click
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('header__burger--active');
      nav.classList.remove('nav--mobile--active');
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (!target) return;
      
      e.preventDefault();
      
      const headerHeight = header.offsetHeight;
      const targetPosition = target.offsetTop - headerHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });

  // Active nav link highlight
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');
  
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };
  
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('nav__link--active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, observerOptions);
  
  sections.forEach(section => sectionObserver.observe(section));

  // Counter animation
  const counters = document.querySelectorAll('[data-count]');
  
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.dataset.count);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
          current += step;
          if (current < target) {
            counter.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target;
          }
        };
        
        updateCounter();
        counterObserver.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => counterObserver.observe(counter));

  // Calculator
  const calculatorForm = document.getElementById('calculator-form');
  const calculatorResult = document.getElementById('calculator-result');
  const resultValue = document.getElementById('result-value');
  const resultClose = document.getElementById('result-close');
  
  const baseRates = {
    industrial: 35000,
    commercial: 45000,
    residential: 55000,
    private: 65000
  };
  
  const materialCoefficients = {
    concrete: 1,
    brick: 1.3,
    metal: 0.8,
    wood: 0.9
  };
  
  const regionCoefficients = {
    moscow: 1.3,
    mo: 1.1,
    other: 1
  };
  
  const extraCosts = {
    design: 5000,
    engineering: 8000,
    finishing: 15000,
    landscaping: 3000
  };
  
  calculatorForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(calculatorForm);
    const type = formData.get('type');
    const area = parseInt(formData.get('area')) || 0;
    const floors = parseInt(formData.get('floors')) || 1;
    const material = formData.get('material') || 'concrete';
    const region = formData.get('region') || 'moscow';
    const extras = formData.getAll('extras');
    
    let baseCost = baseRates[type] || 35000;
    let total = baseCost * area;
    
    // Material coefficient
    total *= materialCoefficients[material] || 1;
    
    // Region coefficient
    total *= regionCoefficients[region] || 1;
    
    // Floors coefficient (more floors = more complex)
    if (floors > 3) {
      total *= 1 + (floors - 3) * 0.1;
    }
    
    // Extras
    extras.forEach(extra => {
      total += extraCosts[extra] * area;
    });
    
    // Format number with spaces
    const formattedTotal = Math.round(total).toLocaleString('ru-RU');
    resultValue.textContent = formattedTotal;
    
    calculatorResult.hidden = false;
    calculatorResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  
  resultClose?.addEventListener('click', () => {
    calculatorResult.hidden = true;
  });

  // Projects filter
  const filterButtons = document.querySelectorAll('.filter__btn');
  const projectCards = document.querySelectorAll('.project-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active state
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const filter = button.dataset.filter;
      
      projectCards.forEach(card => {
        const category = card.dataset.category;
        
        if (filter === 'all' || category === filter) {
          card.style.display = '';
          card.style.animation = 'slideIn 0.3s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Modal functionality
  const modalTriggers = document.querySelectorAll('[data-modal]');
  const modalCloses = document.querySelectorAll('[data-modal-close]');
  
  const openModal = (modalId) => {
    const modal = document.getElementById(`modal-${modalId}`);
    if (modal) {
      modal.classList.add('modal--active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      
      // Focus first input
      const firstInput = modal.querySelector('input, textarea, select, button');
      firstInput?.focus();
    }
  };
  
  const closeModal = (modal) => {
    modal.classList.remove('modal--active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.dataset.modal;
      openModal(modalId);
    });
  });
  
  modalCloses.forEach(close => {
    close.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      closeModal(modal);
    });
  });
  
  // Close modal on overlay click
  document.querySelectorAll('.modal__overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      closeModal(modal);
    });
  });
  
  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal--active').forEach(modal => {
        closeModal(modal);
      });
    }
  });

  // Sticky CTA
  const stickyCta = document.getElementById('sticky-cta');
  
  const stickyObserver = new IntersectionObserver((entries) => {
    const hero = document.querySelector('.hero');
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    
    if (window.pageYOffset > heroBottom * 0.5) {
      stickyCta.classList.add('sticky-cta--visible');
    } else {
      stickyCta.classList.remove('sticky-cta--visible');
    }
  }, { threshold: 0 });
  
  stickyObserver.observe(document.querySelector('.hero'));

  // Scroll animations
  const animateElements = document.querySelectorAll('[data-animate]');
  
  const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        animateObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  animateElements.forEach(el => animateObserver.observe(el));

  // Form validation and submission
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Basic validation
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = 'var(--color-error)';
        } else {
          field.style.borderColor = '';
        }
        
        // Email validation
        if (field.type === 'email' && field.value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(field.value)) {
            isValid = false;
            field.style.borderColor = 'var(--color-error)';
          }
        }
        
        // Phone validation (basic)
        if (field.type === 'tel' && field.value) {
          const phoneDigits = field.value.replace(/\D/g, '');
          if (phoneDigits.length < 10) {
            isValid = false;
            field.style.borderColor = 'var(--color-error)';
          }
        }
      });
      
      if (!isValid) {
        // Scroll to first invalid field
        const firstInvalid = form.querySelector('[style*="border-color: var(--color-error)"]');
        firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      // Simulate form submission
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Отправка...';
      submitButton.disabled = true;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success
      submitButton.textContent = 'Отправлено!';
      submitButton.style.background = 'var(--color-success)';
      
      // Reset form
      setTimeout(() => {
        form.reset();
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.style.background = '';
        
        // Close modal if open
        const modal = form.closest('.modal');
        if (modal) {
          closeModal(modal);
        }
      }, 2000);
    });
    
    // Clear error on input
    form.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('input', () => {
        field.style.borderColor = '';
      });
    });
  });

  // Phone mask (simple implementation)
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  
  phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      if (value.length > 0) {
        if (value[0] === '7' || value[0] === '8') {
          value = value.slice(1);
        }
        
        value = value.slice(0, 10);
        
        let formatted = '+7';
        if (value.length > 0) formatted += ` (${value.slice(0, 3)}`;
        if (value.length > 3) formatted += `) ${value.slice(3, 6)}`;
        if (value.length > 6) formatted += `-${value.slice(6, 8)}`;
        if (value.length > 8) formatted += `-${value.slice(8, 10)}`;
        
        e.target.value = formatted;
      }
    });
  });

  // INN validation
  const innInput = document.getElementById('tender-inn');
  
  innInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12);
  });

  // Lazy load images (placeholder for future implementation)
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  
  lazyImages.forEach(img => imageObserver.observe(img));

  // Parallax effect for hero
  const heroBg = document.querySelector('.hero__bg');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroHeight = hero.offsetHeight;
    
    if (scrolled < heroHeight) {
      heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
  });

  // OpenStreetMap with Leaflet (no labels)
  const mapElement = document.getElementById('map');
  if (mapElement && typeof L !== 'undefined') {
    const map = L.map('map', {
      center: [55.7558, 37.6173],
      zoom: 10,
      scrollWheelZoom: false,
      zoomControl: false
    });

    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C8.954 0 0 8.954 0 20C0 32.5 20 40 20 40C20 40 40 32.5 40 20C40 8.954 31.046 0 20 0Z" fill="#ff6b00"/>
        <circle cx="20" cy="18" r="8" fill="#121212"/>
      </svg>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });

    L.marker([55.7558, 37.6173], { icon: markerIcon }).addTo(map)
      .bindPopup('<strong>TerraBuild Construction</strong><br>г. Москва, ул. Примерная, д. 1');
  }

  // Console info
  console.log('%c TerraBuild Construction ', 'background: #ff6b00; color: #fff; font-size: 16px; padding: 10px;');
  console.log('Сайт готов к работе. Для подключения карты и отправки форм настройте backend.');
});
