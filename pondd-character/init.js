/* Load the Easter egg on demand; the page content works without WebGL or JavaScript. */
for (const section of document.querySelectorAll('[data-pondd-character]')) {
  const host = section.querySelector('.pondd-character-stage');
  const pause = section.querySelector('.pondd-character-pause');
  const hint = section.querySelector('.pondd-character-hint');
  const lines = JSON.parse(section.querySelector('.pondd-character-lines').textContent);
  const th = section.dataset.characterLocale === 'th';
  const labels = th ? {
    hint: 'แตะตัวผมหรือกด Enter เพื่อเปลี่ยนท่าเต้น',
    still: 'แตะหรือกด Enter เพื่อเปลี่ยนท่า เปิดโหมดลดการเคลื่อนไหวอยู่',
    fallback: 'เบราว์เซอร์นี้แสดงภาพ 3 มิติไม่ได้ แตะเพื่ออ่านข้อความทักทายจาก Pondd',
    greet: 'อ่านข้อความทักทายจาก Pondd', pause: 'หยุดเต้นชั่วคราว', resume: 'เต้นต่อ'
  } : {
    hint: 'Tap the character or press Enter to change the dance.',
    still: 'Tap or press Enter to change the pose. Reduced motion is on.',
    fallback: '3D is unavailable in this browser. Tap for a greeting from Pondd.',
    greet: 'Read a greeting from Pondd', pause: 'Pause dancing', resume: 'Resume dancing'
  };
  let api, pending, visible = false, paused = false;
  async function load() {
    if (pending) return pending;
    host.setAttribute('aria-busy', 'true');
    pending = import('./character.js').then(module => module.show(host, lines)).then(result => {
      api = result; api.enter(); api.setActive(visible && !document.hidden);
      const preference = matchMedia('(prefers-reduced-motion: reduce)');
      const updateControls = () => {
        pause.hidden = preference.matches;
        hint.textContent = preference.matches ? labels.still : labels.hint;
      };
      updateControls();
      preference.addEventListener?.('change', updateControls);
      host.removeAttribute('aria-busy');
      return api;
    }).catch(error => {
      host.removeAttribute('aria-busy'); host.classList.add('unavailable');
      host.setAttribute('aria-label', labels.greet);
      hint.textContent = labels.fallback;
      let taps = 0;
      host.querySelector('.bubble').textContent = lines[0];
      host.addEventListener('click', () => { host.querySelector('.bubble').textContent = lines[++taps % lines.length]; });
      console.info('Pondd character fallback:', error.message);
    });
    return pending;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) load();
      api?.setActive(visible && !document.hidden);
    }, { rootMargin: '120px' }).observe(host);
  } else { visible = true; load(); }
  host.addEventListener('focus', load, { once: true });
  host.addEventListener('click', load, { once: true });
  pause.addEventListener('click', () => {
    paused = !paused; api?.setPaused(paused);
    pause.textContent = paused ? labels.resume : labels.pause;
    pause.setAttribute('aria-pressed', String(paused));
  });
  document.addEventListener('visibilitychange', () => api?.setActive(visible && !document.hidden));
}
