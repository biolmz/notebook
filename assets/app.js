/* ============================================================================
   刘铭哲 · Notebooks —— 站点脚本
   三件事：深色开关、给笔记页的方向标签上色、在首页把 notes.js 里的数据渲染成索引。
   没有依赖，没有构建。
   ========================================================================= */

(function () {
  'use strict';

  /* 别的脚本可能没加载成功，先做安全取值 */
  const SITE_INFO  = (typeof SITE  !== 'undefined' && SITE)  ? SITE  : {};
  const TOPIC_MAP  = (typeof TOPICS !== 'undefined' && TOPICS) ? TOPICS : {};
  const NOTES_LIST = (typeof NOTES !== 'undefined' && Array.isArray(NOTES)) ? NOTES : null;

  const root = document.documentElement;

  /* ---------------------------------------------------------- 深色开关 --- */
  const THEME_KEY = 'mnz-theme';
  const themeBtn = document.querySelector('.theme-btn');

  const currentTheme = () =>
    root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeBtn) themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  applyTheme(currentTheme());            // 首屏防闪已在 <head> 里设过一次，这里只同步按钮状态
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* 隐私模式下写不进去，忽略 */ }
    });
  }

  /* ------------------------------------------------------- 方向 → 颜色 --- */
  const topicVar = (topic) => TOPIC_MAP[topic] || '--ink-3';

  document.querySelectorAll('[data-topic]').forEach((el) => {
    el.style.setProperty('--tc', 'var(' + topicVar(el.dataset.topic) + ')');
  });

  /* 顺手把联系方式的占位替换掉（HTML 里写的是 data-site="email" 这类） */
  document.querySelectorAll('[data-site]').forEach((el) => {
    const key = el.dataset.site;
    const val = SITE_INFO[key];
    if (key === 'email' && val) {
      el.href = 'mailto:' + val;
      if (el.dataset.siteText !== 'keep') el.textContent = val;
    } else if (val) {
      el.href = val;
    } else if (el.hasAttribute('data-hide-empty')) {
      el.remove();
    }
  });

  /* ================================================================ 首页 == */

  const log = document.getElementById('log');
  if (!log) return;

  /* notes.js 没加载成功时，至少说清楚出了什么事，而不是留一个空白页 */
  if (!NOTES_LIST) {
    const box = document.createElement('div');
    box.className = 'empty';
    const msg = document.createElement('p');
    msg.textContent = '笔记列表没能渲染：assets/notes.js 里没读到数据，通常是某一行的结尾少写了一个逗号。' +
                      '按 F12 打开控制台，第一条报错会指出具体行号。';
    box.appendChild(msg);
    log.appendChild(box);
    return;
  }

  const chipsBox = document.getElementById('chips');
  const searchBox = document.getElementById('search');
  const countBox = document.getElementById('count');
  const factsBox = document.getElementById('facts');

  const state = { topic: null, q: '' };
  let firstPaint = true;   // 只有第一次渲染做逐行浮现的动效

  /* --- 小工具 -------------------------------------------------------- */

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'style') node.setAttribute('style', attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach((c) => { if (c) node.appendChild(c); });
    return node;
  }

  const monthDay = (date) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
    return m ? m[2] + '-' + m[3] : (date || '');
  };
  const yearOf = (date) => (date || '').slice(0, 4);
  const dateNum = (date) => Number(String(date || '').replace(/-/g, '')) || 0;

  const noteText = (n) => [
    n.title, n.topic, n.date, n.summary, n.source,
    (n.tags || []).join(' ')
  ].join(' ').toLowerCase();

  /* 排序：新的在前 */
  const sorted = NOTES_LIST.slice().sort((a, b) => dateNum(b.date) - dateNum(a.date));

  /* --- 首屏统计 ------------------------------------------------------ */

  if (factsBox) {
    const topics = new Set(sorted.map((n) => n.topic).filter(Boolean));
    const latest = sorted.length ? sorted[0].date : '—';
    factsBox.hidden = false;
    factsBox.innerHTML = '';
    factsBox.appendChild(el('span', null, [
      el('b', { text: String(sorted.length) }), document.createTextNode(' 篇')
    ]));
    factsBox.appendChild(el('span', null, [
      document.createTextNode('最近更新 '), el('b', { text: latest.replace(/-/g, '/') })
    ]));
    factsBox.appendChild(el('span', null, [
      el('b', { text: String(topics.size) }), document.createTextNode(' 个方向')
    ]));
    if (SITE_INFO.email) {
      factsBox.appendChild(el('a', { href: 'mailto:' + SITE_INFO.email, text: SITE_INFO.email }));
    }
  }

  /* --- 方向筛选条 ---------------------------------------------------- */

  const topicCounts = new Map();
  sorted.forEach((n) => {
    if (!n.topic) return;
    topicCounts.set(n.topic, (topicCounts.get(n.topic) || 0) + 1);
  });

  const orderedTopics = Object.keys(TOPIC_MAP)
    .filter((t) => topicCounts.has(t))
    .concat([...topicCounts.keys()].filter((t) => !(t in TOPIC_MAP)));

  function makeChip(label, count, topic, active) {
    const btn = el('button', {
      class: 'chip',
      type: 'button',
      'aria-pressed': active ? 'true' : 'false'
    }, [
      topic ? el('span', { class: 'dot' }) : null,
      document.createTextNode(label),
      el('span', { class: 'n', text: String(count) })
    ]);
    if (topic) {
      btn.dataset.topic = topic;
      btn.style.setProperty('--tc', 'var(' + topicVar(topic) + ')');
    }
    btn.addEventListener('click', () => {
      state.topic = (topic && state.topic !== topic) ? topic : null;
      render();
    });
    return btn;
  }

  /* 筛选条只建一次，之后只改 aria-pressed —— 每次重建会让键盘焦点丢失 */
  function buildChips() {
    if (!chipsBox) return;
    chipsBox.innerHTML = '';
    chipsBox.appendChild(makeChip('全部', sorted.length, null, true));
    orderedTopics.forEach((t) => {
      chipsBox.appendChild(makeChip(t, topicCounts.get(t), t, false));
    });
  }

  function syncChips() {
    if (!chipsBox) return;
    [...chipsBox.querySelectorAll('.chip')].forEach((chip) => {
      const t = chip.dataset.topic || '';
      const active = t ? state.topic === t : !state.topic;
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* --- 索引本体 ------------------------------------------------------ */

  function renderList() {
    // 首次渲染之后（筛选、搜索）不再重播动效，立刻出结果
    if (!firstPaint) log.classList.add('instant');

    const q = state.q.trim().toLowerCase();    const visible = sorted.filter((n) => {
      if (state.topic && n.topic !== state.topic) return false;
      if (q && noteText(n).indexOf(q) === -1) return false;
      return true;
    });

    log.innerHTML = '';
    if (countBox) {
      countBox.textContent = visible.length === sorted.length
        ? String(sorted.length) + ' 篇'
        : visible.length + ' / ' + sorted.length + ' 篇';
    }
    if (!visible.length) {
      log.appendChild(el('div', { class: 'empty' }, [
        el('p', { text: '没有匹配的笔记。换个关键词，或者点上面的「全部」重新看一遍。' })
      ]));
      return;
    }

    let i = 0;
    let lastYear = null;

    visible.forEach((n) => {
      const year = yearOf(n.date);
      if (year !== lastYear) {
        const head = el('div', { class: 'log-year', text: year + ' 年' });
        head.style.setProperty('--d', Math.min(i * 22, 260) + 'ms');
        log.appendChild(head);
        lastYear = year;
      }

      // 只有第一次渲染才逐行浮现；筛选、搜索时就该立刻出来，别让人等动画
      const delay = firstPaint ? Math.min(i * 22, 300) + 'ms' : '0ms';

      const inner = [
        el('span', { class: 'tick' }),
        el('span', { class: 'gutter' }, [
          el('span', { class: 'date', text: monthDay(n.date) }),
          n.cells ? el('span', { class: 'cells', text: n.cells + ' cells' }) : null
        ]),
        el('span', { class: 'main' }, [
          el('span', { class: 'title', text: n.title }),
          n.summary ? el('span', { class: 'summary', text: n.summary }) : null
        ]),
        el('span', { class: 'meta' }, [
          n.topic ? el('span', { class: 'topic' }, [
            el('i'), document.createTextNode(n.topic)
          ]) : null,
          n.tags && n.tags.length
            ? el('span', { class: 'tags', text: n.tags.join('，') })
            : null,
          n.file ? null : el('span', { class: 'pending', text: '待补' })
        ])
      ];

      let row;
      if (n.file) {
        // 新标签页打开：读笔记时索引还留在原来那一页
        row = el('a', { class: 'row', href: n.file, target: '_blank', rel: 'noopener' }, inner);
      } else {
        row = el('div', { class: 'row is-pending' }, inner);
        row.setAttribute('title', '这篇还没有对应的页面');
      }
      row.style.setProperty('--tc', 'var(' + topicVar(n.topic) + ')');
      row.style.setProperty('--d', delay);
      log.appendChild(row);
      i += 1;
    });

    firstPaint = false;
  }

  function render() {
    syncChips();
    renderList();
  }

  /* --- 搜索 ---------------------------------------------------------- */

  if (searchBox) {
    searchBox.addEventListener('input', () => {
      state.q = searchBox.value;
      render();
    });
    searchBox.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { searchBox.value = ''; state.q = ''; render(); searchBox.blur(); }
    });
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        searchBox.focus();
      }
    });
  }

  buildChips();
  render();
})();