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
    const btnPat = document.getElementById('btn-pat');
    const patPanel = document.getElementById('pat-panel');
    const patBody = document.getElementById('pat-body');
    const albumFileInput = document.getElementById('album-file-input');
    const imageOverlay = document.getElementById('image-overlay');


    // 引用相关 DOM
    const quotePreviewBar = document.getElementById('quote-preview-bar');
    const quotePreviewText = document.getElementById('quote-preview-text');
    const btnCancelQuote = document.getElementById('btn-cancel-quote');

    // 长按菜单 / 多选删除相关的 DOM 与全部交互，已拆分到 js/message-menu.js

    let currentQuoteData = null; // { id, text }
    let currentEditMsgId = null; // 二次编辑消息 ID
    window.isLongPressing = false;

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
      if (isContinuousMode || chatInput.value.trim().length > 0 || currentEditMsgId) {
        btnSend.classList.add('active');
      } else {
        btnSend.classList.remove('active');
      }
    }

    function setQuotePreview(msgId, text) {
      currentQuoteData = { id: msgId, text };
      quotePreviewText.textContent = `引用: ${text}`;
      quotePreviewBar.classList.add('show');
    }

    function clearQuotePreview() {
      currentQuoteData = null;
      quotePreviewBar.classList.remove('show');
    }

    // 暴露方法给外部模块（如 sticker.js）使用
    window.getCurrentQuoteData = () => currentQuoteData;
    window.clearQuotePreview = clearQuotePreview;

    if (btnCancelQuote) {
      btnCancelQuote.addEventListener('click', clearQuotePreview);
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

    // 触发对方回复逻辑（读取系统回复策略参数，含 10% 概率引用用户消息）
    function triggerOpponentReply() {
      const st = window.SystemState ? window.SystemState.getSettings().replyStrategy : { minDelay: 2, maxDelay: 5, replyCountMin: 1, replyCountMax: 3 };
      const minMs = (st.minDelay || 2) * 1000;
      const maxMs = (st.maxDelay || 5) * 1000;
      const delayMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

      const cMin = st.replyCountMin || 1;
      const cMax = st.replyCountMax || 3;
      const count = Math.floor(Math.random() * (cMax - cMin + 1)) + cMin;

      // 「他的」拍一拍：对方回复时有 25% 概率以拍一拍形式出现
      // 内容取自 设置 → 拍一拍 → 「他的」（不想让他拍你，就把他那一侧清空）
      let hisPatText = '';
      if (window.PatState && Math.random() < 0.25) {
        hisPatText = window.PatState.getRandomText('his');
      }

      setTimeout(() => {
        let replies = [];
        if (window.StickerState) {
          replies = window.StickerState.getRandomReplyContent(count);
        } else {
          replies = [{ type: 'text', val: '嗯。' }];
        }

        // 10% 概率引用用户以前的所有历史消息（包括文本、图片、表情）
        let replyQuote = null;
        if (Math.random() < 0.1 && window.ChatState) {
          const userMsgs = window.ChatState.getHistory().filter(m => m.isMe);
          if (userMsgs.length > 0) {
            const targetMsg = userMsgs[Math.floor(Math.random() * userMsgs.length)];
            let qText = '[消息]';
            if (targetMsg.type === 'image') qText = '[图片]';
            else if (targetMsg.type === 'sticker') qText = '[表情]';
            else if (targetMsg.text) qText = targetMsg.text;
            replyQuote = { id: targetMsg.id, text: qText };
          }
        }

        replies.forEach((item, index) => {
          setTimeout(() => {
            // 第一条换成「他的」拍一拍
            if (index === 0 && hisPatText) {
              appendPatMessage(chatContent, hisPatText, null, true, null, false);
              return;
            }
            const qData = (index === 0) ? replyQuote : null;
            if (item.type === 'sticker') {
              appendStickerMessage(chatContent, item.val, false, null, true, qData);
            } else {
              appendMessage(chatContent, item.val, false, null, true, qData);
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

      // 如果处于二次编辑状态，原地修改该消息（不触发新的回复）
      if (currentEditMsgId) {
        window.ChatState.updateMessage(currentEditMsgId, { text });
        updateMessageInDOM(currentEditMsgId, text);
        currentEditMsgId = null;
        chatInput.value = '';
        return 'edit';
      }

      appendMessage(chatContent, text, true, null, true, currentQuoteData);
      clearQuotePreview();
      chatInput.value = '';
      return true;
    }

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const res = handleSendText();
        if (res) {
          updateSendBtnState();
          if (res === true && !isContinuousMode) {
            triggerOpponentReply();
          }
        }
      }
    });

    btnSend.addEventListener('click', () => {
      const res = handleSendText();
      if (res) {
        updateSendBtnState();
        if (res === true) {
          triggerOpponentReply();
        }
      }
    });


    // 拍一拍逻辑
    if (btnPat && patPanel && patBody) {
      btnPat.addEventListener('click', () => {
        if (window.StickerUI) window.StickerUI.closePanel();
        
        const isOpen = patPanel.classList.toggle('open');
        if (isOpen) {
          renderPatItems();
        }
      });
    }

    function renderPatItems() {
      if (!patBody) return;
      patBody.innerHTML = '';

      // 「我的」内容由 设置 → 拍一拍 管理，这里只负责展示和发送
      const list = (window.PatState && window.PatState.getMine()) || [];

      if (list.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'pat-empty-hint';
        empty.textContent = '还没有内容，去「设置 → 拍一拍」里添加吧';
        patBody.appendChild(empty);
        return;
      }

      list.forEach((item) => {
        const text = window.PatState.resolveText(item.text);
        const el = document.createElement('div');
        el.className = 'pat-item';
        el.textContent = text;
        el.addEventListener('click', () => {
          if (patPanel) patPanel.classList.remove('open');
          if (featurePanel) featurePanel.classList.remove('open');
          if (btnKaomoji) btnKaomoji.classList.remove('active');
          if (bottomBar) bottomBar.classList.remove('feature-open');

          appendPatMessage(chatContent, text, null, true, null, true);
          if (!window.isContinuousMode()) {
            triggerOpponentReply();
          }
        });
        patBody.appendChild(el);
      });
    }

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
          imgSrcs.filter(Boolean).forEach(src => appendImageMessage(chatContent, src, true, null, true, currentQuoteData));
          clearQuotePreview();
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

    // 把长按菜单、多选删除交给独立模块
    window.MessageMenu.init({
      chatContent: chatContent,
      chatInput: chatInput,
      updateSendBtnState: updateSendBtnState,
      setQuotePreview: setQuotePreview,
      beginEditMessage: (msgId, text) => {
        currentEditMsgId = msgId;
        chatInput.value = text || '';
        chatInput.focus();
        updateSendBtnState();
      }
    });

    window.triggerReply = triggerOpponentReply;
    window.isContinuousMode = () => isContinuousMode;
  });
})();
