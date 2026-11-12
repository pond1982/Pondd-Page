/* Optional real-browser QA. Run `npx playwright install chromium` first.
 * Pass BASE_URL for a preview under the /Pondd-Page/ project path.
 * This checks the added directory, not legacy CV accessibility issues.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-results');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.env.BASE_URL || `file://${root}/index.html`;
  await page.goto(base);
  assert.equal(await page.locator('.app-card:visible').count(), 22);
  const results = [];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('#apps-title').scrollIntoViewIfNeeded();
    const outside = await page.locator('#apps').evaluate(section => [...section.querySelectorAll('*')].filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width && (rect.left < -1 || rect.right > innerWidth + 1);
    }).map(el => el.outerHTML.slice(0, 140)));
    assert.deepEqual(outside, [], `directory overflow at ${width}px`);
    await page.screenshot({ path: path.join(output, `directory-${width}.png`) });
    results.push({ width, overflow: false });
  }
  await page.locator('#app-search').fill('morse');
  assert.equal(await page.locator('.app-card:visible').count(), 1);
  await page.getByRole('button', { name: 'Games', exact: true }).click();
  assert.equal(await page.locator('.app-card:visible').count(), 0);
  await page.getByRole('button', { name: 'Show all projects' }).click();
  assert.equal(await page.locator('.app-card:visible').count(), 22);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'app-search');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'All projects');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.app-card:visible').count(), 11);
  await page.getByRole('button', { name: 'All projects', exact: true }).click();
  await page.getByRole('button', { name: 'Web tools', exact: true }).click();
  assert.equal(await page.locator('.app-card:visible').count(), 1);
  assert.equal(await page.getByRole('link', { name: 'Open Screenshot Studio web tool' }).getAttribute('href'), 'https://pond1982.github.io/screenshot-studio/');
  await page.locator('#app-search').fill('morse');
  assert.equal(await page.locator('.app-card:visible').count(), 0);
  await page.getByRole('button', { name: 'Show all projects' }).click();
  assert.equal(await page.locator('.app-card:visible').count(), 22);
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  for (const theme of ['dark', 'light']) {
    await page.evaluate(theme => applyTweaks({ theme, accent: 'terracotta', density: 'airy' }), theme);
    const result = await page.evaluate(async () => axe.run('#apps', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }));
    fs.writeFileSync(path.join(output, `axe-${theme}.json`), JSON.stringify(result, null, 2));
    assert.deepEqual(result.violations.map(v => v.id), [], `${theme} accessibility`);
  }
  assert.deepEqual(errors, []);
  const noJS = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJS.goto(base);
  assert.equal(await noJS.locator('.app-card').count(), 22);
  assert.equal(await noJS.locator('.app-controls:visible').count(), 0);
  fs.writeFileSync(path.join(output, 'browser-results.json'), JSON.stringify({ results, errors, noJavaScript: 'passed' }, null, 2));
  await browser.close();
  console.log('Browser checks passed. Screenshots and axe reports: test-results/');
})().catch(error => { console.error(error); process.exit(1); });
