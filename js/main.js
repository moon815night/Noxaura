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
    const btnBubbles = document.querySelector('.btn-bubbles');
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsOverlay = document.getElementById('settings-overlay');

    // 连发模式标记
    let isContinuousMode = false;

    // 窗口变动时重新绘制气泡
    window.addEventListener('resize', refreshAllBubbles);

    // 页面资源全部加载完成后再重绘一次
    window.addEventListener('load', refreshAllBubbles);
    setTimeout(refreshAllBubbles, 50);

    // 更新发送按钮高亮状态
    function updateSendBtnState() {
      if (isContinuousMode || chatInput.value.trim().length > 0) {
        btnSend.classList.add('active');
      } else {
        btnSend.classList.remove('active');
      }
    }

    // 泡泡键点击事件：开启 / 关闭连发模式
    if (btnBubbles) {
      btnBubbles.addEventListener('click', () => {
        isContinuousMode = !isContinuousMode;
        if (isContinuousMode) {
          btnBubbles.classList.add('active');
        } else {
          btnBubbles.classList.remove('active');
        }
        updateSendBtnState();
      });
    }

    // 输入框文字变动监听 -> 激活/禁用发送按钮
    chatInput.addEventListener('input', updateSendBtnState);

    // 触发对方回复逻辑
    function triggerOpponentReply() {
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

    // 处理发送消息逻辑
    function handleSendText() {
      const text = chatInput.value.trim();
      if (!text) return false;

      appendMessage(chatContent, text, true);
      chatInput.value = '';
      return true;
    }

    // 按下 Enter 键发送消息
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const sent = handleSendText();
        if (sent) {
          if (!isContinuousMode) {
            // 非连发模式下，按 Enter 发送消息并触发对方回复
            updateSendBtnState();
            triggerOpponentReply();
          } else {
            // 连发模式下，按 Enter 仅发送消息，对方不回复，发送键保持亮起
            updateSendBtnState();
          }
        }
      }
    });

    // 点击发送按键
    btnSend.addEventListener('click', () => {
      if (isContinuousMode) {
        // 连发模式下：如果有未发送的文本先发送出来，然后触发对方回复
        handleSendText();
        updateSendBtnState();
        triggerOpponentReply();
      } else {
        // 非连发模式下：有字才发送并触发对方回复
        const sent = handleSendText();
        if (sent) {
          updateSendBtnState();
          triggerOpponentReply();
        }
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
