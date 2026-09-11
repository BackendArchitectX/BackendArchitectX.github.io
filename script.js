(() => {
  document.documentElement.classList.add('js');

  document.querySelectorAll('link[rel="stylesheet"][href*="styles.css"]').forEach(link => {
    const url = new URL(link.href, window.location.href);
    if (url.searchParams.get('v') !== '20260911za') {
      url.searchParams.set('v', '20260911za');
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
      .oss-entry p {
        text-align: justify !important;
        text-align-last: left !important;
        text-justify: inter-word !important;
        hyphens: auto !important;
        word-spacing: normal !important;
      }
    }

    /* Only structure PRIMARY / ALSO. NOW and BEFORE remain untouched. */
    .hero-side .skill-lines {
      display: grid;
      gap: 5px;
      width: 100%;
    }

    .hero-side .skill-line {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      align-items: baseline;
      width: 100%;
      white-space: nowrap;
    }

    .hero-side .skill-line span {
      position: relative;
      display: block;
      width: 100%;
      font-weight: 700;
      text-align: center;
    }

    .hero-side .skill-line span.edge-start {
      text-align: left;
    }

    .hero-side .skill-line span.edge-end {
      text-align: right;
    }

    .hero-side .skill-line span:not(.edge-end)::after {
      content: "·";
      position: absolute;
      right: 0;
      top: 50%;
      transform: translate(50%, -50%);
      font-weight: 700;
      opacity: .78;
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
        gap: 2px;
      }

      .hero-side .skill-line {
        display: flex;
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 0 8px;
        white-space: normal;
      }

      .hero-side .skill-line span,
      .hero-side .skill-line span.edge-start,
      .hero-side .skill-line span.edge-end {
        width: auto;
        text-align: left;
      }

      .hero-side .skill-line span:not(.edge-end)::after {
        position: static;
        display: inline;
        margin-left: 8px;
        transform: none;
        opacity: 1;
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
      dd.innerHTML = `<div class="skill-lines">${lines.map(line => `<div class="skill-line">${line.map(item => `<span class="${item.edge || ''}" style="grid-column:${item.col}">${item.skill}</span>`).join('')}</div>`).join('')}</div>`;
    };

    setSkillRow(profileRows[2], [
      [
        { skill: 'Java', col: '1', edge: 'edge-start' },
        { skill: 'Spring Boot', col: '2' },
        { skill: 'Microservices', col: '3 / span 2' },
        { skill: 'REST', col: '5', edge: 'edge-end' }
      ],
      [
        { skill: 'Hibernate/JPA', col: '1', edge: 'edge-start' },
        { skill: 'MySQL', col: '2' },
        { skill: 'Redis', col: '3' },
        { skill: 'AWS', col: '4' },
        { skill: 'EKS', col: '5', edge: 'edge-end' }
      ]
    ]);

    setSkillRow(profileRows[3], [
      [
        { skill: 'Kafka', col: '1', edge: 'edge-start' },
        { skill: 'concurrency', col: '2' },
        { skill: 'Docker', col: '3' },
        { skill: 'Kubernetes', col: '4 / span 2', edge: 'edge-end' }
      ],
      [
        { skill: 'Jenkins', col: '1', edge: 'edge-start' },
        { skill: 'CloudWatch', col: '2 / span 3' },
        { skill: 'JFR', col: '5', edge: 'edge-end' }
      ]
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
