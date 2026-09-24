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
 * 自动滚动至原话并高亮 2 秒
 */
function highlightOriginalMessage(msgId) {
  if (!msgId) return;
  const targetRow = document.querySelector(`.msg-row[data-msg-id="${msgId}"]`);
  if (!targetRow) return;

  targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  targetRow.classList.add('highlight-flash');
  setTimeout(() => {
    targetRow.classList.remove('highlight-flash');
  }, 2000);
}

/**
 * 挂载引用块与注释块 DOM 结构
 */
function renderQuoteAndAnnotation(bubble, wrapper, msgData) {
  // 引用块
  if (msgData.quote && msgData.quote.text) {
    const qEl = document.createElement('div');
    qEl.className = 'bubble-quote collapsed';
    qEl.textContent = `引用: ${msgData.quote.text}`;
    qEl.addEventListener('click', (e) => {
      e.stopPropagation();
      qEl.classList.toggle('collapsed');
      updateBubbleSVG(wrapper);
      if (msgData.quote.id) {
        highlightOriginalMessage(msgData.quote.id);
      }
    });
    bubble.insertBefore(qEl, bubble.firstChild);
  }

  // 注释块
  if (msgData.annotation) {
    let aEl = bubble.querySelector('.bubble-annotation');
    if (!aEl) {
      aEl = document.createElement('div');
      aEl.className = 'bubble-annotation collapsed';
      bubble.appendChild(aEl);
    }
    aEl.textContent = `注释: ${msgData.annotation}`;
    aEl.onclick = (e) => {
      e.stopPropagation();
      aEl.classList.toggle('collapsed');
      updateBubbleSVG(wrapper);
    };
  } else {
    const existing = bubble.querySelector('.bubble-annotation');
    if (existing) existing.remove();
  }
}

/**
 * 动态应用系统美化与定制样式到页面 DOM
 */
function applySystemStyles() {
  if (!window.SystemState) return;
  const s = window.SystemState.getSettings();

  const nameEl = document.getElementById('display-contact-name');
  if (nameEl) nameEl.textContent = s.nicknames.opponent || '顾时夜';

  let styleEl = document.getElementById('dynamic-system-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-system-styles';
    document.head.appendChild(styleEl);
  }

  let fontFaceCss = '';
  if (s.fonts && s.fonts.fontCustom) {
    fontFaceCss = `@font-face { font-family: 'CustomLoveFont'; src: url('${s.fonts.fontCustom}'); } * { font-family: 'CustomLoveFont', -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif !important; }`;
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
    ${fontFaceCss}
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

function createMsgRowBase(isMe, timestamp, msgId) {
  const ts = timestamp || Date.now();
  const dateObj = new Date(ts);
  const chatContent = document.getElementById('chat-content');
  checkAndAppendDateDivider(chatContent, dateObj);

  const row = document.createElement('div');
  row.className = `msg-row ${isMe ? 'me' : 'opponent'}`;
  row.setAttribute('data-msg-id', msgId);

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'dict-checkbox msg-select-checkbox';
  row.appendChild(checkbox);

  const avatar = document.createElement('div');
  avatar.className = 'avatar';

  const col = document.createElement('div');
  col.className = 'msg-column';

  return { row, avatar, col, dateObj, chatContent };
}

function appendMessage(chatContent, text, isMe = true, timestamp = null, saveToHistory = true, quoteData = null, annotationText = null, existingMsgId = null) {
  const msgId = existingMsgId || ('m_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
  const { row, avatar, col, dateObj } = createMsgRowBase(isMe, timestamp, msgId);

  const wrapper = document.createElement('div');
  wrapper.className = 'bubble-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  
  const textNode = document.createElement('span');
  textNode.className = 'bubble-text-node';
  textNode.textContent = text;
  bubble.appendChild(textNode);

  const msgData = { id: msgId, text, isMe, timestamp: timestamp || Date.now(), quote: quoteData, annotation: annotationText };
  renderQuoteAndAnnotation(bubble, wrapper, msgData);

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
    window.ChatState.addMessage({ id: msgId, type: 'text', text, isMe, timestamp: Date.now(), quote: quoteData, annotation: annotationText });
  }

  return msgId;
}

function updateMessageInDOM(msgId, newText) {
  const row = document.querySelector(`.msg-row[data-msg-id="${msgId}"]`);
  if (!row) return;
  const textNode = row.querySelector('.bubble-text-node');
  if (textNode) textNode.textContent = newText;
  const wrapper = row.querySelector('.bubble-wrapper');
  if (wrapper) updateBubbleSVG(wrapper);
}

function appendImageMessage(chatContent, imgSrc, isMe = true, timestamp = null, saveToHistory = true, quoteData = null, annotationText = null, existingMsgId = null) {
  const msgId = existingMsgId || ('m_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
  const { row, avatar, col, dateObj } = createMsgRowBase(isMe, timestamp, msgId);

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
  renderQuoteAndAnnotation(bubble, wrapper, { id: msgId, quote: quoteData, annotation: annotationText });
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
    window.ChatState.addMessage({ id: msgId, type: 'image', src: imgSrc, isMe, timestamp: Date.now(), quote: quoteData, annotation: annotationText });
  }

  return msgId;
}

function appendStickerMessage(chatContent, imgSrc, isMe = true, timestamp = null, saveToHistory = true, quoteData = null, annotationText = null, existingMsgId = null) {
  const msgId = existingMsgId || ('m_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
  const { row, avatar, col, dateObj } = createMsgRowBase(isMe, timestamp, msgId);

  const wrapper = document.createElement('div');
  wrapper.className = 'bubble-wrapper sticker-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'bubble bubble-sticker';

  const img = document.createElement('img');
  img.className = 'sticker-img';
  img.src = imgSrc;
  img.onload = () => { scrollToBottom(chatContent); };

  bubble.appendChild(img);
  renderQuoteAndAnnotation(bubble, wrapper, { id: msgId, quote: quoteData, annotation: annotationText });
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
    window.ChatState.addMessage({ id: msgId, type: 'sticker', src: imgSrc, isMe, timestamp: Date.now(), quote: quoteData, annotation: annotationText });
  }

  return msgId;
}

function loadChatHistoryUI() {
  const chatContent = document.getElementById('chat-content');
  if (!chatContent || !window.ChatState) return;

  chatContent.innerHTML = '';
  lastDisplayedDateKey = null;

  const history = window.ChatState.getHistory();
  history.forEach((msg) => {
    if (msg.type === 'image') {
      appendImageMessage(chatContent, msg.src, msg.isMe, msg.timestamp, false, msg.quote, msg.annotation, msg.id);
    } else if (msg.type === 'sticker') {
      appendStickerMessage(chatContent, msg.src, msg.isMe, msg.timestamp, false, msg.quote, msg.annotation, msg.id);
    } else {
      appendMessage(chatContent, msg.text, msg.isMe, msg.timestamp, false, msg.quote, msg.annotation, msg.id);
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
