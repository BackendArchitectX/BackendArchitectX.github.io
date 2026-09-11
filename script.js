(() => {
  document.documentElement.classList.add('js');

  document.querySelectorAll('link[rel="stylesheet"][href*="styles.css"]').forEach(link => {
    const url = new URL(link.href, window.location.href);
    if (url.searchParams.get('v') !== '20260911zg') {
      url.searchParams.set('v', '20260911zg');
      link.href = url.toString();
    }
  });

  const desktopTypography = document.createElement('style');
  desktopTypography.textContent = `
    @media (min-width: 901px) {
      .hero-copy,
      .proof-row p,
      .system-body > p,
      .feature-project p,
      .lab-row > p,
      .oss-entry p,
      .case-title .lede {
        text-align: justify !important;
        text-align-last: left !important;
        text-justify: inter-word !important;
        hyphens: auto !important;
        word-spacing: normal !important;
      }
    }

    /* PRIMARY / ALSO only. NOW and BEFORE remain untouched. */
    .hero-side .skill-lines {
      display: grid;
      gap: 5px;
      width: 100%;
    }

    .hero-side .skill-line {
      display: flex;
      align-items: baseline;
      width: 100%;
      min-width: 0;
      white-space: nowrap;
    }

    /* First line uses the full measure and aligns with Contact on the right. */
    .hero-side .skill-line--full {
      justify-content: space-between;
    }

    /* Second line is intentionally natural-width; do not force its last item to Contact. */
    .hero-side .skill-line--natural {
      justify-content: flex-start;
      gap: 0;
    }

    .hero-side .skill-line span {
      display: inline-block;
      flex: 0 0 auto;
      font-weight: 700;
      text-align: left;
      letter-spacing: -0.012em;
      color: #000 !important;
    }

    .hero-side .skill-line--full span:not(:last-child)::after {
      content: " ·";
      margin-left: 2px;
      font-weight: 500;
      color: #000 !important;
      opacity: .65;
    }

    .hero-side .skill-line--natural span + span::before {
      content: "·";
      display: inline-block;
      margin: 0 8px;
      font-weight: 500;
      color: #000 !important;
      opacity: .65;
    }

    .hero-side .quick-links {
      width: 100%;
      max-width: none !important;
      justify-content: space-between !important;
      gap: 20px !important;
    }

    .footer-inner > span {
      font-size: 34px !important;
      font-weight: 760 !important;
      letter-spacing: -0.04em;
      line-height: 1.15;
    }

    @media (max-width: 820px) {
      .footer-inner > span {
        font-size: 29px !important;
      }
    }

    @media (max-width: 700px) {
      .hero-side .skill-lines {
        gap: 3px;
      }

      .hero-side .skill-line,
      .hero-side .skill-line--full,
      .hero-side .skill-line--natural {
        justify-content: flex-start;
        flex-wrap: wrap;
        white-space: normal;
        row-gap: 2px;
      }

      .hero-side .skill-line--full span + span::before,
      .hero-side .skill-line--natural span + span::before {
        content: "·";
        display: inline-block;
        margin: 0 7px;
        font-weight: 500;
        color: #000 !important;
        opacity: .65;
      }

      .hero-side .skill-line--full span:not(:last-child)::after {
        content: none;
      }

      .hero-side .quick-links {
        justify-content: flex-start !important;
        gap: 12px 24px !important;
      }
    }

    @media (max-width: 620px) {
      .footer-inner > span {
        font-size: 26px !important;
      }
    }

    @media (max-width: 390px) {
      .footer-inner > span {
        font-size: 24px !important;
      }
    }
  `;
  document.head.appendChild(desktopTypography);

  /* Keep NOW and BEFORE exactly as authored; only structure PRIMARY and ALSO. */
  const profileRows = [...document.querySelectorAll('.hero-side .meta-row')];
  if (profileRows.length >= 4) {
    const setSkillRow = (row, lines) => {
      const dd = row.querySelector('dd');
      if (!dd) return;
      dd.innerHTML = `<div class="skill-lines">${lines.map((line, index) => `<div class="skill-line ${index === 0 ? 'skill-line--full' : 'skill-line--natural'}">${line.map(skill => `<span>${skill}</span>`).join('')}</div>`).join('')}</div>`;
    };

    setSkillRow(profileRows[2], [
      ['Java', 'Spring Boot', 'Microservices', 'REST'],
      ['Hibernate/JPA', 'MySQL', 'Redis', 'AWS', 'EKS']
    ]);

    setSkillRow(profileRows[3], [
      ['Kafka', 'concurrency', 'Docker', 'Kubernetes'],
      ['Jenkins', 'CloudWatch', 'JFR']
    ]);
  }

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
