/**
 * 入口脚本：初始化页面、串联各模块。
 *
 * 【重要 · 不要改】本项目不使用 ES Module。
 *   不要写 import / export，也不要用 <script type="module">。
 *   原因：type="module" 的脚本在"双击 index.html 直接打开"时（file:// 协议）
 *        会被浏览器安全策略拦截，导致整页 JS 一行都不执行 —— 表现就是
 *        按钮全部失灵、气泡框画不出来。
 *   正确做法：在 index.html 里按 ui.js → main.js 的顺序，
 *            用普通 <script src="..." defer></script> 引入。
 *
 * 依赖：js/ui.js 提供的全局函数 refreshAllBubbles / appendMessage
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const chatContent = document.getElementById('chat-content');
    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send');
    const btnSettings = document.getElementById('btn-settings');
    const settingsOverlay = document.getElementById('settings-overlay');

    // 窗口变动时重新绘制气泡
    window.addEventListener('resize', refreshAllBubbles);

    // 页面资源全部加载完成后再重绘一次：
    // 字体加载完之前气泡宽高是测不准的，会导致气泡框画歪/画不全
    window.addEventListener('load', refreshAllBubbles);
    setTimeout(refreshAllBubbles, 50);

    // 输入框文字变动监听 -> 激活/禁用发送按钮
    chatInput.addEventListener('input', () => {
      if (chatInput.value.trim().length > 0) {
        btnSend.classList.add('active');
      } else {
        btnSend.classList.remove('active');
      }
    });

    // 发送消息逻辑
    function handleSend() {
      const text = chatInput.value.trim();
      if (!text) return;

      appendMessage(chatContent, text, true);
      chatInput.value = '';
      btnSend.classList.remove('active');

      // 对方在短暂延迟后自动回复一条占位消息
      setTimeout(() => {
        appendMessage(chatContent, '嗯，我在听。', false);
      }, 1000);
    }

    btnSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    });

    // 设置面板切换
    btnSettings.addEventListener('click', () => {
      settingsOverlay.classList.add('show');
    });

    settingsOverlay.addEventListener('click', (e) => {
      if (e.target === settingsOverlay) {
        settingsOverlay.classList.remove('show');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        settingsOverlay.classList.remove('show');
      }
    });
  });
})();
