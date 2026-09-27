/**
 * 通用弹窗模块（全项目共用一份）
 *
 * 说明：本文件里的函数是「全局函数」，不要写成 ES Module（不要 import / export），
 *       靠 index.html 里的 <script src="js/modal.js" defer> 引入，且必须放在最前面。
 *
 * 背景：原来 escapeHtml / showConfirmModal / alertModal 这套弹窗代码
 *       在 data.js、dict.js、system.js、pat.js、main.js、sticker.js 里各抄了一遍，
 *       共 6 份。2026-09-27 分类整理时收拢到本文件，以后改弹窗只改这里。
 */

/** 把用户输入转义，避免破坏 HTML 结构 */
function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 创建一层弹窗遮罩，contentHtml 是弹窗内部内容 */
function createModalOverlay(contentHtml) {
  const overlay = document.createElement('div');
  overlay.className = 'dict-modal show';
  overlay.innerHTML = `<div class="dict-modal-content">${contentHtml}</div>`;
  document.body.appendChild(overlay);
  return overlay;
}

/** 关闭并移除弹窗（先淡出 200ms，再摘掉节点，跟 .dict-modal 的 transition 对应） */
function removeModalOverlay(overlay) {
  overlay.classList.remove('show');
  setTimeout(() => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }, 200);
}

/** 确认弹窗：标题 + 说明 + 取消/确认 两个按钮，点确认执行 onConfirm */
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

/** 提示弹窗：只有一句话 + 一个「知道了」按钮 */
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

/** 输入框弹窗：标题 + 一行说明 + 单行输入框，点确定把内容交给 onConfirm */
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

/** 批量添加弹窗：标题带分组名 + 多行文本框，每行一条 */
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
