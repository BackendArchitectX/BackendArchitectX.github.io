(() => {
  const loadStylesheet = (href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };

  loadStylesheet('/readability.css?v=20260911c');
  loadStylesheet('/uniform.css?v=20260911c');

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
