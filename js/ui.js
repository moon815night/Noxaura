/**
 * 动态计算并更新消息气泡 SVG 虚线外框路径及系统美化动态挂载模块
 */
function updateBubbleSVG(wrapper) {
  if (wrapper.classList.contains('image-wrapper') || wrapper.classList.contains('sticker-wrapper')) return;

  const bubble = wrapper.querySelector('.bubble');
  const svg = wrapper.querySelector('.bubble-svg');
  if (!bubble || !svg) return;
  const path = svg.querySelector('path');
  if (!path) return;

  const w = bubble.offsetWidth;
  const h = bubble.offsetHeight;
  const isMe = wrapper.closest('.msg-row').classList.contains('me');

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const r = 12;

  let d = '';
  if (isMe) {
    d = `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - 2} L ${w} ${h} L ${w - 6} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  } else {
    d = `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L 6 ${h} L 0 ${h} L 0 ${h - 2} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  }
  path.setAttribute('d', d);
}

function refreshAllBubbles() {
  document.querySelectorAll('.bubble-wrapper').forEach(updateBubbleSVG);
}

function scrollToBottom(chatContent) {
  chatContent.scrollTop = chatContent.scrollHeight;
}

let lastDisplayedDateKey = null;

function checkAndAppendDateDivider(chatContent, dateObj) {
  const date = dateObj || new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateKey = `${year}-${month}-${day}`;

  if (lastDisplayedDateKey !== dateKey) {
    lastDisplayedDateKey = dateKey;
    const divider = document.createElement('div');
    divider.className = 'chat-date-divider';
    divider.innerHTML = `<span>${year}年${month}月${day}日</span>`;
    chatContent.appendChild(divider);
  }
}

function formatMsgTime(dateObj) {
  const date = dateObj || new Date();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 动态应用系统美化与定制样式到页面 DOM
 */
function applySystemStyles() {
  if (!window.SystemState) return;
  const s = window.SystemState.getSettings();

  // 1. 联系人昵称
  const nameEl = document.getElementById('display-contact-name');
  if (nameEl) nameEl.textContent = s.nicknames.opponent || '顾时夜';

  // 2. 动态 CSS 样式节点
  let styleEl = document.getElementById('dynamic-system-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-system-styles';
    document.head.appendChild(styleEl);
  }

  let chatBgCss = '';
  if (s.chatBg.type === 'image' && s.chatBg.image) {
    chatBgCss = `background-image: url('${s.chatBg.image}') !important; background-size: cover !important; background-position: center !important;`;
  } else if (s.chatBg.type === 'gradient') {
    if (s.chatBg.gradientType === 'solid') {
      chatBgCss = `background: ${s.chatBg.color1} !important;`;
    } else if (s.chatBg.gradientType === 'linear') {
      chatBgCss = `background: linear-gradient(180deg, ${s.chatBg.color1} 0%, ${s.chatBg.color2} 100%) !important;`;
    } else {
      chatBgCss = `background: radial-gradient(circle at center, ${s.chatBg.color1} 0%, ${s.chatBg.color2} 100%) !important;`;
    }
  }

  let barBgCss = '';
  if (s.theme.topBottomImg) {
    barBgCss = `background-image: url('${s.theme.topBottomImg}') !important; background-size: cover !important;`;
  } else {
    barBgCss = `background-color: ${s.theme.topBottomBg || '#eef8f0'} !important;`;
  }

  let avatarOpponentCss = s.avatars.opponent ? `background-image: url('${s.avatars.opponent}') !important; background-size: cover !important;` : '';
  let avatarMeCss = s.avatars.me ? `background-image: url('${s.avatars.me}') !important; background-size: cover !important;` : '';

  styleEl.innerHTML = `
    html, body { font-size: ${s.globalFontSize || 14}px; }
    .chat-app { ${chatBgCss} }
    .top-bar, .bottom-bar, .feature-panel, .sticker-panel { ${barBgCss} }
    
    .msg-row.opponent .avatar { ${avatarOpponentCss} }
    .msg-row.me .avatar { ${avatarMeCss} }

    .msg-row.opponent .bubble {
      background-color: ${s.bubbles.opponent.bgColor} !important;
      color: ${s.bubbles.opponent.textColor} !important;
      font-size: ${s.bubbles.opponent.fontSize}px !important;
    }
    .msg-row.opponent .bubble-svg path {
      stroke: ${s.bubbles.opponent.strokeColor} !important;
    }

    .msg-row.me .bubble {
      background-color: ${s.bubbles.me.bgColor} !important;
      color: ${s.bubbles.me.textColor} !important;
      font-size: ${s.bubbles.me.fontSize}px !important;
    }
    .msg-row.me .bubble-svg path {
      stroke: ${s.bubbles.me.strokeColor} !important;
    }

    ${s.bubbles.css || ''}
    ${s.theme.css || ''}
  `;

  refreshAllBubbles();
}

function appendMessage(chatContent, text, isMe = true, timestamp = null, saveToHistory = true) {
  const ts = timestamp || Date.now();
  const dateObj = new Date(ts);
  checkAndAppendDateDivider(chatContent, dateObj);

  const row = document.createElement('div');
  row.className = `msg-row ${isMe ? 'me' : 'opponent'}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';

  const col = document.createElement('div');
  col.className = 'msg-column';

  const wrapper = document.createElement('div');
  wrapper.className = 'bubble-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'bubble-svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svg.appendChild(path);

  wrapper.appendChild(bubble);
  wrapper.appendChild(svg);

  const timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = formatMsgTime(dateObj);

  col.appendChild(wrapper);
  col.appendChild(timeEl);

  row.appendChild(avatar);
  row.appendChild(col);

  chatContent.appendChild(row);
  updateBubbleSVG(wrapper);
  scrollToBottom(chatContent);

  setTimeout(() => { updateBubbleSVG(wrapper); }, 0);

  if (saveToHistory && window.ChatState) {
    window.ChatState.addMessage({ type: 'text', text, isMe, timestamp: ts });
  }
}

function appendImageMessage(chatContent, imgSrc, isMe = true, timestamp = null, saveToHistory = true) {
  const ts = timestamp || Date.now();
  const dateObj = new Date(ts);
  checkAndAppendDateDivider(chatContent, dateObj);

  const row = document.createElement('div');
  row.className = `msg-row ${isMe ? 'me' : 'opponent'}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';

  const col = document.createElement('div');
  col.className = 'msg-column';

  const wrapper = document.createElement('div');
  wrapper.className = 'bubble-wrapper image-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'bubble bubble-image';

  const img = document.createElement('img');
  img.className = 'bubble-image-img';
  img.src = imgSrc;
  img.onload = () => { scrollToBottom(chatContent); };
  img.addEventListener('click', () => {
    const imageOverlay = document.getElementById('image-overlay');
    const imageOverlayImg = document.getElementById('image-overlay-img');
    if (imageOverlay && imageOverlayImg) {
      imageOverlayImg.src = imgSrc;
      imageOverlay.classList.add('show');
    }
  });

  bubble.appendChild(img);
  wrapper.appendChild(bubble);

  const timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = formatMsgTime(dateObj);

  col.appendChild(wrapper);
  col.appendChild(timeEl);

  row.appendChild(avatar);
  row.appendChild(col);

  chatContent.appendChild(row);
  scrollToBottom(chatContent);

  if (saveToHistory && window.ChatState) {
    window.ChatState.addMessage({ type: 'image', src: imgSrc, isMe, timestamp: ts });
  }
}

function appendStickerMessage(chatContent, imgSrc, isMe = true, timestamp = null, saveToHistory = true) {
  const ts = timestamp || Date.now();
  const dateObj = new Date(ts);
  checkAndAppendDateDivider(chatContent, dateObj);

  const row = document.createElement('div');
  row.className = `msg-row ${isMe ? 'me' : 'opponent'}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';

  const col = document.createElement('div');
  col.className = 'msg-column';

  const wrapper = document.createElement('div');
  wrapper.className = 'bubble-wrapper sticker-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'bubble bubble-sticker';

  const img = document.createElement('img');
  img.className = 'sticker-img';
  img.src = imgSrc;
  img.onload = () => { scrollToBottom(chatContent); };

  bubble.appendChild(img);
  wrapper.appendChild(bubble);

  const timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = formatMsgTime(dateObj);

  col.appendChild(wrapper);
  col.appendChild(timeEl);

  row.appendChild(avatar);
  row.appendChild(col);

  chatContent.appendChild(row);
  scrollToBottom(chatContent);

  if (saveToHistory && window.ChatState) {
    window.ChatState.addMessage({ type: 'sticker', src: imgSrc, isMe, timestamp: ts });
  }
}

function loadChatHistoryUI() {
  const chatContent = document.getElementById('chat-content');
  if (!chatContent || !window.ChatState) return;

  chatContent.innerHTML = '';
  lastDisplayedDateKey = null;

  const history = window.ChatState.getHistory();
  history.forEach((msg) => {
    if (msg.type === 'image') {
      appendImageMessage(chatContent, msg.src, msg.isMe, msg.timestamp, false);
    } else if (msg.type === 'sticker') {
      appendStickerMessage(chatContent, msg.src, msg.isMe, msg.timestamp, false);
    } else {
      appendMessage(chatContent, msg.text, msg.isMe, msg.timestamp, false);
    }
  });

  applySystemStyles();
}

function clearChatDisplay() {
  const chatContent = document.getElementById('chat-content');
  if (chatContent) {
    chatContent.innerHTML = '';
  }
  lastDisplayedDateKey = null;
}
