/**
 * 絮语（词库管理）UI与交互逻辑模块
 */
(function (global) {
  'use strict';

  // 记录分组收起/展开状态 { [groupId]: boolean } (true 代表收起)
  const collapsedMap = {};

  document.addEventListener('DOMContentLoaded', () => {
    const btnOpenDict = document.getElementById('btn-open-dict');
    const dictOverlay = document.getElementById('dict-overlay');
    const btnCloseDict = document.getElementById('btn-close-dict');
    const dictListContainer = document.getElementById('dict-list-container');
    const dictSearchInput = document.getElementById('dict-search-input');

    const btnAddGroup = document.getElementById('btn-add-group');
    const btnDeleteAll = document.getElementById('btn-delete-all-groups');
    const btnExport = document.getElementById('btn-export-cards');

    if (!dictOverlay) return;

    // 打开絮语子页面
    if (btnOpenDict) {
      btnOpenDict.addEventListener('click', () => {
        const settingsOverlay = document.getElementById('settings-overlay');
        if (settingsOverlay) settingsOverlay.classList.remove('show');

        dictOverlay.classList.add('show');
        renderDictList();
      });
    }

    // 关闭絮语子页面
    if (btnCloseDict) {
      btnCloseDict.addEventListener('click', () => {
        dictOverlay.classList.remove('show');
      });
    }

    // 点击遮罩空白处关闭
    dictOverlay.addEventListener('click', (e) => {
      if (e.target === dictOverlay) {
        dictOverlay.classList.remove('show');
      }
    });

    // 全局搜索过滤
    if (dictSearchInput) {
      dictSearchInput.addEventListener('input', () => {
        renderDictList();
      });
    }

    // 新增分组
    if (btnAddGroup) {
      btnAddGroup.addEventListener('click', () => {
        showPromptModal('新建分组', '请输入分组名称：', '', (name) => {
          if (name) {
            global.DictState.addGroup(name);
            renderDictList();
          }
        });
      });
    }

    // 批量清空所有分组
    if (btnDeleteAll) {
      btnDeleteAll.addEventListener('click', () => {
        showConfirmModal('确认清空', '确定要删除所有分组和字卡吗？此操作不可撤销。', () => {
          global.DictState.deleteAllGroups();
          renderDictList();
        });
      });
    }

    // 导出字卡
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        showExportModal();
      });
    }

    // 渲染分组与词条列表
    function renderDictList() {
      const groups = global.DictState.getGroups();
      const globalSearchText = (dictSearchInput ? dictSearchInput.value : '').trim().toLowerCase();

      dictListContainer.innerHTML = '';

      if (groups.length === 0) {
        dictListContainer.innerHTML = '<div class="dict-empty-tip">暂无词库分组，点击上方“+新建分组”开始添加吧~</div>';
        return;
      }

      let matchCount = 0;

      groups.forEach((group) => {
        const groupSearchInputVal = (document.getElementById(`search_grp_${group.id}`)?.value || '').trim().toLowerCase();
        const isCollapsed = !!collapsedMap[group.id];

        // 过滤字卡
        let filteredItems = group.items.filter((item) => {
          const matchesGlobal = !globalSearchText || item.text.toLowerCase().includes(globalSearchText);
          const matchesGroup = !groupSearchInputVal || item.text.toLowerCase().includes(groupSearchInputVal);
          return matchesGlobal && matchesGroup;
        });

        if (globalSearchText && filteredItems.length === 0) {
          return;
        }

        matchCount++;

        // 构建分组 Dom
        const card = document.createElement('div');
        card.className = `group-card ${isCollapsed ? 'collapsed' : ''}`;

        // 标头
        const header = document.createElement('div');
        header.className = 'group-header';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'group-title-wrap';
        titleWrap.innerHTML = `
          <svg class="group-toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-stroke-bubble)" stroke-width="2.5" stroke-linecap="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          <span class="group-name" title="${escapeHtml(group.name)}">${escapeHtml(group.name)}</span>
          <span class="group-badge">${group.items.length}条</span>
        `;

        titleWrap.addEventListener('click', () => {
          collapsedMap[group.id] = !collapsedMap[group.id];
          renderDictList();
        });

        // 分组操作按钮集
        const actions = document.createElement('div');
        actions.className = 'group-actions';

        const btnEditGrp = createCuteIconBtn('pencil', '修改组名');
        btnEditGrp.addEventListener('click', (e) => {
          e.stopPropagation();
          showPromptModal('修改分组名称', '请输入新的分组名称：', group.name, (newName) => {
            if (newName) {
              global.DictState.updateGroupName(group.id, newName);
              renderDictList();
            }
          });
        });

        const btnAddCards = createCuteIconBtn('plus', '添加/批量添加字卡');
        btnAddCards.addEventListener('click', (e) => {
          e.stopPropagation();
          showBatchAddModal(group.name, (text) => {
            const added = global.DictState.addCardsToGroup(group.id, text);
            alertModal(`已成功添加 ${added} 条字卡（重复内容已自动忽略）`);
            renderDictList();
          });
        });

        const btnDelGrp = createCuteIconBtn('trash', '删除分组', true);
        btnDelGrp.addEventListener('click', (e) => {
          e.stopPropagation();
          showConfirmModal('删除分组', `确认删除分组“${group.name}”及其所有内容吗？`, () => {
            global.DictState.deleteGroup(group.id);
            renderDictList();
          });
        });

        actions.appendChild(btnEditGrp);
        actions.appendChild(btnAddCards);
        actions.appendChild(btnDelGrp);

        header.appendChild(titleWrap);
        header.appendChild(actions);

        // 分组内容体
        const body = document.createElement('div');
        body.className = 'group-body';

        const groupSearchInput = document.createElement('input');
        groupSearchInput.type = 'text';
        groupSearchInput.id = `search_grp_${group.id}`;
        groupSearchInput.className = 'group-search-input';
        groupSearchInput.placeholder = '搜索组内内容...';
        groupSearchInput.value = groupSearchInputVal;
        groupSearchInput.addEventListener('input', () => {
          renderDictList();
        });

        body.appendChild(groupSearchInput);

        if (filteredItems.length === 0) {
          const emptyDiv = document.createElement('div');
          emptyDiv.style.cssText = 'font-size: 12px; color: #9dadab; padding: 6px 0; text-align: center;';
          emptyDiv.textContent = group.items.length === 0 ? '暂无字卡，点击上方“+”添加' : '无匹配词条';
          body.appendChild(emptyDiv);
        } else {
          filteredItems.forEach((item) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'card-item';

            let itemContent = `<span class="card-text">${escapeHtml(item.text)}</span>`;
            if (globalSearchText) {
              itemContent += `<span class="card-tag">属于: ${escapeHtml(group.name)}</span>`;
            }

            itemEl.innerHTML = itemContent;

            const itemActions = document.createElement('div');
            itemActions.className = 'card-actions';

            const btnEditCard = createCuteIconBtn('pencil', '编辑词条');
            btnEditCard.addEventListener('click', () => {
              showPromptModal('编辑字卡', '修改词条内容：', item.text, (newText) => {
                if (newText) {
                  const ok = global.DictState.updateCardText(group.id, item.id, newText);
                  if (!ok) {
                    alertModal('修改失败（字卡内容不能为空或已存在重复项）');
                  } else {
                    renderDictList();
                  }
                }
              });
            });

            const btnDelCard = createCuteIconBtn('trash', '删除词条', true);
            btnDelCard.addEventListener('click', () => {
              global.DictState.deleteCard(group.id, item.id);
              renderDictList();
            });

            itemActions.appendChild(btnEditCard);
            itemActions.appendChild(btnDelCard);
            itemEl.appendChild(itemActions);

            body.appendChild(itemEl);
          });
        }

        card.appendChild(header);
        card.appendChild(body);
        dictListContainer.appendChild(card);
      });

      if (globalSearchText && matchCount === 0) {
        dictListContainer.innerHTML = '<div class="dict-empty-tip">未搜索到相关字卡内容</div>';
      }
    }

    function createCuteIconBtn(type, title, isDanger = false) {
      const btn = document.createElement('button');
      btn.className = `cute-btn cute-btn-icon ${isDanger ? 'danger' : ''}`;
      btn.title = title;

      let svgPath = '';
      if (type === 'pencil') {
        svgPath = `<path d="M12 20h9" stroke-linecap="round"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>`;
      } else if (type === 'trash') {
        svgPath = `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`;
      } else if (type === 'plus') {
        svgPath = `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`;
      }

      const strokeColor = isDanger ? '#702020' : 'var(--color-stroke-main)';
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          ${svgPath}
        </svg>
      `;
      return btn;
    }

    function escapeHtml(str) {
      return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function showPromptModal(title, label, defaultValue, onConfirm) {
      const overlay = createModalOverlay(`
        <div class="dict-modal-title">${escapeHtml(title)}</div>
        <div style="font-size:12.5px; color:#775c55;">${escapeHtml(label)}</div>
        <input type="text" class="dict-modal-input" id="modal-input" value="${escapeHtml(defaultValue)}"/>
        <div class="dict-modal-footer">
          <button class="cute-btn" id="modal-cancel" style="background:#e0ede5;">取消</button>
          <button class="cute-btn" id="modal-ok">确定</button>
        </div>
      `);

      const input = overlay.querySelector('#modal-input');
      input.focus();
      input.select();

      overlay.querySelector('#modal-cancel').onclick = () => removeModalOverlay(overlay);
      overlay.querySelector('#modal-ok').onclick = () => {
        const val = input.value;
        removeModalOverlay(overlay);
        onConfirm(val);
      };
    }

    function showBatchAddModal(groupName, onConfirm) {
      const overlay = createModalOverlay(`
        <div class="dict-modal-title">添加字卡 - ${escapeHtml(groupName)}</div>
        <div style="font-size:12px; color:#775c55;">每行一条内容，支持批量粘贴添加（自动去重）：</div>
        <textarea class="dict-modal-textarea" id="modal-textarea" placeholder="例如：\n今天天气真好\n等下吃什么？\n晚安~"></textarea>
        <div class="dict-modal-footer">
          <button class="cute-btn" id="modal-cancel" style="background:#e0ede5;">取消</button>
          <button class="cute-btn" id="modal-ok">确认添加</button>
        </div>
      `);

      const textarea = overlay.querySelector('#modal-textarea');
      textarea.focus();

      overlay.querySelector('#modal-cancel').onclick = () => removeModalOverlay(overlay);
      overlay.querySelector('#modal-ok').onclick = () => {
        const val = textarea.value;
        removeModalOverlay(overlay);
        onConfirm(val);
      };
    }

    function showConfirmModal(title, message, onConfirm) {
      const overlay = createModalOverlay(`
        <div class="dict-modal-title">${escapeHtml(title)}</div>
        <div style="font-size:13px; color:#2e1f19; line-height:1.4;">${escapeHtml(message)}</div>
        <div class="dict-modal-footer">
          <button class="cute-btn" id="modal-cancel" style="background:#e0ede5;">取消</button>
          <button class="cute-btn danger" id="modal-ok">确认</button>
        </div>
      `);

      overlay.querySelector('#modal-cancel').onclick = () => removeModalOverlay(overlay);
      overlay.querySelector('#modal-ok').onclick = () => {
        removeModalOverlay(overlay);
        onConfirm();
      };
    }

    function alertModal(msg) {
      const overlay = createModalOverlay(`
        <div class="dict-modal-title">提示</div>
        <div style="font-size:13px; color:#2e1f19;">${escapeHtml(msg)}</div>
        <div class="dict-modal-footer">
          <button class="cute-btn" id="modal-ok">知道了</button>
        </div>
      `);
      overlay.querySelector('#modal-ok').onclick = () => removeModalOverlay(overlay);
    }

    function showExportModal() {
      const groups = global.DictState.getGroups();
      if (groups.length === 0) {
        alertModal('当前没有可导出的词库分组');
        return;
      }

      let optionsHtml = '<option value="__ALL__">导出全部分组</option>';
      groups.forEach((g) => {
        optionsHtml += `<option value="${g.id}">${escapeHtml(g.name)} (${g.items.length}条)</option>`;
      });

      const overlay = createModalOverlay(`
        <div class="dict-modal-title">导出字卡为 TXT</div>
        <div style="font-size:12.5px; color:#775c55;">请选择要导出的分组：</div>
        <select class="dict-modal-input" id="modal-select">
          ${optionsHtml}
        </select>
        <div class="dict-modal-footer">
          <button class="cute-btn" id="modal-cancel" style="background:#e0ede5;">取消</button>
          <button class="cute-btn" id="modal-ok">下载 TXT 文件</button>
        </div>
      `);

      overlay.querySelector('#modal-cancel').onclick = () => removeModalOverlay(overlay);
      overlay.querySelector('#modal-ok').onclick = () => {
        const selectVal = overlay.querySelector('#modal-select').value;
        removeModalOverlay(overlay);
        doExport(selectVal);
      };
    }

    function doExport(groupId) {
      const groups = global.DictState.getGroups();
      let exportLines = [];
      let filename = '字卡词库.txt';

      if (groupId === '__ALL__') {
        groups.forEach((g) => {
          exportLines.push(`=== ${g.name} ===`);
          g.items.forEach((item) => exportLines.push(item.text));
          exportLines.push('');
        });
      } else {
        const target = groups.find((g) => g.id === groupId);
        if (target) {
          filename = `${target.name}_字卡.txt`;
          target.items.forEach((item) => exportLines.push(item.text));
        }
      }

      const textBlob = new Blob([exportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(textBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    }

    function createModalOverlay(contentHtml) {
      const overlay = document.createElement('div');
      overlay.className = 'dict-modal show';
      overlay.innerHTML = `<div class="dict-modal-content">${contentHtml}</div>`;
      document.body.appendChild(overlay);
      return overlay;
    }

    function removeModalOverlay(overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
    }
  });
})(window);
