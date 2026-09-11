(() => {
  const loadStylesheet = (href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };

  loadStylesheet('/readability.css?v=20260911d');
  loadStylesheet('/uniform.css?v=20260911d');

  const footerMeta = document.querySelector('.footer-inner > span:last-child');
  if (footerMeta && footerMeta.textContent.includes('Static site')) {
    footerMeta.remove();
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
