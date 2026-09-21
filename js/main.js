/**
 * 入口脚本：初始化页面、串联各模块。
 *
 * 【重要 · 不要改】本项目不使用 ES Module。
 *   不要写 import / export，也不要用 <script type="module">。
 *   正确做法：在 index.html 里按 ui.js → state.js → dict.js → main.js 的顺序，
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
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsOverlay = document.getElementById('settings-overlay');

    // 窗口变动时重新绘制气泡
    window.addEventListener('resize', refreshAllBubbles);

    // 页面资源全部加载完成后再重绘一次
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

      // 默认回复规则：用户发送消息后间隔 3-10 秒，一次发送 1-3 条字卡（每个字卡分开发送）
      const delayMs = Math.floor(Math.random() * 7000) + 3000;
      const count = Math.floor(Math.random() * 3) + 1;

      setTimeout(() => {
        let replies = [];
        if (window.DictState && typeof window.DictState.getRandomCards === 'function') {
          replies = window.DictState.getRandomCards(count);
        }

        if (replies.length === 0) {
          replies = ['嗯，我在听。'];
        }

        // 依次发送每个字卡
        replies.forEach((replyText, index) => {
          setTimeout(() => {
            appendMessage(chatContent, replyText, false);
          }, index * 900);
        });
      }, delayMs);
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

    // 点击右上角叉号关闭设置面板
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => {
        settingsOverlay.classList.remove('show');
      });
    }

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
