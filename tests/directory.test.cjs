const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'assets/app-directory.js'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/apps.json')));
function setup(enhance = true) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://pond1982.github.io/Pondd-Page/' });
  if (enhance) dom.window.eval(script);
  const doc = dom.window.document;
  return { dom, doc, search: doc.querySelector('#app-search'), visible: () => [...doc.querySelectorAll('.app-card')].filter(c => !c.hidden) };
}
function search(s, value) {
  s.search.value = value;
  s.search.dispatchEvent(new s.dom.window.Event('input', { bubbles: true }));
}

test('without JavaScript all 21 apps, 1 web tool and their 43 links are available', () => {
  const s = setup(false);
  assert.equal(s.visible().length, 22);
  assert.equal(s.doc.querySelectorAll('.app-links a').length, 43);
  assert.ok(s.doc.querySelector('.app-controls').hidden);
});
test('filters are repeatable and match official Games classifications', () => {
  const s = setup();
  for (const group of ['games', 'apps', 'web', 'web', 'games', 'all', 'all']) {
    s.doc.querySelector(`[data-filter="${group}"]`).click();
    assert.equal(s.visible().length, group === 'all' ? 22 : [...data.apps, ...data.webTools].filter(a => a.group === group).length);
    assert.equal(s.doc.querySelectorAll('.app-filter[aria-pressed="true"]').length, 1);
  }
});
test('search supports case, whitespace, word combinations and Thai/English names', () => {
  const s = setup();
  for (const [term, count] of [['  MORSE  ', 1], ['golf putt', 1], ['ReadSlip', 1], ['อ่านสลิป', 1], ['Screenshot Studio', 1], ['screenshot maker', 1], ['   ', 22]]) {
    search(s, term);
    assert.equal(s.visible().length, count, term);
  }
});
test('search and filter combine; empty state resets everything and returns focus', () => {
  const s = setup();
  s.doc.querySelector('[data-filter="games"]').click();
  search(s, 'BuddhaBits');
  assert.equal(s.visible().length, 0);
  assert.equal(s.doc.querySelector('#app-count').textContent, '0 of 22 projects');
  assert.ok(!s.doc.querySelector('.app-empty').hidden);
  s.doc.querySelector('.app-clear').click();
  assert.equal(s.visible().length, 22);
  assert.equal(s.search.value, '');
  assert.equal(s.doc.activeElement, s.search);
  assert.ok(s.doc.querySelector('.app-empty').hidden);
});
test('links retain exact destinations, descriptive accessible names and same-tab navigation', () => {
  const s = setup();
  for (const app of data.apps) {
    const article = s.doc.querySelector(`[aria-labelledby="app-${app.appStoreId}"]`);
    const [website, store] = article.querySelectorAll('a');
    assert.equal(website.href, app.websiteUrl);
    assert.equal(store.href, app.appStoreUrl);
    assert.ok(website.getAttribute('aria-label').includes(app.name));
    assert.ok(store.getAttribute('aria-label').includes(app.name));
    assert.equal(website.target, '');
  }
});
test('new control labels, live result status and keyboard focus targets are present', () => {
  const s = setup();
  assert.equal(s.doc.querySelector('label[for="app-search"]').textContent, 'Find an app or tool');
  assert.equal(s.doc.querySelector('#app-count').getAttribute('aria-live'), 'polite');
  assert.equal(s.doc.querySelector('#apps').getAttribute('aria-labelledby'), 'apps-title');
  for (const button of s.doc.querySelectorAll('#apps button')) assert.equal(button.type, 'button');
  for (const image of s.doc.querySelectorAll('.app-icon')) assert.equal(image.alt, '');
});

test('Screenshot Studio is a web tool with its own link, filter and correct counts', () => {
  const s = setup();
  const article = s.doc.querySelector('[aria-labelledby="app-screenshot-studio"]');
  const links = article.querySelectorAll('a');
  assert.equal(links.length, 1);
  assert.equal(links[0].href, data.webTools[0].websiteUrl);
  assert.equal(links[0].getAttribute('aria-label'), 'Open Screenshot Studio web tool');
  assert.match(links[0].textContent, /Open web tool/);
  assert.match(article.querySelector('.app-meta').textContent, /Free web tool/);
  assert.equal(s.doc.querySelector('#app-count').textContent, '21 App Store apps · 1 web tool');
  s.doc.querySelector('[data-filter="web"]').click();
  assert.equal(s.visible().length, 1);
  assert.equal(s.doc.querySelector('#app-count').textContent, '1 of 22 projects');
  search(s, 'morse');
  assert.equal(s.visible().length, 0);
  s.doc.querySelector('.app-clear').click();
  assert.equal(s.visible().length, 22);
  search(s, 'screenshot');
  assert.equal(s.visible().length, 1);
  assert.equal(s.visible()[0].dataset.group, 'web');
});
