/* Progressive enhancement: every app and both links work without JavaScript. */
(() => {
  const directory = document.querySelector('#apps');
  if (!directory) return;
  const controls = directory.querySelector('.app-controls');
  const search = directory.querySelector('#app-search');
  const filters = [...directory.querySelectorAll('.app-filter')];
  const cards = [...directory.querySelectorAll('.app-card')];
  const count = directory.querySelector('#app-count');
  const empty = directory.querySelector('.app-empty');
  let group = 'all';
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().trim();

  function update() {
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach(card => {
      const matches = (group === 'all' || card.dataset.group === group)
        && words.every(word => normalize(card.dataset.search).includes(word));
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    count.textContent = visible === cards.length
      ? `${cards.length} released apps`
      : `${visible} of ${cards.length} apps`;
    empty.hidden = visible !== 0;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === group)));
  }

  search.addEventListener('input', update);
  search.addEventListener('search', update);
  filters.forEach(button => button.addEventListener('click', () => {
    group = button.dataset.filter;
    update();
  }));
  directory.querySelector('.app-clear').addEventListener('click', () => {
    search.value = '';
    group = 'all';
    update();
    search.focus();
  });
  controls.hidden = false;
  update();
})();
