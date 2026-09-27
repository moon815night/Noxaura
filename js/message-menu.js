/**
 * 消息操作模块：长按/右键菜单、引用、专属注释、二次编辑、删除、多选删除。
 *
 * 由 main.js 拆分而来（2026-09-27 分类整理），避免入口文件过长。
 * 用法：main.js 在 DOMContentLoaded 末尾调用 window.MessageMenu.init({...}) 注入依赖。
 * 本文件是全局脚本（不是 ES Module），严禁写 import / export。
 */
(function () {
  'use strict';

  function init(deps) {
    const chatContent = deps.chatContent;
    const chatInput = deps.chatInput;
    const updateSendBtnState = deps.updateSendBtnState;
    const setQuotePreview = deps.setQuotePreview;
    const beginEditMessage = deps.beginEditMessage;

    // 长按菜单 / 多选删除相关 DOM
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

    let activeLongPressMsgId = null;
    let isMultiSelectMode = false;

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

      // 二次编辑状态由 main.js 接管（它持有输入框与 currentEditMsgId）
      beginEditMessage(msg.id, msg.text);
    });

    // 菜单按钮 4：删除 (支持直接删除与进入多选删除)
    ctxBtnDelete.addEventListener('click', () => {
      hideContextMenu();
      showDeleteOptionsModal('删除消息', '请选择删除方式：', () => {
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

    function showDeleteOptionsModal(title, message, onOk, onMultiSelect) {
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

    // escapeHtml 见 js/modal.js（全局函数）
  }

  window.MessageMenu = { init: init };
})();
