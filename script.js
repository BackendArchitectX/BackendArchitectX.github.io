(() => {
  document.documentElement.classList.add('js');

  const loadStylesheet = (href, key) => {
    if (document.querySelector(`link[data-portfolio-style="${key}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.portfolioStyle = key;
    document.head.appendChild(link);
  };

  loadStylesheet('/readability.css?v=20260911e', 'readability');
  loadStylesheet('/uniform.css?v=20260911e', 'uniform');

  const footerMeta = document.querySelector('.footer-inner > span:last-child');
  if (footerMeta && footerMeta.textContent.includes('Static site')) footerMeta.remove();

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Thin progress cue: useful on a long technical portfolio without becoming decorative. */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    progress.style.width = `${pct}%`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  /* Responsive navigation. */
  const headerInner = document.querySelector('.header-inner');
  const nav = document.querySelector('.nav');
  if (headerInner && nav && !document.querySelector('.menu-toggle')) {
    const button = document.createElement('button');
    button.className = 'menu-toggle';
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'primary-nav');
    button.textContent = 'Menu';
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

  /* Active section state in the desktop navigation. */
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const observedSections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const updateActiveNav = () => {
    const marker = window.scrollY + 150;
    let active = observedSections[0] || null;
    observedSections.forEach(section => {
      if (section.offsetTop <= marker) active = section;
    });
    navLinks.forEach(link => {
      link.classList.toggle('is-active', !!active && link.getAttribute('href') === `#${active.id}`);
    });
  };
  updateActiveNav();
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* Restrained reveal motion for section-level content only. */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = document.querySelectorAll(
    '.section-head, .proof-row, .system-row, .feature-project, .lab-row, .oss-entry, .timeline-row, .depth, .contact-grid, .record-row'
  );

  revealTargets.forEach(node => node.classList.add('reveal-target'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(node => node.classList.add('in-view'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealTargets.forEach(node => observer.observe(node));
  }
})();
