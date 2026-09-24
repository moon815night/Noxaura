/**
 * 动态计算并更新消息气泡 SVG 虚线外框路径
 */
function updateBubbleSVG(wrapper) {
  // 如果是图片消息或表情包，不需要计算与绘制 SVG 虚线外框
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
    // 我方气泡
    d = `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - 2} L ${w} ${h} L ${w - 6} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  } else {
    // 对方气泡
    d = `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L 6 ${h} L 0 ${h} L 0 ${h - 2} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  }
  path.setAttribute('d', d);
}

/**
 * 刷新页面中所有气泡的路径
 */
function refreshAllBubbles() {
  document.querySelectorAll('.bubble-wrapper').forEach(updateBubbleSVG);
}

/**
 * 聊天滚动到底部
 */
function scrollToBottom(chatContent) {
  chatContent.scrollTop = chatContent.scrollHeight;
}

// 记录最后一次居中渲染日期的 Key (YYYY-MM-DD)
let lastDisplayedDateKey = null;

/**
 * 校验并在当日零点后首次发消息时添加顶部居中年月日
 */
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

/**
 * 格式化时分时间 (HH:mm)
 */
function formatMsgTime(dateObj) {
  const date = dateObj || new Date();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 生成并添加一条文本消息到界面
 */
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

/**
 * 生成并添加一条图片消息到界面（相册照片）
 */
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

/**
 * 生成并添加一条表情包消息到界面（无气泡、无描边）
 */
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

/**
 * 页面初始化时加载历史聊天记录
 */
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
}

/**
 * 清空聊天主区 UI DOM
 */
function clearChatDisplay() {
  const chatContent = document.getElementById('chat-content');
  if (chatContent) {
    chatContent.innerHTML = '';
  }
  lastDisplayedDateKey = null;
}
