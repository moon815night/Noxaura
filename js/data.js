/**
 * “数据”功能管理面板交互逻辑模块
 */
(function (global) {
  'use strict';

  function getLocalDate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btnOpenData = document.getElementById('btn-open-data');
    const dataOverlay = document.getElementById('data-overlay');
    const btnCloseData = document.getElementById('btn-close-data');
    const btnBackData = document.getElementById('btn-back-data');

    const btnExportAll = document.getElementById('btn-export-all-json');
    const btnImportAll = document.getElementById('btn-import-all-json');
    const dataJsonInput = document.getElementById('data-json-input');

    const btnClearChat = document.getElementById('btn-clear-chat-history');
    const btnClearAllData = document.getElementById('btn-clear-all-data');

    const btnExportChatHtml = document.getElementById('btn-export-chat-html');
    const exportStartDate = document.getElementById('export-start-date');
    const exportEndDate = document.getElementById('export-end-date');

    if (!dataOverlay) return;

    // 绑定所有的折叠收纳卡片逻辑（默认已处于收起状态）
    document.querySelectorAll('.data-fold-header').forEach((header) => {
      header.addEventListener('click', () => {
        const card = header.closest('.data-fold-card');
        if (card) {
          card.classList.toggle('collapsed');
        }
      });
    });

    // 打开数据管理面板
    if (btnOpenData) {
      btnOpenData.addEventListener('click', () => {
        const settingsOverlay = document.getElementById('settings-overlay');
        if (settingsOverlay) settingsOverlay.classList.remove('show');
        dataOverlay.classList.add('show');
        initDefaultDates();
      });
    }

    // 关闭数据管理面板
    function closeDataSubpage() {
      dataOverlay.classList.remove('show');
    }

    if (btnCloseData) {
      btnCloseData.addEventListener('click', closeDataSubpage);
    }

    if (btnBackData) {
      btnBackData.addEventListener('click', () => {
        dataOverlay.classList.remove('show');
        const settingsOverlay = document.getElementById('settings-overlay');
        if (settingsOverlay) settingsOverlay.classList.add('show');
      });
    }

    dataOverlay.addEventListener('click', (e) => {
      if (e.target === dataOverlay) {
        closeDataSubpage();
      }
    });

    // 初始化日历导出时间选择框默认值为今天（精准使用本地时区年月日）
    function initDefaultDates() {
      const today = getLocalDate();
      if (exportStartDate && !exportStartDate.value) exportStartDate.value = today;
      if (exportEndDate && !exportEndDate.value) exportEndDate.value = today;
    }

    // 1. 导出全量 JSON 数据
    if (btnExportAll) {
      btnExportAll.addEventListener('click', () => {
        const jsonStr = global.DataState.exportAllJSON();
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `一千零一夜_全量备份_${formatDateFile(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      });
    }

    // 2. 导入全量 JSON 数据
    if (btnImportAll && dataJsonInput) {
      btnImportAll.addEventListener('click', () => {
        dataJsonInput.click();
      });

      dataJsonInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target.result;
          const ok = global.DataState.importAllJSON(content);
          if (ok) {
            alertModal('数据恢复成功！即刻刷新页面渲染最新数据。');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            alertModal('数据恢复失败：JSON 文件格式不合法或损坏');
          }
        };
        reader.readAsText(file);
        dataJsonInput.value = '';
      });
    }

    // 3. 删除聊天记录
    if (btnClearChat) {
      btnClearChat.addEventListener('click', () => {
        showConfirmModal('确认清空聊天', '确定要删除所有的本地聊天记录吗？词库与表情包将被保留。', () => {
          global.ChatState.clearHistory();
          clearChatDisplay();
          alertModal('聊天记录已清空');
        });
      });
    }

    // 4. 删除全部数据
    if (btnClearAllData) {
      btnClearAllData.addEventListener('click', () => {
        showConfirmModal('确认重置全量数据', '警告：此操作将清空聊天记录、自定义表情包、词库字卡等所有本地数据，且不可撤销！确定要重置吗？', () => {
          global.DataState.clearAllData();
          clearChatDisplay();
          alertModal('全量数据已重置');
          setTimeout(() => {
            window.location.reload();
          }, 800);
        });
      });
    }

    // 5. 带日历视图的“一千零一夜”聊天记录导出 HTML
    if (btnExportChatHtml) {
      btnExportChatHtml.addEventListener('click', () => {
        const startVal = exportStartDate.value;
        const endVal = exportEndDate.value;
        if (!startVal || !endVal) {
          alertModal('请选择导出的起止日期');
          return;
        }

        const history = global.ChatState.getHistory();
        const startTs = new Date(`${startVal}T00:00:00`).getTime();
        const endTs = new Date(`${endVal}T23:59:59`).getTime();

        const filtered = history.filter((msg) => {
          const t = msg.timestamp || Date.now();
          return t >= startTs && t <= endTs;
        });

        if (filtered.length === 0) {
          alertModal('指定日期范围内没有找到任何聊天记录');
          return;
        }

        exportChatToHTML(filtered, startVal, endVal);
      });
    }

    function exportChatToHTML(messages, startVal, endVal) {
      const nowStr = formatDateReadable(new Date());
      const msgCount = messages.length;

      let chatItemsHtml = '';
      let currentDateKey = null;

      messages.forEach((msg) => {
        const d = new Date(msg.timestamp || Date.now());
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const dateKey = `${year}-${month}-${day}`;

        if (currentDateKey !== dateKey) {
          currentDateKey = dateKey;
          chatItemsHtml += `
            <div class="chat-date-divider">
              <span>${year}年${month}月${day}日</span>
            </div>
          `;
        }

        const isMe = msg.isMe;
        const timeStr = formatMsgTime(d);

        let contentInner = '';
        let wrapperClass = 'bubble-wrapper';

        if (msg.type === 'image') {
          wrapperClass += ' image-wrapper';
          contentInner = `<div class="bubble bubble-image"><img class="bubble-image-img" src="${msg.src}"></div>`;
        } else if (msg.type === 'sticker') {
          wrapperClass += ' sticker-wrapper';
          contentInner = `<div class="bubble bubble-sticker"><img class="sticker-img" src="${msg.src}"></div>`;
        } else {
          contentInner = `<div class="bubble">${escapeHtml(msg.text || '')}</div>`;
        }

        chatItemsHtml += `
          <div class="msg-row ${isMe ? 'me' : 'opponent'}">
            <div class="avatar"></div>
            <div class="msg-column">
              <div class="${wrapperClass}">
                ${contentInner}
              </div>
              <div class="msg-time">${timeStr}</div>
            </div>
          </div>
        `;
      });

      const htmlDocument = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>一千零一夜 - 聊天记录导出</title>
  <style>
    :root {
      --bg-gradient-center: #dcfae2;
      --bg-gradient-26: #e0f8e8;
      --bg-gradient-54: #ebfbf2;
      --bg-gradient-80: #f5fdf9;
      --bg-gradient-100: #fbfefc;
      --color-bar-bg: #eef8f0;
      --color-text-main: #2e1f19;
      --color-stroke-bubble: #775c55;
      --color-bubble-me: #d5eae3;
      --color-bubble-opponent: #f2fbfc;
      --color-avatar-me-bg: #ffecf0;
      --color-avatar-opponent-bg: #000000;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at center, var(--bg-gradient-center) 0%, var(--bg-gradient-26) 26%, var(--bg-gradient-54) 54%, var(--bg-gradient-80) 80%, var(--bg-gradient-100) 100%);
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      color: var(--color-text-main);
      padding: 20px 10px;
      display: flex;
      justify-content: center;
    }
    .export-container {
      width: 100%;
      max-width: 650px;
      background: rgba(244, 251, 246, 0.95);
      border: 1.5px solid var(--color-stroke-bubble);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(46, 31, 25, 0.12);
      overflow: hidden;
    }
    .top-bar {
      background-color: var(--color-bar-bg);
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(119, 92, 85, 0.15);
    }
    .contact-name { font-size: 18px; font-weight: 700; color: var(--color-text-main); }
    .status-text { font-size: 12px; color: #775c55; }
    
    /* 导出专用固定标头 Header */
    .export-fixed-header {
      padding: 16px 18px 12px 18px;
      background: rgba(220, 250, 226, 0.45);
      text-align: center;
    }
    .export-main-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--color-text-main);
      letter-spacing: 2px;
      margin-bottom: 6px;
    }
    .export-meta-row {
      font-size: 12px;
      color: var(--color-stroke-bubble);
      line-height: 1.5;
      font-weight: 500;
    }
    
    /* 实线+虚线组合分割线 */
    .export-divider-group {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .divider-solid { height: 1px; background-color: rgba(119, 92, 85, 0.4); }
    .divider-dashed {
      height: 1px;
      background-image: linear-gradient(to right, rgba(119, 92, 85, 0.4) 4px, transparent 2px, rgba(119, 92, 85, 0.4) 1px, transparent 2px);
      background-size: 9px 1px;
      background-repeat: repeat-x;
    }
    
    .chat-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .chat-date-divider { display: flex; align-items: center; justify-content: center; margin: 12px 0 6px 0; width: 100%; }
    .chat-date-divider span {
      font-size: 11px; color: var(--color-stroke-bubble); background: rgba(220, 250, 226, 0.65);
      border: 1.2px dashed rgba(119, 92, 85, 0.35); padding: 3px 12px; border-radius: 12px; font-weight: 600;
    }
    .msg-row { display: flex; align-items: flex-start; gap: 8px; width: 100%; }
    .msg-row.me { flex-direction: row-reverse; }
    .msg-column { display: flex; flex-direction: column; max-width: 72%; }
    .msg-row.me .msg-column { align-items: flex-end; }
    .msg-row.opponent .msg-column { align-items: flex-start; }
    .msg-time {
      font-size: 10.5px;
      color: var(--color-stroke-bubble);
      margin-top: 3px;
      padding: 0 2px;
      font-weight: 500;
      font-family: "Chalkboard SE", "Comic Sans MS", "Yuanti SC", "华文细黑", cursive, sans-serif;
    }
    .avatar { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; }
    .msg-row.opponent .avatar { background-color: var(--color-avatar-opponent-bg); }
    .msg-row.me .avatar { background-color: var(--color-avatar-me-bg); }
    .bubble-wrapper { position: relative; width: fit-content; min-width: 40px; }
    .bubble {
      padding: 8px 12px; border-radius: 12px; font-size: 14px; line-height: 1.45;
      color: var(--color-text-main); word-break: break-word; border: 1.2px dashed var(--color-stroke-bubble);
    }
    .msg-row.opponent .bubble { background-color: var(--color-bubble-opponent); border-bottom-left-radius: 2px; }
    .msg-row.me .bubble { background-color: var(--color-bubble-me); border-bottom-right-radius: 2px; }
    .bubble.bubble-image, .bubble.bubble-sticker { border: none !important; background: transparent !important; padding: 0 !important; }
    .bubble-image-img { max-width: 200px; max-height: 240px; border-radius: 12px; object-fit: cover; }
    .sticker-img { max-width: 120px; max-height: 120px; }
  </style>
</head>
<body>
  <div class="export-container">
    <div class="top-bar">
      <div class="contact-name">顾时夜</div>
      <div class="status-text">在线</div>
    </div>
    <div class="export-fixed-header">
      <div class="export-main-title">一千零一夜</div>
      <div class="export-meta-row">导出时间：${nowStr}</div>
      <div class="export-meta-row">记录日期：${startVal} 至 ${endVal} &nbsp;|&nbsp; 共计 ${msgCount} 条消息</div>
      <div class="export-divider-group">
        <div class="divider-solid"></div>
        <div class="divider-dashed"></div>
      </div>
    </div>
    <div class="chat-content">
      ${chatItemsHtml}
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `一千零一夜_聊天记录_${startVal}_至_${endVal}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    }

    function formatDateFile(d) {
      return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    }

    function formatDateReadable(d) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    function escapeHtml(str) {
      return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function showConfirmModal(title, message, onConfirm) {
      const overlay = document.createElement('div');
      overlay.className = 'dict-modal show';
      overlay.innerHTML = `
        <div class="dict-modal-content">
          <div class="dict-modal-title">${escapeHtml(title)}</div>
          <div style="font-size:13px; color:#2e1f19; line-height:1.4;">${escapeHtml(message)}</div>
          <div class="dict-modal-footer">
            <button class="cute-btn" id="modal-cancel" style="background:#e0ede5;">取消</button>
            <button class="cute-btn danger" id="modal-ok">确认</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();
      overlay.querySelector('#modal-ok').onclick = () => {
        overlay.remove();
        onConfirm();
      };
    }

    function alertModal(msg) {
      const overlay = document.createElement('div');
      overlay.className = 'dict-modal show';
      overlay.innerHTML = `
        <div class="dict-modal-content">
          <div class="dict-modal-title">提示</div>
          <div style="font-size:13px; color:#2e1f19;">${escapeHtml(msg)}</div>
          <div class="dict-modal-footer">
            <button class="cute-btn" id="modal-ok">知道了</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#modal-ok').onclick = () => overlay.remove();
    }
  });
})(window);
