(() => {
  document.documentElement.classList.add('js');

  document.querySelectorAll('link[rel="stylesheet"][href*="styles.css"]').forEach(link => {
    const url = new URL(link.href, window.location.href);
    if (url.searchParams.get('v') !== '20260911zo') {
      url.searchParams.set('v', '20260911zo');
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

      /* Large section headings: true justification on a controlled measure so spacing stays editorial. */
      #production .section-head h2,
      #systems .section-head h2 {
        width: 100% !important;
        max-width: 1260px !important;
        font-size: clamp(52px, 4.25vw, 64px) !important;
        line-height: 1.035 !important;
        letter-spacing: -0.045em !important;
        text-align: justify !important;
        text-align-last: left !important;
        text-justify: inter-word !important;
        text-wrap: wrap !important;
        hyphens: none !important;
        word-spacing: normal !important;
      }

      /* Public systems supporting copy follows the same left/right measure without stretching its last line. */
      #systems .section-head > p {
        width: 100% !important;
        text-align: justify !important;
        text-align-last: left !important;
        text-justify: inter-word !important;
        hyphens: none !important;
        word-spacing: normal !important;
      }
    }

    /* PRIMARY / ALSO only. NOW and BEFORE remain untouched. */
    .hero-side .skill-lines {
      display: grid;
      gap: 8px;
      width: 100%;
    }

    .hero-side .skill-line {
      display: flex;
      align-items: baseline;
      width: 100%;
      min-width: 0;
      white-space: nowrap;
    }

    /* First line fills the measure; separators are independent flex items so they sit centered between skills. */
    .hero-side .skill-line--full {
      justify-content: space-between;
    }

    /* Second line stays natural-width and uses the same separator placement. */
    .hero-side .skill-line--natural {
      justify-content: flex-start;
      gap: 8px;
    }

    .hero-side .skill-item {
      display: inline-block;
      flex: 0 0 auto;
      font-weight: 700;
      text-align: left;
      letter-spacing: -0.012em;
      color: #000 !important;
    }

    .hero-side .skill-sep {
      display: inline-block;
      flex: 0 0 auto;
      margin: 0;
      font-size: .72em;
      line-height: 1;
      font-weight: 600;
      color: #000 !important;
      opacity: .58;
      transform: translateY(-0.03em);
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
        gap: 4px;
      }

      .hero-side .skill-line,
      .hero-side .skill-line--full,
      .hero-side .skill-line--natural {
        justify-content: flex-start;
        flex-wrap: wrap;
        white-space: normal;
        gap: 3px 7px;
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

      const renderLine = (line, isFull) => `
        <div class="skill-line ${isFull ? 'skill-line--full' : 'skill-line--natural'}">
          ${line.map((skill, index) => `
            <span class="skill-item">${skill}</span>
            ${index < line.length - 1 ? '<span class="skill-sep" aria-hidden="true">·</span>' : ''}
          `).join('')}
        </div>
      `;

      dd.innerHTML = `
        <div class="skill-lines">
          ${lines.map((line, index) => renderLine(line, index === 0)).join('')}
        </div>
      `;
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
