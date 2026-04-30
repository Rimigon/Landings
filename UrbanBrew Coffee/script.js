// Header show on scroll
var header = document.getElementById('header');

window.addEventListener('scroll', function() {
  if (window.scrollY > 100) {
    header.classList.add('visible');
  } else {
    header.classList.remove('visible');
  }
}, { passive: true });

// Map
document.addEventListener('DOMContentLoaded', function() {
  var locations = [
    { lat: 55.7520, lng: 37.5876, name: 'ул. Арбат, 24' },
    { lat: 55.7651, lng: 37.5993, name: 'Пушкинская пл., 2' },
    { lat: 55.7585, lng: 37.6101, name: 'Тверская ул., 16' },
    { lat: 55.8182, lng: 37.6393, name: 'ул. Академика Королёва, 15' },
    { lat: 55.7902, lng: 37.5079, name: 'Ленинский пр-т, 78' },
    { lat: 55.7711, lng: 37.8384, name: 'Щёлковское шоссе, 5' },
    { lat: 55.7949, lng: 37.8123, name: 'Измайловский пр-д, 2' }
  ];

  var map = L.map('map', {
    center: [55.7558, 37.6173],
    zoom: 11,
    zoomControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  var customIcon = L.divIcon({
    className: '',
    html: '<div style="width:22px;height:22px;background:#c87f3d;border:4px solid #fff;border-radius:50%;box-shadow:0 4px 12px rgba(141,95,50,0.4);"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  var markers = {};
  locations.forEach(function(loc, index) {
    var marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup('<strong>' + loc.name + '</strong><br>UrbanBrew Coffee');
    markers[index] = marker;
  });

  document.querySelectorAll('.location-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var lat = parseFloat(this.dataset.lat);
      var lng = parseFloat(this.dataset.lng);

      document.querySelectorAll('.location-item').forEach(function(i) {
        i.classList.remove('active');
      });
      this.classList.add('active');

      map.setView([lat, lng], 14, { animate: true });

      var index = Array.from(document.querySelectorAll('.location-item')).indexOf(this);
      if (markers[index]) {
        markers[index].openPopup();
      }
    });

    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
});

// Form
var form = document.getElementById('order-form');

form.addEventListener('submit', function(e) {
  e.preventDefault();

  var name = form.name.value.trim();
  var phone = form.phone.value.trim();
  var email = form.email.value.trim();

  var isValid = true;
  var firstError = null;

  form.querySelectorAll('.form__input').forEach(function(input) {
    input.style.borderColor = '';
  });

  if (!name || name.length < 2) {
    form.name.style.borderColor = 'var(--accent)';
    isValid = false;
    firstError = firstError || form.name;
  }

  var phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  if (!phone || !phoneRegex.test(phone.replace(/\s/g, ''))) {
    form.phone.style.borderColor = 'var(--accent)';
    isValid = false;
    firstError = firstError || form.phone;
  }

  if (email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      form.email.style.borderColor = 'var(--accent)';
      isValid = false;
      firstError = firstError || form.email;
    }
  }

  if (!isValid) {
    firstError.focus();
    return;
  }

  var submitBtn = form.querySelector('button[type="submit"]');
  var originalText = submitBtn.textContent;
  submitBtn.textContent = 'Отправляем...';
  submitBtn.disabled = true;

  setTimeout(function() {
    alert('Спасибо! Заявка принята — наш бариста свяжется с тобой в течение 5 минут.');
    form.reset();
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }, 1000);
});

// Phone mask
var phoneInput = document.getElementById('phone');
phoneInput.addEventListener('input', function(e) {
  var value = e.target.value.replace(/\D/g, '');
  if (value.length > 0) {
    if (value.length <= 1) value = '+' + value;
    else if (value.length <= 4) value = '+' + value.substring(0,1) + ' (' + value.substring(1);
    else if (value.length <= 7) value = '+' + value.substring(0,1) + ' (' + value.substring(1,4) + ') ' + value.substring(4);
    else value = '+' + value.substring(0,1) + ' (' + value.substring(1,4) + ') ' + value.substring(4,7) + '-' + value.substring(7,9) + '-' + value.substring(9,11);
  }
  e.target.value = value;
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
