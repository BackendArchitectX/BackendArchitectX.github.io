(() => {
  const readability = document.createElement('link');
  readability.rel = 'stylesheet';
  readability.href = '/readability.css';
  document.head.appendChild(readability);

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
