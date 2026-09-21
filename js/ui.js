/**
 * 动态计算并更新消息气泡 SVG 虚线外框路径
 */
function updateBubbleSVG(wrapper) {
  const bubble = wrapper.querySelector('.bubble');
  const svg = wrapper.querySelector('.bubble-svg');
  const path = svg.querySelector('path');

  const w = bubble.offsetWidth;
  const h = bubble.offsetHeight;
  const isMe = wrapper.parentElement.classList.contains('me');

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const r = 12;

  let d = '';
  if (isMe) {
    // 我方气泡（尾巴画在最右端顶点 (w, h)，短小且紧密包裹背景）
    d = `M ${r} 0 
         L ${w - r} 0 
         A ${r} ${r} 0 0 1 ${w} ${r} 
         L ${w} ${h - 2} 
         L ${w} ${h} 
         L ${w - 6} ${h} 
         L ${r} ${h} 
         A ${r} ${r} 0 0 1 0 ${h - r} 
         L 0 ${r} 
         A ${r} ${r} 0 0 1 ${r} 0 Z`;
  } else {
    // 对方气泡（尾巴画在最左端顶点 (0, h)，短小且紧密包裹背景）
    d = `M ${r} 0 
         L ${w - r} 0 
         A ${r} ${r} 0 0 1 ${w} ${r} 
         L ${w} ${h - r} 
         A ${r} ${r} 0 0 1 ${w - r} ${h} 
         L 6 ${h} 
         L 0 ${h} 
         L 0 ${h - 2} 
         L 0 ${r} 
         A ${r} ${r} 0 0 1 ${r} 0 Z`;
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

/**
 * 生成并添加一条新消息到界面
 */
function appendMessage(chatContent, text, isMe = true) {
  const row = document.createElement('div');
  row.className = `msg-row ${isMe ? 'me' : 'opponent'}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';

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
  row.appendChild(avatar);
  row.appendChild(wrapper);

  chatContent.appendChild(row);
  updateBubbleSVG(wrapper);
  scrollToBottom(chatContent);
}
