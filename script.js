const menuToggle = document.querySelector('[data-menu-toggle]');
const navPanel = document.querySelector('[data-nav-panel]');
const navLinks = document.querySelectorAll('.nav-links a, .nav-cta');
const form = document.querySelector('#lead-form');
const successMessage = document.querySelector('#form-success');
const currentYear = document.querySelector('#current-year');

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

function closeMenu() {
  if (!menuToggle || !navPanel) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  navPanel.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

if (menuToggle && navPanel) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    navPanel.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
  }
});

const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

function setError(field, message) {
  const error = document.querySelector(`[data-error-for="${field.id}"]`);
  field.classList.toggle('field-invalid', Boolean(message));
  field.setAttribute('aria-invalid', String(Boolean(message)));

  if (error) {
    error.textContent = message;
  }
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function validateField(field) {
  const value = field.type === 'checkbox' ? field.checked : field.value.trim();
  let message = '';

  if (field.required && !value) {
    message = field.type === 'checkbox' ? 'Please confirm consent before submitting.' : 'This field is required.';
  } else if (field.type === 'email' && !validateEmail(field.value)) {
    message = 'Please enter a valid email address.';
  }

  setError(field, message);
  return !message;
}

if (form) {
  const fields = Array.from(form.querySelectorAll('input, select, textarea'));

  fields.forEach((field) => {
    const eventName = field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(eventName, () => validateField(field));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const isValid = fields.map((field) => validateField(field)).every(Boolean);

    if (!isValid) {
      const firstInvalid = form.querySelector('.field-invalid');
      if (firstInvalid) firstInvalid.focus();
      successMessage.textContent = '';
      return;
    }

    successMessage.textContent = 'Thank you. Your insurance review request has been validated locally and is ready for secure submission integration.';
    form.reset();
    fields.forEach((field) => setError(field, ''));
  });
}
