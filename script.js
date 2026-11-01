'use strict';
document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Переклад рядків скрипту: словник TI_I18N вставляє build-langs.cjs у мовні сторінки (en/, de/ …) */
const I18N = window.TI_I18N || {};
const t = s => I18N[s] || s;

/* Іконки Lucide з icons.js */
function paintIcons(root = document) {
  root.querySelectorAll('svg[data-icon]').forEach(svg => {
    const name = svg.dataset.icon;
    if (!ICONS[name] || svg.dataset.painted === name) return;
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = ICONS[name];
    svg.dataset.painted = name;
  });
}

/* Тема: світла / темна / системна */
const themeButtons = document.querySelectorAll('[data-set-theme]');
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setTheme === theme)));
  try { localStorage.setItem('ti-theme', theme); } catch (e) {}
}
themeButtons.forEach(b => b.addEventListener('click', () => setTheme(b.dataset.setTheme)));
setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

/* Режими — назви, кольори й іконки як у віджеті; приклади з навчання програми */
const MODES = [
  { id: 'dictation', name: t('Голосове введення'), icon: 'audio-lines', color: '#4a91ee', key: 'Right Alt',
    desc: t('Перетворює мовлення на текст без додаткового редагування.'),
    said: t('Треба купити молоко, хліб і яблука. Магазин біля дому закривається о дев’ятій.'),
    got: t('Треба купити молоко, хліб і яблука. Магазин біля дому закривається о дев’ятій.') },
  { id: 'live', name: t('Миттєве диктування'), icon: 'zap', color: '#e8b339', key: t('Не призначено'),
    desc: t('Вставляє текст просто під час диктування, без адаптації.'),
    said: t('Пишу звіт за жовтень, перший розділ про продажі…'),
    got: t('Пишу звіт за жовтень, перший розділ про продажі…') },
  { id: 'polish', name: t('Виправлення'), icon: 'sparkles', color: '#ac86e9', key: 'Ctrl + Alt + 2',
    desc: t('Очищає усне мовлення від затинань і зайвих повторів, зберігаючи зміст і тон.'),
    said: t('Я, е-е, надішлю тобі кошторис завтра, ні, у п’ятницю. Треба ще, ще перевірити цифри.'),
    got: t('Я надішлю тобі кошторис у п’ятницю. Треба ще перевірити цифри.') },
  { id: 'formal', name: t('Діловий'), icon: 'briefcase-business', color: '#5b9cba', key: 'Ctrl + Alt + 3',
    desc: t('Переписує текст у чіткому діловому тоні, зберігаючи факти й намір.'),
    said: t('Я не встигаю глянути кошторис сьогодні. Давайте перенесемо обговорення на п’ятницю.'),
    got: t('Я не встигаю переглянути кошторис сьогодні. Пропоную перенести обговорення на п’ятницю.') },
  { id: 'natural', name: t('Дружній тон'), icon: 'messages-square', color: '#90bf6b', key: 'Ctrl + Alt + 4',
    desc: t('Робить формулювання простішими й дружнішими, зберігаючи зміст.'),
    said: t('Прошу повідомити, чи матимете ви можливість переглянути кошторис до п’ятниці.'),
    got: t('Підкажіть, будь ласка, чи зможете переглянути кошторис до п’ятниці.') },
  { id: 'literary', name: t('Літературний'), icon: 'book-open', color: '#b58ad4', key: t('Не призначено'),
    desc: t('Надає тексту літературних формулювань, зберігаючи зміст і тон.'),
    said: t('Ну короче вчора ми ходили в парк, і там було так класно, листя таке жовте всюди.'),
    got: t('Учора ми гуляли в парку. Там було чудово: усюди лежало жовте листя.') },
  { id: 'summary', name: t('Без води'), icon: 'list-filter', color: '#d59c53', key: t('Не призначено'),
    desc: t('Прибирає воду й повторення думок, зберігає суттєві деталі.'),
    said: t('Значить, по зустрічі… ми там довго говорили, але, загалом, вирішили, що запуск переносимо на десяте листопада, бо дизайн ще не готовий, ну і Оля відповідає за тексти.'),
    got: t('Запуск перенесено на 10 листопада: дизайн ще не готовий. За тексти відповідає Оля.') },
  { id: 'translation', name: t('Переклад'), icon: 'languages', color: '#e8a12f', key: 'Right Alt + Right Shift',
    desc: t('Перекладає текст обраною мовою, зберігаючи зміст і тон.'),
    said: t('Я не зможу приєднатися о третій. Можемо поговорити приблизно через пів години?'),
    got: t('I won’t be able to join at three. Could we talk in about half an hour?') },
  { id: 'prompt', name: t('Створення промпту'), icon: 'wand-sparkles', color: '#b47bdc', key: 'Ctrl + Alt + 5',
    desc: t('Структурує твоє завдання як запит для ШІ, не виконуючи його.'),
    said: t('Хочу підтягнути англійську для робочих зустрічей. У мене B1 і двадцять хвилин на день. Склади план на чотири тижні, таблицею.'),
    got: t('Склади план вивчення англійської на 4 тижні для участі в робочих зустрічах.\n\nКонтекст: мій рівень — B1; маю 20 хвилин на день.\nФормат результату: таблиця.') },
  { id: 'email', name: t('Електронний лист'), icon: 'mail', color: '#6597c9', key: 'Ctrl + Alt + 7',
    desc: t('Оформлює диктування як лист із привітанням, абзацами й підписом.'),
    said: t('Лист Олені. Попроси надіслати оновлений кошторис до п’ятниці. Мені потрібно погодити його з командою.'),
    got: t('Добрий день, Олено!\n\nБудь ласка, надішліть оновлений кошторис до п’ятниці. Мені потрібно погодити його з командою.\n\nЗ повагою,\n[Ваше ім’я]') },
  { id: 'selection', name: t('Редагування'), icon: 'text-cursor-input', color: '#6597c9', key: 'Ctrl + Alt + E',
    desc: t('Переробляє виділений текст за голосовою командою і копіює результат у буфер обміну.'),
    said: t('«Скороти, але збережи всі дати»'),
    gotLabel: t('У буфері обміну'),
    got: t('Скорочений варіант із тими самими датами. Встав його через Ctrl\u00a0+\u00a0V там, де він потрібен.') }
];

const list = document.getElementById('mode-list');
const panel = document.getElementById('mode-panel');
MODES.forEach((m, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.role = 'tab';
  b.id = 'tab-' + m.id;
  b.setAttribute('aria-controls', 'mode-panel');
  b.setAttribute('aria-selected', 'false');
  b.tabIndex = -1;
  b.style.setProperty('--i', i);
  // Звідки «прилітає» чіп під час прокрутки
  const a = (i / MODES.length) * Math.PI * 2;
  b.style.setProperty('--dx', Math.round(Math.cos(a) * 260 * Math.min(1, innerWidth / 1100)) + 'px');
  b.style.setProperty('--dy', Math.round(Math.sin(a) * 160 + 120) + 'px');
  b.style.setProperty('--dr', ((i % 2 ? 1 : -1) * (8 + i * 2)) + 'deg');
  b.innerHTML = `<span class="gi" style="--c:${m.color}"><svg data-icon="${m.icon}"></svg></span>${m.name}`;
  b.addEventListener('click', () => selectMode(i, true));
  list.append(b);
});
list.addEventListener('keydown', e => {
  const cur = MODES.findIndex(m => document.getElementById('tab-' + m.id).getAttribute('aria-selected') === 'true');
  let next = null;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (cur + 1) % MODES.length;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (cur - 1 + MODES.length) % MODES.length;
  if (e.key === 'Home') next = 0;
  if (e.key === 'End') next = MODES.length - 1;
  if (next !== null) { e.preventDefault(); selectMode(next, true); document.getElementById('tab-' + MODES[next].id).focus(); }
});

let autoTimer = null;
function selectMode(i, byUser) {
  const m = MODES[i];
  document.querySelectorAll('.chip').forEach((c, j) => { c.setAttribute('aria-selected', String(j === i)); c.tabIndex = j === i ? 0 : -1; });
  panel.setAttribute('aria-labelledby', 'tab-' + m.id);
  panel.style.setProperty('--c', m.color);
  const icon = document.getElementById('mp-icon');
  icon.dataset.icon = m.icon; delete icon.dataset.painted;
  icon.parentElement.className = 'mp-icon gi';
  icon.parentElement.style.setProperty('--c', m.color);
  document.getElementById('mp-name').textContent = m.name;
  document.getElementById('mp-desc').textContent = m.desc;
  document.getElementById('mp-said').textContent = m.said;
  document.getElementById('mp-got').textContent = m.got;
  document.getElementById('mp-got-label').textContent = m.gotLabel || t('У полі з’явилося');
  paintIcons(panel);
  const body = panel.querySelector('.mp-body');
  body.classList.remove('mp-swap'); void body.offsetWidth; body.classList.add('mp-swap');
  if (byUser) clearInterval(autoTimer);
}
selectMode(2, false);

/* Напівпрозорі іконки з паралаксом */
const glass = document.getElementById('icon-glass');
MODES.forEach((m, i) => {
  const s = document.createElement('span');
  s.className = 'gi';
  s.style.setProperty('--c', m.color);
  s.style.setProperty('--par', ((i % 3) - 1) * 60 + (i % 2 ? 30 : -30) + 'px');
  s.innerHTML = `<svg data-icon="${m.icon}"></svg>`;
  glass.append(s);
});

paintIcons();

/* Прогрес прокрутки секції: 0 — верх секції біля верху екрана, 1 — кінець */
function progress(el) {
  const r = el.getBoundingClientRect();
  const total = r.height - innerHeight;
  return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : (r.top < innerHeight / 2 ? 1 : 0);
}

/* Сцена «голос → текст» */
// Слова в [дужках] — запинки й повтори, які викреслюються
const SPOKEN = t('Я, [е-е,] надішлю тобі кошторис [завтра,] [ні,] у п’ятницю. Треба ще, [ще,] перевірити цифри. Можливо, сума трохи зміниться.');
const speech = document.getElementById('speech');
const words = SPOKEN.split(' ').map((w, i) => {
  const s = document.createElement('span');
  const junk = /^\[.*\]$/.test(w);
  s.className = 'w' + (junk ? ' junk' : '');
  s.textContent = junk ? w.slice(1, -1) : w;
  s.style.setProperty('--fx', ((i % 2 ? 1 : -1) * (30 + i * 4)) + 'px');
  s.style.setProperty('--fr', ((i % 2 ? 1 : -1) * 18) + 'deg');
  speech.append(s, document.createTextNode(' '));
  return s;
});
const scene = document.getElementById('scene');
const result = document.getElementById('result');
const sceneWidget = scene.querySelector('.scene-widget');
const steps = scene.querySelectorAll('.scene-steps li');
function renderScene(p) {
  const shown = Math.floor(Math.min(1, p / .38) * words.length);
  words.forEach((w, i) => {
    w.classList.toggle('in', i < shown);
    w.classList.toggle('strike', p > .44);
    w.classList.toggle('gone', p > .54);
  });
  speech.classList.toggle('fade', p > .66);
  result.classList.toggle('in', p > .7);
  const done = p > .66;
  sceneWidget.dataset.state = done ? 'done' : 'recording';
  sceneWidget.querySelector('.w-name').textContent = done ? t('Готово') : MODES.find(m => m.id === 'polish').name;
  const rec = sceneWidget.querySelector('.w-rec svg');
  if (rec.dataset.icon !== (done ? 'mic' : 'arrow-up')) { rec.dataset.icon = done ? 'mic' : 'arrow-up'; delete rec.dataset.painted; paintIcons(sceneWidget); }
  const step = p < .4 ? 0 : p < .66 ? 1 : 2;
  steps.forEach((li, i) => li.classList.toggle('on', i === step));
}
sceneWidget.querySelector('.w-rec svg').dataset.icon = 'arrow-up';

/* Редагування виділеного */
const editStage = document.getElementById('edit-stage');
function renderEdit(phase) {
  // p1 виділення, p2 голосова команда, p3 «Результат скопійовано», p4 вставлено через Ctrl + V
  editStage.classList.toggle('p1', phase >= 1);
  editStage.classList.toggle('p2', phase === 2);
  editStage.classList.toggle('p3', phase === 3);
  editStage.classList.toggle('p4', phase >= 4);
}
// Коли сцена у полі зору: виділення → команда голосом → копія в буфер → вставлення, потім повтор
let editTimer = null;
function playEdit() {
  const seq = [[1, 900], [2, 1600], [3, 1900], [4, 3400], [0, 900]];
  let k = 0;
  const step = () => { renderEdit(seq[k][0]); editTimer = setTimeout(step, seq[k][1]); k = (k + 1) % seq.length; };
  step();
}
if (reduce) renderEdit(4);
else new IntersectionObserver(([e]) => {
  clearTimeout(editTimer);
  if (e.isIntersecting) playEdit(); else renderEdit(0);
}, { threshold: .5 }).observe(editStage);

/* Головний екран і шапка */
const hero = document.getElementById('hero');
const topBar = document.getElementById('top');
let lastY = scrollY;
function onScroll() {
  const y = scrollY;
  if (!reduce) hero.style.setProperty('--hero-p', Math.min(1, y / innerHeight).toFixed(3));
  // Ховаємо шапку лише після помітного руху, щоб дрібні поштовхи тачпада її не смикали.
  if (y < innerHeight * .8) topBar.classList.remove('is-hidden');
  else if (Math.abs(y - lastY) > 12) topBar.classList.toggle('is-hidden', y > lastY);
  if (Math.abs(y - lastY) > 12 || y < innerHeight * .8) lastY = y;
  renderScene(reduce ? 1 : progress(scene));
  if (!reduce) {
    const gr = glass.getBoundingClientRect();
    glass.style.setProperty('--p', Math.min(1, Math.max(0, (innerHeight - gr.top) / (innerHeight + gr.height))).toFixed(3));
  }
}
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

/* Поява блоків і «переліт» чипів режимів */
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add(e.target === list ? 'landed' : 'shown');
  io.unobserve(e.target);
}), { threshold: .2 });
if (reduce) { list.classList.add('landed'); document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('shown')); }
else { io.observe(list); document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el)); }

/* Вигляд віджета у спокої */
const SIZE_NOTES = {
  mini: t('Міні: тонка смужка, яка не заважає. Наведи курсор — вона підросте.'),
  compact: t('Компакт: невелика капсула з кнопкою режиму й мікрофоном.'),
  large: t('Великий: режим, назва й кнопка запису в одній капсулі.'),
  auto: t('Авто: тонка смужка у спокої, капсула при наведенні, а після затримки — повний віджет.')
};
const liveWidget = document.querySelector('.live-widget');
const sizeNote = document.getElementById('size-note');
let autoSizeTimer = null;
document.querySelectorAll('[data-size]').forEach(b => {
  if (b.tagName !== 'BUTTON') return;
  b.addEventListener('click', () => {
    document.querySelectorAll('.size-switch button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    sizeNote.textContent = SIZE_NOTES[b.dataset.size];
    clearTimeout(autoSizeTimer);
    if (b.dataset.size === 'auto') {
      // Показуємо цикл «Авто»: смужка → капсула → повний вигляд
      liveWidget.dataset.size = 'mini';
      autoSizeTimer = setTimeout(() => { liveWidget.dataset.size = 'compact';
        autoSizeTimer = setTimeout(() => { liveWidget.dataset.size = 'large'; }, 1000); }, 900);
    } else liveWidget.dataset.size = b.dataset.size;
  });
});

/* Рядки вікна «Режими» */
const asList = document.getElementById('as-list');
['live', 'dictation', 'polish', 'literary', 'formal', 'natural'].forEach(id => {
  const m = MODES.find(x => x.id === id);
  const row = document.createElement('div');
  row.className = 'as-row';
  row.innerHTML = `<span class="grip"><svg data-icon="grip-vertical"></svg></span><span class="mi" style="color:${m.color}"><svg data-icon="${m.icon}"></svg></span><span>${m.name}</span><span class="as-keys"><span>${m.key}</span><span>${t('Натискання')}</span></span><span class="toggle" aria-checked="true"></span>`;
  asList.append(row);
});
paintIcons(asList);
paintIcons(document.querySelector('.sizes'));

/* Кнопка завантаження: інсталятор з останнього релізу; без відповіді GitHub — сторінка релізу */
fetch('https://api.github.com/repos/AndriyGusak/ThinkInk/releases/latest')
  .then(r => r.ok ? r.json() : null)
  .then(rel => {
    const exe = rel && (rel.assets || []).find(a => /-Setup\.exe$/i.test(a.name));
    if (!exe) return;
    const version = String(rel.tag_name || '').replace(/^v/, '');
    document.querySelectorAll('a[data-download]').forEach(a => {
      a.href = exe.browser_download_url;
      if (version) a.title = t('Інсталятор ThinkInk {v} для Windows').replace('{v}', version);
    });
  })
  .catch(() => {});

/* Часті питання: посилання #faq-… розгортає потрібне питання */
function openFaqFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const q = document.getElementById(id)?.closest('details.faq-q');
  if (!q) return;
  q.open = true;
  requestAnimationFrame(() => q.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }));
}
addEventListener('hashchange', openFaqFromHash);
openFaqFromHash();

/* Мова сайту: меню закривається кліком поза ним або Escape; вибір запам’ятовується */
const langMenu = document.querySelector('[data-lang-menu]');
if (langMenu) {
  document.addEventListener('click', e => { if (!langMenu.contains(e.target)) langMenu.open = false; });
  langMenu.addEventListener('keydown', e => { if (e.key === 'Escape' && langMenu.open) { langMenu.open = false; langMenu.querySelector('summary').focus(); } });
  langMenu.querySelectorAll('a[data-lang]').forEach(a => a.addEventListener('click', () => {
    try { localStorage.setItem('ti-lang', a.dataset.lang); } catch (e) {}
  }));
}
