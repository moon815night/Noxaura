/**
 * “拍一拍”管理面板交互逻辑（设置 → 拍一拍）
 * 「我的」= 我拍他时说的话；「他的」= 他拍我时说的话（对方自动回复时会用到）
 */
(function (global) {
  'use strict';

  let currentSide = 'mine';

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('pat-overlay');
    const btnOpen = document.getElementById('btn-open-pat');
    const btnClose = document.getElementById('btn-close-pat');
    const btnBack = document.getElementById('btn-back-pat');
    const listEl = document.getElementById('pat-list');
    const inputEl = document.getElementById('pat-new-input');
    const btnAdd = document.getElementById('btn-pat-add');
    const btnReset = document.getElementById('btn-pat-reset');
    const tabMine = document.getElementById('btn-pat-side-me');
    const tabHis = document.getElementById('btn-pat-side-his');

    if (!overlay || !listEl) return;

    /* ---------- 切换「我的 / 他的」 ---------- */
    function switchSide(side) {
      currentSide = (side === 'his') ? 'his' : 'mine';
      if (tabMine) tabMine.classList.toggle('active', currentSide === 'mine');
      if (tabHis) tabHis.classList.toggle('active', currentSide === 'his');
      if (inputEl) {
        inputEl.placeholder = currentSide === 'mine'
          ? '例如：{我} 拍了拍 {他} 的肩膀'
          : '例如：{他} 揉了揉 {我} 的头发';
      }
      renderList();
    }

    /* ---------- 渲染当前这一侧的内容列表 ---------- */
    function renderList() {
      listEl.innerHTML = '';
      const list = global.PatState.getList(currentSide);

      if (!list.length) {
        const empty = document.createElement('div');
        empty.className = 'pat-empty';
        empty.textContent = currentSide === 'mine'
          ? '「我的」还没有内容\n在上面输入一句话，点「添加」就行'
          : '「他的」还没有内容\n在上面输入一句话，点「添加」就行';
        empty.style.whiteSpace = 'pre-line';
        listEl.appendChild(empty);
        return;
      }

      list.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'pat-card';

        const text = document.createElement('span');
        text.className = 'pat-card-text';
        text.textContent = global.PatState.resolveText(item.text);

        const actions = document.createElement('div');
        actions.className = 'pat-card-actions';
        actions.appendChild(makeMiniBtn('edit', item));
        actions.appendChild(makeMiniBtn('del', item));

        card.appendChild(text);
        card.appendChild(actions);
        listEl.appendChild(card);
      });
    }

    function makeMiniBtn(act, item) {
      const btn = document.createElement('button');
      btn.className = act === 'del' ? 'pat-mini-btn danger' : 'pat-mini-btn';
      btn.setAttribute('aria-label', act === 'del' ? '删除' : '修改');
      btn.innerHTML = act === 'del'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2e1f19" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2e1f19" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';

      btn.addEventListener('click', () => {
        if (act === 'del') {
          showConfirm('删除这条拍一拍', `确定要删除「${global.PatState.resolveText(item.text)}」吗？`, () => {
            global.PatState.remove(currentSide, item.id);
            renderList();
          });
        } else {
          showEditModal(item.text, (newText) => {
            global.PatState.update(currentSide, item.id, newText);
            renderList();
          });
        }
      });
      return btn;
    }

    /* ---------- 添加 ---------- */
    function handleAdd() {
      if (!inputEl) return;
      const val = inputEl.value.trim();
      if (!val) {
        inputEl.focus();
        return;
      }
      global.PatState.add(currentSide, val);
      inputEl.value = '';
      renderList();
      inputEl.focus();
    }

    if (btnAdd) btnAdd.addEventListener('click', handleAdd);
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
      });
    }

    /* ---------- 恢复默认 ---------- */
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const sideName = currentSide === 'mine' ? '我的' : '他的';
        showConfirm('恢复默认', `要把「${sideName}」这一侧的内容恢复成默认的 5 条吗？当前内容会被替换。`, () => {
          global.PatState.reset(currentSide);
          renderList();
        });
      });
    }

    /* ---------- 面板开关 ---------- */
    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        const settingsOverlay = document.getElementById('settings-overlay');
        if (settingsOverlay) settingsOverlay.classList.remove('show');
        overlay.classList.add('show');
        switchSide(currentSide);
      });
    }

    function goBackToSettings() {
      overlay.classList.remove('show');
      const settingsOverlay = document.getElementById('settings-overlay');
      if (settingsOverlay) settingsOverlay.classList.add('show');
    }

    if (btnClose) btnClose.addEventListener('click', () => overlay.classList.remove('show'));
    if (btnBack) btnBack.addEventListener('click', goBackToSettings);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) goBackToSettings();
    });

    if (tabMine) tabMine.addEventListener('click', () => switchSide('mine'));
    if (tabHis) tabHis.addEventListener('click', () => switchSide('his'));

    // 供外部（如导入数据后）刷新列表
    global.PatPanel = { refresh: renderList };
  });

  /* ---------- 弹窗：修改内容 ---------- */
  function showEditModal(rawText, onSave) {
    const overlay = document.createElement('div');
    overlay.className = 'dict-modal show';
    overlay.innerHTML = `
      <div class="dict-modal-content">
        <div class="dict-modal-title">修改拍一拍内容</div>
        <input type="text" class="dict-modal-input" id="pat-edit-input" value="${escapeAttr(rawText)}">
        <div class="pat-modal-hint">用 <b>{我}</b> 代替我的昵称，<b>{他}</b> 代替他的昵称，显示时会自动换成真实昵称。</div>
        <div class="dict-modal-footer">
          <button class="cute-btn" id="pat-edit-cancel" style="background:#e0ede5;">取消</button>
          <button class="cute-btn" id="pat-edit-save">保存</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#pat-edit-input');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    overlay.querySelector('#pat-edit-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#pat-edit-save').onclick = () => {
      const val = input.value.trim();
      if (!val) { input.focus(); return; }
      overlay.remove();
      onSave(val);
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); overlay.querySelector('#pat-edit-save').click(); }
    });
  }

  /* ---------- 弹窗：确认 ---------- */
  function showConfirm(title, message, onOk) {
    const overlay = document.createElement('div');
    overlay.className = 'dict-modal show';
    overlay.innerHTML = `
      <div class="dict-modal-content">
        <div class="dict-modal-title">${escapeHtml(title)}</div>
        <div style="font-size:13px; color:#2e1f19; line-height:1.5;">${escapeHtml(message)}</div>
        <div class="dict-modal-footer">
          <button class="cute-btn" id="pat-confirm-cancel" style="background:#e0ede5;">取消</button>
          <button class="cute-btn danger" id="pat-confirm-ok">确认</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#pat-confirm-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#pat-confirm-ok').onclick = () => {
      overlay.remove();
      onOk();
    };
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }

})(window);
