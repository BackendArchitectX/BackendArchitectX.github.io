(() => {
  document.documentElement.classList.add('js');

  document.querySelectorAll('link[rel="stylesheet"][href*="styles.css"]').forEach(link => {
    const url = new URL(link.href, window.location.href);
    if (url.searchParams.get('v') !== '20260911h') {
      url.searchParams.set('v', '20260911h');
      link.href = url.toString();
    }
  });

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percent = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    progress.style.width = `${percent}%`;
  };

  const headerInner = document.querySelector('.header-inner');
  const nav = document.querySelector('.nav');

  if (headerInner && nav) {
    const button = document.createElement('button');
    button.className = 'menu-toggle';
    button.type = 'button';
    button.textContent = 'Menu';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'primary-nav');
    nav.id = nav.id || 'primary-nav';

    const headerActions = headerInner.querySelector('.header-actions');
    headerInner.insertBefore(button, headerActions || null);

    const closeMenu = () => {
      nav.classList.remove('nav-open');
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'Menu';
    };

    button.addEventListener('click', () => {
      const open = nav.classList.toggle('nav-open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? 'Close' : 'Menu';
    });

    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const updateActiveNav = () => {
    if (!sections.length) return;
    const marker = window.scrollY + Math.min(220, window.innerHeight * 0.28);
    let active = sections[0];

    sections.forEach(section => {
      if (section.offsetTop <= marker) active = section;
    });

    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${active.id}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const onScroll = () => {
    updateProgress();
    updateActiveNav();
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateProgress);
})();
