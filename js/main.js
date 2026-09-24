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

    // 引用、编辑与长按菜单相关 DOM
    const quotePreviewBar = document.getElementById('quote-preview-bar');
    const quotePreviewText = document.getElementById('quote-preview-text');
    const btnCancelQuote = document.getElementById('btn-cancel-quote');
    const ctxMenuOverlay = document.getElementById('context-menu-overlay');
    const ctxMenu = document.getElementById('context-menu');
    const ctxBtnQuote = document.getElementById('ctx-btn-quote');
    const ctxBtnAnnotate = document.getElementById('ctx-btn-annotate');
    const ctxBtnEdit = document.getElementById('ctx-btn-edit');
    const ctxBtnDelete = document.getElementById('ctx-btn-delete');
    
    const multiSelectBar = document.getElementById('multi-select-bar');
    const btnCancelMultiSelect = document.getElementById('btn-cancel-multi-select');
    const btnDeleteSelectedMsgs = document.getElementById('btn-delete-selected-msgs');
    const multiSelectCount = document.getElementById('multi-select-count');

    let currentQuoteData = null; // { id, text }
    let currentEditMsgId = null; // 二次编辑消息 ID
    let activeLongPressMsgId = null;
    let isMultiSelectMode = false;
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

    // ==================== 长按手势与右键菜单 ====================
    let pressTimer = null;

    function showContextMenu(x, y, msgId) {
      window.isLongPressing = true;
      activeLongPressMsgId = msgId;
      const history = window.ChatState.getHistory();
      const msg = history.find(m => m.id === msgId);
      if (!msg) return;

      // 如果是用户的消息，显示编辑按钮
      if (msg.isMe && msg.type === 'text') {
        ctxBtnEdit.style.display = 'block';
      } else {
        ctxBtnEdit.style.display = 'none';
      }

      const clampedX = Math.max(90, Math.min(x, window.innerWidth - 90));
      const clampedY = Math.max(100, Math.min(y, window.innerHeight - 60));

      ctxMenu.style.left = `${clampedX}px`;
      ctxMenu.style.top = `${clampedY}px`;
      ctxMenuOverlay.classList.add('show');
    }

    function hideContextMenu() {
      ctxMenuOverlay.classList.remove('show');
      setTimeout(() => { window.isLongPressing = false; }, 200);
    }

    ctxMenuOverlay.addEventListener('click', hideContextMenu);

    chatContent.addEventListener('touchstart', (e) => {
      const row = e.target.closest('.msg-row');
      if (!row) return;
      const msgId = row.getAttribute('data-msg-id');
      if (!msgId) return;

      pressTimer = setTimeout(() => {
        const touch = e.touches[0];
        showContextMenu(touch.clientX, touch.clientY, msgId);
      }, 500);
    });

    chatContent.addEventListener('touchend', () => clearTimeout(pressTimer));
    chatContent.addEventListener('touchmove', () => clearTimeout(pressTimer));

    chatContent.addEventListener('contextmenu', (e) => {
      const row = e.target.closest('.msg-row');
      if (!row) return;
      e.preventDefault();
      const msgId = row.getAttribute('data-msg-id');
      if (msgId) showContextMenu(e.clientX, e.clientY, msgId);
    });

    // 菜单按钮 1：引用
    ctxBtnQuote.addEventListener('click', () => {
      hideContextMenu();
      const history = window.ChatState.getHistory();
      const msg = history.find(m => m.id === activeLongPressMsgId);
      if (!msg) return;
      const qText = msg.type === 'image' ? '[图片]' : (msg.type === 'sticker' ? '[表情]' : msg.text);
      setQuotePreview(msg.id, qText);
    });

    // 菜单按钮 2：注释
    ctxBtnAnnotate.addEventListener('click', () => {
      hideContextMenu();
      const history = window.ChatState.getHistory();
      const msg = history.find(m => m.id === activeLongPressMsgId);
      if (!msg) return;

      showAnnotateModal(msg.annotation || '', (newAnnot) => {
        window.ChatState.updateMessage(msg.id, { annotation: newAnnot });
        loadChatHistoryUI();
      });
    });

    // 菜单按钮 3：编辑 (仅限用户文本消息)
    ctxBtnEdit.addEventListener('click', () => {
      hideContextMenu();
      const history = window.ChatState.getHistory();
      const msg = history.find(m => m.id === activeLongPressMsgId);
      if (!msg || !msg.isMe) return;

      currentEditMsgId = msg.id;
      chatInput.value = msg.text || '';
      chatInput.focus();
      updateSendBtnState();
    });

    // 菜单按钮 4：删除 (支持直接删除与进入多选删除)
    ctxBtnDelete.addEventListener('click', () => {
      hideContextMenu();
      showConfirmModal('删除消息', '请选择删除方式：', () => {
        // 确认直接删除单条
        window.ChatState.deleteMessage(activeLongPressMsgId);
        loadChatHistoryUI();
      }, () => {
        // 进入多选删除模式并勾选当前选中的消息
        enterMultiSelectMode(activeLongPressMsgId);
      });
    });

    // 多选模式
    function enterMultiSelectMode(initialMsgId) {
      isMultiSelectMode = true;
      document.querySelector('.chat-app').classList.add('multi-select-mode');
      multiSelectBar.classList.add('show');
      if (initialMsgId) {
        const targetRow = document.querySelector(`.msg-row[data-msg-id="${initialMsgId}"]`);
        if (targetRow) {
          const cb = targetRow.querySelector('.msg-select-checkbox');
          if (cb) cb.checked = true;
        }
      }
      updateMultiSelectCount();
    }

    function exitMultiSelectMode() {
      isMultiSelectMode = false;
      document.querySelector('.chat-app').classList.remove('multi-select-mode');
      multiSelectBar.classList.remove('show');
      document.querySelectorAll('.msg-select-checkbox').forEach(cb => cb.checked = false);
    }

    function updateMultiSelectCount() {
      const selected = document.querySelectorAll('.msg-select-checkbox:checked').length;
      multiSelectCount.textContent = `已选择 ${selected} 条消息`;
    }

    // 点击消息行切换选中状态
    chatContent.addEventListener('click', (e) => {
      if (!isMultiSelectMode) return;
      const row = e.target.closest('.msg-row');
      if (!row) return;
      
      if (e.target.classList.contains('msg-select-checkbox')) return;
      
      const cb = row.querySelector('.msg-select-checkbox');
      if (cb) {
        cb.checked = !cb.checked;
        updateMultiSelectCount();
      }
    });

    chatContent.addEventListener('change', (e) => {
      if (e.target.classList.contains('msg-select-checkbox')) {
        updateMultiSelectCount();
      }
    });

    btnCancelMultiSelect.addEventListener('click', exitMultiSelectMode);
    btnDeleteSelectedMsgs.addEventListener('click', () => {
      const selectedBoxes = document.querySelectorAll('.msg-select-checkbox:checked');
      if (selectedBoxes.length === 0) return;
      const idsToDelete = [];
      selectedBoxes.forEach(cb => {
        const row = cb.closest('.msg-row');
        if (row) idsToDelete.push(row.getAttribute('data-msg-id'));
      });

      showConfirmModal('确认删除', `确定要删除选中的 ${idsToDelete.length} 条消息吗？`, () => {
        window.ChatState.deleteMessages(idsToDelete);
        exitMultiSelectMode();
        loadChatHistoryUI();
      });
    });

    // 注释弹窗
    function showAnnotateModal(defaultText, onSave) {
      const overlay = document.createElement('div');
      overlay.className = 'dict-modal show';
      overlay.innerHTML = `
        <div class="dict-modal-content">
          <div class="dict-modal-title">编辑消息注释</div>
          <textarea class="dict-modal-textarea" id="modal-annot-input" style="height:120px;" placeholder="在此输入对此句消息的专属注释...">${escapeHtml(defaultText)}</textarea>
          <div class="dict-modal-footer">
            <button class="cute-btn" id="modal-annot-cancel" style="background:#e0ede5;">取消</button>
            <button class="cute-btn" id="modal-annot-save">保存</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const input = overlay.querySelector('#modal-annot-input');
      input.focus();

      overlay.querySelector('#modal-annot-cancel').onclick = () => overlay.remove();
      overlay.querySelector('#modal-annot-save').onclick = () => {
        const val = input.value.trim();
        overlay.remove();
        onSave(val);
      };
    }

    function showConfirmModal(title, message, onOk, onMultiSelect) {
      const overlay = document.createElement('div');
      overlay.className = 'dict-modal show';
      let multiBtnHtml = onMultiSelect ? `<button class="cute-btn" id="modal-multi">多选删除</button>` : '';
      overlay.innerHTML = `
        <div class="dict-modal-content">
          <div class="dict-modal-title">${escapeHtml(title)}</div>
          <div style="font-size:13px; color:#2e1f19; line-height:1.4;">${escapeHtml(message)}</div>
          <div class="dict-modal-footer">
            <button class="cute-btn" id="modal-cancel" style="background:#e0ede5;">取消</button>
            ${multiBtnHtml}
            <button class="cute-btn danger" id="modal-ok">删除本条</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();
      overlay.querySelector('#modal-ok').onclick = () => {
        overlay.remove();
        if (onOk) onOk();
      };
      if (onMultiSelect) {
        overlay.querySelector('#modal-multi').onclick = () => {
          overlay.remove();
          onMultiSelect();
        };
      }
    }

    function escapeHtml(str) {
      return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
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

    window.triggerReply = triggerOpponentReply;
    window.isContinuousMode = () => isContinuousMode;
  });
})();
