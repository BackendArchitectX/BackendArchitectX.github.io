(() => {
  document.documentElement.classList.add('js');

  document.querySelectorAll('link[rel="stylesheet"][href*="styles.css"]').forEach(link => {
    const url = new URL(link.href, window.location.href);
    if (url.searchParams.get('v') !== '20260911y') {
      url.searchParams.set('v', '20260911y');
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

    /* Structured alignment for the hero profile ledger. This avoids ugly text justification. */
    .hero-side .meta-row dd {
      width: 100%;
      min-width: 0;
    }

    .hero-side .employment-line {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 20px;
      width: 100%;
      margin-top: 3px;
      font-weight: 400;
      white-space: nowrap;
    }

    .hero-side .skill-lines {
      display: grid;
      gap: 3px;
      width: 100%;
    }

    .hero-side .skill-line {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      width: 100%;
      white-space: nowrap;
    }

    .hero-side .skill-line span {
      display: inline-flex;
      align-items: baseline;
      font-weight: 700;
    }

    .hero-side .skill-line span:not(:last-child)::after {
      content: " ·";
      margin-left: 2px;
      font-weight: 700;
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

    @media (max-width: 1180px) {
      .hero-side .employment-line {
        gap: 12px;
      }
      .hero-side .skill-line {
        gap: 8px;
      }
    }

    @media (max-width: 820px) {
      .footer-inner > span {
        font-size: 29px !important;
      }
    }

    @media (max-width: 700px) {
      .hero-side .employment-line {
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 2px 10px;
        white-space: normal;
      }

      .hero-side .employment-line span + span::before {
        content: "· ";
      }

      .hero-side .skill-lines {
        gap: 2px;
      }

      .hero-side .skill-line {
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 0 8px;
        white-space: normal;
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

  /* Turn the compact profile copy into explicit layout groups so the right edge aligns
     without stretching individual words. */
  const profileRows = [...document.querySelectorAll('.hero-side .meta-row')];
  if (profileRows.length >= 4) {
    const setEmploymentRow = (row, title, company, period) => {
      const dd = row.querySelector('dd');
      if (!dd) return;
      dd.innerHTML = `<strong>${title}</strong><div class="employment-line"><span>${company}</span><span>${period}</span></div>`;
    };

    const setSkillRow = (row, lines) => {
      const dd = row.querySelector('dd');
      if (!dd) return;
      dd.innerHTML = `<div class="skill-lines">${lines.map(line => `<div class="skill-line">${line.map(skill => `<span>${skill}</span>`).join('')}</div>`).join('')}</div>`;
    };

    setEmploymentRow(profileRows[0], 'Software Engineer', 'Linux Socials', 'Apr 2025 — Present');
    setEmploymentRow(profileRows[1], 'Technical Intern → Associate Software Engineer', 'Merkle Inspire', '2021 — 2024');
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
