/**
 * 入口脚本：初始化页面、串联各模块与回复策略定时器。
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const chatApp = document.querySelector('.chat-app');
    const chatContent = document.getElementById('chat-content');
    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send');
    const btnBubbles = document.querySelector('.btn-bubbles');
    const btnKaomoji = document.querySelector('.btn-kaomoji');
    const featurePanel = document.getElementById('feature-panel');
    const bottomBar = document.querySelector('.bottom-bar');
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsOverlay = document.getElementById('settings-overlay');
    const btnAlbum = document.getElementById('btn-album');
    const albumFileInput = document.getElementById('album-file-input');
    const imageOverlay = document.getElementById('image-overlay');

    // 载入本地存储的历史聊天记录与系统样式
    loadChatHistoryUI();

    // 连发模式标记
    let isContinuousMode = false;

    window.addEventListener('resize', refreshAllBubbles);
    window.addEventListener('load', refreshAllBubbles);
    setTimeout(refreshAllBubbles, 50);

    if (window.visualViewport) {
      const handleViewportResize = () => {
        const currentViewportHeight = window.visualViewport.height;
        if (chatApp) chatApp.style.height = `${currentViewportHeight}px`;
        scrollToBottom(chatContent);
        refreshAllBubbles();
      };
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }

    chatInput.addEventListener('focus', () => {
      setTimeout(() => { scrollToBottom(chatContent); }, 150);
    });

    function updateSendBtnState() {
      if (isContinuousMode || chatInput.value.trim().length > 0) {
        btnSend.classList.add('active');
      } else {
        btnSend.classList.remove('active');
      }
    }

    if (btnBubbles) {
      btnBubbles.addEventListener('click', () => {
        isContinuousMode = !isContinuousMode;
        btnBubbles.classList.toggle('active', isContinuousMode);
        updateSendBtnState();
      });
    }

    if (btnKaomoji && featurePanel) {
      btnKaomoji.addEventListener('click', () => {
        if (window.StickerUI) window.StickerUI.closePanel();
        const isOpen = featurePanel.classList.toggle('open');
        btnKaomoji.classList.toggle('active', isOpen);
        if (bottomBar) bottomBar.classList.toggle('feature-open', isOpen);
        setTimeout(() => { scrollToBottom(chatContent); refreshAllBubbles(); }, 300);
      });
    }

    chatInput.addEventListener('input', updateSendBtnState);

    // 触发对方回复逻辑（读取系统回复策略参数）
    function triggerOpponentReply() {
      const st = window.SystemState ? window.SystemState.getSettings().replyStrategy : { minDelay: 2, maxDelay: 5, replyCountMin: 1, replyCountMax: 3 };
      const minMs = (st.minDelay || 2) * 1000;
      const maxMs = (st.maxDelay || 5) * 1000;
      const delayMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

      const cMin = st.replyCountMin || 1;
      const cMax = st.replyCountMax || 3;
      const count = Math.floor(Math.random() * (cMax - cMin + 1)) + cMin;

      setTimeout(() => {
        let replies = [];
        if (window.StickerState) {
          replies = window.StickerState.getRandomReplyContent(count);
        } else {
          replies = [{ type: 'text', val: '嗯。' }];
        }

        replies.forEach((item, index) => {
          setTimeout(() => {
            if (item.type === 'sticker') {
              appendStickerMessage(chatContent, item.val, false);
            } else {
              appendMessage(chatContent, item.val, false);
            }
          }, index * 900);
        });
      }, delayMs);
    }

    // 联系人主动发消息定时检查机制 (20% 概率)
    function setupProactiveTimer() {
      const st = window.SystemState ? window.SystemState.getSettings().replyStrategy : { proactiveProb: 20, proactiveIntervalMin: 10, proactiveIntervalMax: 30, proactiveUnit: 'min' };
      const unitMult = st.proactiveUnit === 'hour' ? 3600000 : 60000;
      const minMs = (st.proactiveIntervalMin || 10) * unitMult;
      const maxMs = (st.proactiveIntervalMax || 30) * unitMult;
      const nextInterval = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

      setTimeout(() => {
        const rand = Math.random() * 100;
        if (rand <= (st.proactiveProb || 20)) {
          triggerOpponentReply();
        }
        setupProactiveTimer();
      }, nextInterval);
    }
    setupProactiveTimer();

    function handleSendText() {
      const text = chatInput.value.trim();
      if (!text) return false;
      appendMessage(chatContent, text, true);
      chatInput.value = '';
      return true;
    }

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const sent = handleSendText();
        if (sent && !isContinuousMode) {
          updateSendBtnState();
          triggerOpponentReply();
        }
      }
    });

    btnSend.addEventListener('click', () => {
      if (isContinuousMode) {
        handleSendText();
        updateSendBtnState();
        triggerOpponentReply();
      } else {
        if (handleSendText()) {
          updateSendBtnState();
          triggerOpponentReply();
        }
      }
    });

    // 相册逻辑
    if (btnAlbum && albumFileInput) {
      btnAlbum.addEventListener('click', () => { albumFileInput.click(); });
      albumFileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const readPromises = files.map(file => new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target.result);
          reader.readAsDataURL(file);
        }));
        Promise.all(readPromises).then(imgSrcs => {
          imgSrcs.filter(Boolean).forEach(src => appendImageMessage(chatContent, src, true));
          triggerOpponentReply();
        });
        albumFileInput.value = '';
      });
    }

    if (imageOverlay) {
      imageOverlay.addEventListener('click', () => { imageOverlay.classList.remove('show'); });
    }

    btnSettings.addEventListener('click', () => { settingsOverlay.classList.add('show'); });
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => { settingsOverlay.classList.remove('show'); });
    }

    window.triggerReply = triggerOpponentReply;
    window.isContinuousMode = () => isContinuousMode;
  });
})();
