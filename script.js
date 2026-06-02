document.addEventListener('DOMContentLoaded', () => {
  const fadeElements = document.querySelectorAll('.fade-in-up');

  if (!('IntersectionObserver' in window)) {
    fadeElements.forEach(el => el.classList.add('visible'));
    setupTokutsumiOmikuji();
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observerInstance.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach(el => observer.observe(el));

  setupTokutsumiOmikuji();
});

function setupTokutsumiOmikuji() {
  const app = document.querySelector('[data-omikuji-app]');

  if (!app) {
    return;
  }

  const storageKey = 'orochi_tokutsumi_omikuji';
  const fortunes = ['大吉', '中吉', '吉', '小吉', '末吉'];
  const actionData = {
    '整える運': {
      actions: [
        '玄関の靴をそろえる',
        '机の上を1分だけ片付ける',
        '財布のレシートを出す',
        'スマホ画面を拭く',
        '今日一番大事なことを1つ決める'
      ],
      comment: '小さく整える者に、運は寄ってくるぞ。'
    },
    '清める運': {
      actions: [
        '玄関を軽く掃く',
        'トイレを1分だけ掃除する',
        '洗面台の水はねを拭く',
        '鏡を拭く',
        'いらない紙を1枚捨てる'
      ],
      comment: '清めた場所に、よい流れは入りやすいぞ。'
    },
    '感謝の運': {
      actions: [
        'ありがとうを1回多く言う',
        '店員さんに丁寧にお礼を言う',
        '家族や身近な人に一言ねぎらう',
        '今日助かったことを1つ思い出す',
        '寝る前に今日もありがとうと心で言う'
      ],
      comment: '感謝を忘れぬ者は、ご縁に恵まれるぞ。'
    },
    '巡らせる運': {
      actions: [
        '朝起きたらカーテンを開ける',
        '朝に水か白湯を一杯飲む',
        '深呼吸を3回する',
        '近所を5分だけ歩く',
        '窓を開けて空気を入れ替える'
      ],
      comment: '体と空気を巡らせれば、気分も変わるぞ。'
    },
    '挑戦の運': {
      actions: [
        'AIにひとつ質問してみる',
        '下書きを1本書く',
        '気になっていたことを5分だけ調べる',
        'やりたいことを1行だけメモする',
        '小さな発信を1つ投稿する'
      ],
      comment: '小さな挑戦が、明日の道を開くぞ。'
    }
  };

  const topScreen = app.querySelector('[data-omikuji-top]');
  const resultScreen = app.querySelector('[data-omikuji-result]');
  const drawButton = app.querySelector('[data-omikuji-draw]');
  const fortuneText = app.querySelector('[data-omikuji-fortune]');
  const categoryText = app.querySelector('[data-omikuji-category]');
  const actionText = app.querySelector('[data-omikuji-action]');
  const commentText = app.querySelector('[data-omikuji-comment]');

  const today = getTodayKey();
  const storedState = readStoredState(storageKey);

  if (storedState.date === today && hasTodayResult(storedState)) {
    showResult(storedState);
  }

  drawButton.addEventListener('click', () => {
    const latestState = readStoredState(storageKey);

    if (latestState.date === today && hasTodayResult(latestState)) {
      showResult(latestState);
      return;
    }

    const result = createResult(today, fortunes, actionData);
    const nextState = {
      date: today,
      fortune: result.fortune,
      category: result.category,
      action: result.action,
      comment: result.comment
    };

    saveStoredState(storageKey, nextState);
    showResult(nextState, true);
  });

  function showResult(state, shouldScroll) {
    topScreen.hidden = true;
    resultScreen.hidden = false;
    fortuneText.textContent = state.fortune;
    categoryText.textContent = state.category;
    actionText.textContent = state.action;
    commentText.textContent = state.comment;

    if (shouldScroll) {
      requestAnimationFrame(() => {
        app.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }
}

function createResult(date, fortunes, actionData) {
  const categories = Object.keys(actionData);
  const category = pickRandom(categories);
  const categoryData = actionData[category];

  return {
    date,
    fortune: pickRandom(fortunes),
    category,
    action: pickRandom(categoryData.actions),
    comment: categoryData.comment
  };
}

function hasTodayResult(state) {
  return Boolean(state.date && state.fortune && state.category && state.action && state.comment);
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function readStoredState(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsedState = raw ? JSON.parse(raw) : {};
    const normalizedState = normalizeStoredState(parsedState);

    if (raw && JSON.stringify(parsedState) !== JSON.stringify(normalizedState)) {
      saveStoredState(storageKey, normalizedState);
    }

    return normalizedState;
  } catch {
    return {};
  }
}

function saveStoredState(storageKey, state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // localStorage can be blocked in some browser privacy modes.
  }
}

function normalizeStoredState(state) {
  if (state.result) {
    return {
      date: state.lastDrawDate || state.result.date,
      fortune: state.result.fortune,
      category: state.result.category,
      action: state.result.action,
      comment: state.result.comment
    };
  }

  if (state.lastDrawDate && state.fortune) {
    return {
      date: state.lastDrawDate,
      fortune: state.fortune,
      category: state.category,
      action: state.action,
      comment: state.comment
    };
  }

  return {
    date: state.date,
    fortune: state.fortune,
    category: state.category,
    action: state.action,
    comment: state.comment
  };
}
