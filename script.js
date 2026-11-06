const slides = [...document.querySelectorAll('.hero-slide')];
const dots = [...document.querySelectorAll('.hero-dot')];
const hero = document.querySelector('.hero');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeSlide = 0;
let carouselTimer;

function showSlide(index) {
  activeSlide = (index + slides.length) % slides.length;
  hero.dataset.slide = String(activeSlide);
  slides.forEach((slide, i) => {
    const selected = i === activeSlide;
    slide.classList.toggle('is-active', selected);
    slide.setAttribute('aria-hidden', String(!selected));
    slide.querySelectorAll('a').forEach(link => { link.tabIndex = selected ? 0 : -1; });
  });
  dots.forEach((dot, i) => {
    const selected = i === activeSlide;
    dot.classList.toggle('is-active', selected);
    dot.setAttribute('aria-selected', String(selected));
    dot.tabIndex = selected ? 0 : -1;
  });
}

function stopCarousel() { clearInterval(carouselTimer); }
function startCarousel() {
  stopCarousel();
  if (!reduceMotion.matches && !document.hidden) {
    carouselTimer = setInterval(() => showSlide(activeSlide + 1), 6500);
  }
}

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => { showSlide(i); startCarousel(); });
  dot.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = (i + (event.key === 'ArrowRight' ? 1 : -1) + dots.length) % dots.length;
      showSlide(next);
      dots[next].focus();
      startCarousel();
    }
  });
});
hero.addEventListener('mouseenter', stopCarousel);
hero.addEventListener('mouseleave', startCarousel);
hero.addEventListener('focusin', stopCarousel);
hero.addEventListener('focusout', event => { if (!hero.contains(event.relatedTarget)) startCarousel(); });
document.addEventListener('visibilitychange', () => document.hidden ? stopCarousel() : startCarousel());
reduceMotion.addEventListener('change', startCarousel);
showSlide(0);
startCarousel();

const menuToggle = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
function closeMenu() {
  mobileNav.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
}
menuToggle.addEventListener('click', () => {
  const opening = mobileNav.hidden;
  mobileNav.hidden = !opening;
  menuToggle.setAttribute('aria-expanded', String(opening));
  menuToggle.setAttribute('aria-label', opening ? 'Закрыть меню' : 'Открыть меню');
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 1100) closeMenu(); });

const searchToggle = document.getElementById('search-toggle');
const searchPanel = document.getElementById('search-panel');
const searchInput = document.getElementById('site-search');
const searchFeedback = document.getElementById('search-feedback');
function closeSearch() {
  searchPanel.hidden = true;
  searchToggle.setAttribute('aria-expanded', 'false');
  searchToggle.setAttribute('aria-label', 'Открыть поиск');
  searchFeedback.textContent = '';
}
searchToggle.addEventListener('click', () => {
  const opening = searchPanel.hidden;
  searchPanel.hidden = !opening;
  searchToggle.setAttribute('aria-expanded', String(opening));
  searchToggle.setAttribute('aria-label', opening ? 'Закрыть поиск' : 'Открыть поиск');
  if (opening) searchInput.focus();
});
document.getElementById('search-close').addEventListener('click', closeSearch);
searchInput.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const query = searchInput.value.trim().toLocaleLowerCase('ru');
  if (!query) return;
  const headings = [...document.querySelectorAll('main h1, main h2, main h3')];
  const match = headings.find(heading => heading.textContent.toLocaleLowerCase('ru').includes(query));
  if (match) {
    closeSearch();
    match.scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth', block: 'center' });
  } else {
    searchFeedback.textContent = 'Ничего не найдено. Попробуйте «Galaxy», «телевизор» или «доставка».';
  }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeSearch(); closeMenu(); } });

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px -25px 0px' });
  reveals.forEach(item => observer.observe(item));
} else {
  reveals.forEach(item => item.classList.add('is-visible'));
}
