/**
 * 表情面板 UI 与交互逻辑
 */
(function (global) {
  'use strict';

  let currentTab = 'heart'; // 'heart', 'gear', or groupId
  let isExpanded = false;
  let isDeleteMode = false;
  let selectedIds = new Set();
  let longPressTimer = null;

  document.addEventListener('DOMContentLoaded', () => {
    const btnEmoji = document.getElementById('btn-emoji-panel');
    const panel = document.getElementById('sticker-panel');
    const tabsContainer = document.getElementById('sticker-tabs');
    const bodyContainer = document.getElementById('sticker-body');
    const fileInput = document.getElementById('sticker-file-input');

    if (!btnEmoji || !panel) return;

    btnEmoji.addEventListener('click', () => {
      // 关闭功能面板
      const featurePanel = document.getElementById('feature-panel');
      const btnKaomoji = document.querySelector('.btn-kaomoji');
      const bottomBar = document.querySelector('.bottom-bar');
      if (featurePanel) featurePanel.classList.remove('open');
      if (btnKaomoji) btnKaomoji.classList.remove('active');
      if (bottomBar) bottomBar.classList.remove('feature-open');

      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        renderTabs();
        renderBody();
      }
    });

    function renderTabs() {
      const data = global.StickerState.getData();
      tabsContainer.innerHTML = '';

      // 1. 齿轮 (设置)
      tabsContainer.appendChild(createTabBtn('gear', `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      `));

      // 2. 爱心 (我的表情包) - 改为描边风格，大左小右，不重合
      tabsContainer.appendChild(createTabBtn('heart', `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" transform="translate(-1, 4) scale(0.75)"/>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" transform="translate(15, 0) scale(0.35)"/>
        </svg>
      `));

      // 3. 星星 (联系人分组) - 改为描边风格，大左小右，不重合
      data.groups.forEach(g => {
        const iconHtml = g.icon || `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" transform="translate(-1, 4) scale(0.75)"/>
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" transform="translate(15, 0) scale(0.35)"/>
          </svg>
        `;
        tabsContainer.appendChild(createTabBtn(g.id, iconHtml));
      });
    }

    function createTabBtn(id, iconHtml) {
      const btn = document.createElement('div');
      btn.className = `sticker-tab-btn ${currentTab === id ? 'active' : ''}`;
      btn.innerHTML = iconHtml;
      btn.onclick = () => {
        currentTab = id;
        isDeleteMode = false;
        selectedIds.clear();
        renderTabs();
        renderBody();
      };
      return btn;
    }

    function renderBody() {
      bodyContainer.innerHTML = '';
      const data = global.StickerState.getData();

      if (currentTab === 'gear') {
        renderSettings(data);
        return;
      }

      let stickers = [];
      let title = '';
      let titleColor = '#775c55';

      if (currentTab === 'heart') {
        stickers = [...data.myStickers].sort((a, b) => (b.count || 0) - (a.count || 0));
      } else {
        const g = data.groups.find(i => i.id === currentTab);
        if (g) {
          stickers = g.stickers;
          title = g.name;
          titleColor = g.titleColor;
        }
      }

      if (title) {
        const tEl = document.createElement('div');
        tEl.className = 'sticker-group-title';
        tEl.style.color = titleColor;
        tEl.textContent = title;
        bodyContainer.appendChild(tEl);
      }

      const grid = document.createElement('div');
      grid.className = 'sticker-grid';

      // 批量加入键
      const addBtn = document.createElement('div');
      addBtn.className = 'sticker-item add-btn';
      addBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#775c55" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
      addBtn.onclick = () => fileInput.click();
      grid.appendChild(addBtn);

      const displayCount = isExpanded ? stickers.length : 19;
      stickers.slice(0, displayCount).forEach(s => {
        const item = document.createElement('div');
        item.className = `sticker-item ${selectedIds.has(s.id) ? 'selected' : ''}`;
        item.innerHTML = `<img src="${s.src}" loading="lazy">`;
        
        item.onclick = () => {
          if (isDeleteMode) {
            if (selectedIds.has(s.id)) selectedIds.delete(s.id);
            else selectedIds.add(s.id);
            renderBody();
          } else {
            sendSticker(s);
          }
        };

        item.onmousedown = item.ontouchstart = () => {
          longPressTimer = setTimeout(() => {
            isDeleteMode = true;
            selectedIds.add(s.id);
            renderBody();
          }, 800);
        };
        item.onmouseup = item.ontouchend = () => clearTimeout(longPressTimer);

        grid.appendChild(item);
      });

      if (!isExpanded && stickers.length > 19) {
        const fold = document.createElement('div');
        fold.className = 'sticker-fold-btn';
        fold.textContent = '展开更多表情';
        fold.onclick = () => { isExpanded = true; renderBody(); };
        grid.appendChild(fold);
      }

      bodyContainer.appendChild(grid);

      // 删除键
      const delBtn = document.createElement('div');
      delBtn.className = `btn-sticker-delete ${isDeleteMode ? 'show' : ''}`;
      delBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#775c55">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
          <path d="M10 11l4 4M14 11l-4 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
      delBtn.onclick = confirmDelete;
      bodyContainer.appendChild(delBtn);
    }

    function sendSticker(s) {
      const chatContent = document.getElementById('chat-content');
      appendStickerMessage(chatContent, s.src, true);
      if (currentTab === 'heart') global.StickerState.recordUsage(s.id);
      
      if (!window.isContinuousMode()) {
        window.triggerReply();
      }
    }

    function confirmDelete() {
      if (selectedIds.size === 0) return;
      showConfirmModal('确认删除', `确定要删除选中的 ${selectedIds.size} 个表情包吗？`, () => {
        if (currentTab === 'heart') {
          global.StickerState.deleteMyStickers(Array.from(selectedIds));
        } else {
          global.StickerState.deleteStickersFromGroup(currentTab, Array.from(selectedIds));
        }
        isDeleteMode = false;
        selectedIds.clear();
        renderBody();
      });
    }

    fileInput.onchange = (e) => {
      const files = Array.from(e.target.files || []);
      const promises = files.map(f => new Promise(r => {
        const reader = new FileReader();
        reader.onload = (evt) => r(evt.target.result);
        reader.readAsDataURL(f);
      }));
      Promise.all(promises).then(srcs => {
        if (currentTab === 'heart') global.StickerState.addMyStickers(srcs);
        else global.StickerState.addStickersToGroup(currentTab, srcs);
        renderBody();
      });
      fileInput.value = '';
    };

    function renderSettings(data) {
      const container = document.createElement('div');
      container.className = 'dict-body';
      container.style.padding = '0';

      const addBtn = document.createElement('button');
      addBtn.className = 'cute-btn';
      addBtn.style.width = '100%';
      addBtn.innerHTML = '新建表情分组';
      addBtn.onclick = () => showGroupModal();
      container.appendChild(addBtn);

      data.groups.forEach(g => {
        const item = document.createElement('div');
        item.className = 'card-item';
        item.innerHTML = `
          <span class="card-text">${g.name}</span>
          <div class="card-actions">
            <button class="cute-btn cute-btn-icon" title="编辑">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="cute-btn cute-btn-icon danger" title="删除">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        `;
        item.querySelector('.cute-btn:not(.danger)').onclick = () => showGroupModal(g);
        item.querySelector('.danger').onclick = () => {
          showConfirmModal('删除分组', `确定删除分组“${g.name}”及其所有表情吗？`, () => {
            global.StickerState.deleteGroup(g.id);
            renderBody();
          });
        };
        container.appendChild(item);
      });

      bodyContainer.appendChild(container);
    }

    function showGroupModal(group = null) {
      const data = global.StickerState.getData();
      const overlay = document.createElement('div');
      overlay.className = 'dict-modal show';
      overlay.innerHTML = `
        <div class="dict-modal-content">
          <div class="dict-modal-title">${group ? '修改分组' : '新建分组'}</div>
          <input type="text" id="g-name" class="dict-modal-input" placeholder="分组名称" value="${group ? group.name : ''}">
          <textarea id="g-icon" class="dict-modal-input" style="height:60px" placeholder="自定义图标 (SVG/CSS)">${group ? group.icon : ''}</textarea>
          <div style="font-size:12px; color:#775c55">标题颜色：</div>
          <div class="color-picker-row">
            <input type="color" id="g-color" value="${group ? group.titleColor : data.lastColor}">
            <input type="text" id="g-color-hex" class="dict-modal-input" style="width:80px" value="${group ? group.titleColor : data.lastColor}">
          </div>
          <div class="color-picker-row" id="presets"></div>
          <div class="dict-modal-footer">
            <button class="cute-btn" id="m-cancel" style="background:#e0ede5">取消</button>
            <button class="cute-btn" id="m-ok">确定</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const presets = overlay.querySelector('#presets');
      data.colorPresets.forEach(c => {
        const p = document.createElement('div');
        p.className = 'color-preset';
        p.style.backgroundColor = c;
        p.onclick = () => {
          overlay.querySelector('#g-color').value = c;
          overlay.querySelector('#g-color-hex').value = c;
        };
        presets.appendChild(p);
      });

      overlay.querySelector('#g-color').oninput = (e) => overlay.querySelector('#g-color-hex').value = e.target.value;
      overlay.querySelector('#m-cancel').onclick = () => overlay.remove();
      overlay.querySelector('#m-ok').onclick = () => {
        const name = overlay.querySelector('#g-name').value;
        const icon = overlay.querySelector('#g-icon').value;
        const color = overlay.querySelector('#g-color-hex').value;
        if (group) {
          global.StickerState.updateGroup(group.id, { name, icon, titleColor: color });
        } else {
          global.StickerState.addGroup(name, icon, color);
        }
        data.lastColor = color;
        global.StickerState.save();
        overlay.remove();
        renderBody();
      };
    }

    // 复用 dict.js 的弹窗样式
    function showConfirmModal(title, msg, onOk) {
      const overlay = document.createElement('div');
      overlay.className = 'dict-modal show';
      overlay.innerHTML = `
        <div class="dict-modal-content">
          <div class="dict-modal-title">${title}</div>
          <div style="font-size:13px; color:#2e1f19">${msg}</div>
          <div class="dict-modal-footer">
            <button class="cute-btn" id="c-cancel" style="background:#e0ede5">取消</button>
            <button class="cute-btn danger" id="c-ok">确认</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#c-cancel').onclick = () => overlay.remove();
      overlay.querySelector('#c-ok').onclick = () => { onOk(); overlay.remove(); };
    }

    global.StickerUI = {
      closePanel: () => {
        panel.classList.remove('open');
        isDeleteMode = false;
        selectedIds.clear();
      }
    };
  });
})(window);
