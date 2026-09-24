/**
 * “系统”管理面板交互逻辑与样式实时预览处理模块
 */
(function (global) {
  'use strict';

  let isDirty = false;

  document.addEventListener('DOMContentLoaded', () => {
    const btnOpenSystem = document.getElementById('btn-open-system');
    const systemOverlay = document.getElementById('system-overlay');
    const btnCloseSystem = document.getElementById('btn-close-system');
    const btnBackSystem = document.getElementById('btn-back-system');
    const btnSaveSystem = document.getElementById('btn-save-system');

    if (!systemOverlay) return;

    // 折叠栏逻辑
    systemOverlay.querySelectorAll('.system-fold-header').forEach((header) => {
      header.addEventListener('click', () => {
        const card = header.closest('.system-fold-card');
        if (card) card.classList.toggle('collapsed');
      });
    });

    // 打开系统面板
    if (btnOpenSystem) {
      btnOpenSystem.addEventListener('click', () => {
        const settingsOverlay = document.getElementById('settings-overlay');
        if (settingsOverlay) settingsOverlay.classList.remove('show');
        systemOverlay.classList.add('show');
        initSystemFormValues();
        renderPresetsUI();
        updateBubblePreview();
        isDirty = false;
      });
    }

    // 关闭系统面板逻辑（带未保存防误触提醒）
    function tryCloseSystem(onApproved) {
      if (isDirty) {
        showConfirmModal('未保存提醒', '您有修改尚未保存，确认要放弃并离开吗？', () => {
          isDirty = false;
          onApproved();
        });
      } else {
        onApproved();
      }
    }

    if (btnCloseSystem) {
      btnCloseSystem.addEventListener('click', () => {
        tryCloseSystem(() => systemOverlay.classList.remove('show'));
      });
    }

    if (btnBackSystem) {
      btnBackSystem.addEventListener('click', () => {
        tryCloseSystem(() => {
          systemOverlay.classList.remove('show');
          const settingsOverlay = document.getElementById('settings-overlay');
          if (settingsOverlay) settingsOverlay.classList.add('show');
        });
      });
    }

    systemOverlay.addEventListener('click', (e) => {
      if (e.target === systemOverlay) {
        tryCloseSystem(() => systemOverlay.classList.remove('show'));
      }
    });

    // 保存按钮逻辑
    if (btnSaveSystem) {
      btnSaveSystem.addEventListener('click', () => {
        saveAllFormValuesToState();
        global.applySystemStyles();
        isDirty = false;
        alertModal('系统设置已成功保存！');
      });
    }

    bindSystemEvents();
  });

  function initSystemFormValues() {
    const s = global.SystemState.getSettings();

    // 资料与头像预览
    setVal('sys-nickname-opp', s.nicknames.opponent);
    setVal('sys-nickname-me', s.nicknames.me);
    updateAvatarPreview('sys-avatar-opp-preview', s.avatars.opponent);
    updateAvatarPreview('sys-avatar-me-preview', s.avatars.me);

    // 气泡设置 (他的/我的)
    setVal('sys-bubble-opp-bg', s.bubbles.opponent.bgColor);
    setVal('sys-bubble-opp-bg-hex', s.bubbles.opponent.bgColor);
    setVal('sys-bubble-opp-stroke', s.bubbles.opponent.strokeColor);
    setVal('sys-bubble-opp-text', s.bubbles.opponent.textColor);
    setVal('sys-bubble-opp-size', s.bubbles.opponent.fontSize);

    setVal('sys-bubble-me-bg', s.bubbles.me.bgColor);
    setVal('sys-bubble-me-hex', s.bubbles.me.bgColor);
    setVal('sys-bubble-me-stroke', s.bubbles.me.strokeColor);
    setVal('sys-bubble-me-text', s.bubbles.me.textColor);
    setVal('sys-bubble-me-size', s.bubbles.me.fontSize);

    setVal('sys-bubble-css', s.bubbles.css || '');

    // 主题
    setVal('sys-theme-css', s.theme.css || '');

    // 顶底栏与背景
    setVal('sys-bar-bg', s.theme.topBottomBg);
    setVal('sys-bar-bg-hex', s.theme.topBottomBg);

    setVal('sys-chatbg-type', s.chatBg.type);
    setVal('sys-chatbg-color1', s.chatBg.color1);
    setVal('sys-chatbg-color2', s.chatBg.color2);
    setVal('sys-chatbg-grad-type', s.chatBg.gradientType);

    // 回复策略
    setVal('sys-reply-delay-min', s.replyStrategy.minDelay);
    setVal('sys-reply-delay-max', s.replyStrategy.maxDelay);
    setVal('sys-reply-count-min', s.replyStrategy.replyCountMin);
    setVal('sys-reply-count-max', s.replyStrategy.replyCountMax);
    setVal('sys-proactive-prob', s.replyStrategy.proactiveProb);
    setVal('sys-proactive-min', s.replyStrategy.proactiveIntervalMin);
    setVal('sys-proactive-max', s.replyStrategy.proactiveIntervalMax);
    setVal('sys-proactive-unit', s.replyStrategy.proactiveUnit);
  }

  function saveAllFormValuesToState() {
    global.SystemState.updateSettings({
      nicknames: {
        opponent: getVal('sys-nickname-opp'),
        me: getVal('sys-nickname-me')
      },
      bubbles: {
        opponent: {
          bgColor: getVal('sys-bubble-opp-bg'),
          strokeColor: getVal('sys-bubble-opp-stroke'),
          textColor: getVal('sys-bubble-opp-text'),
          fontSize: parseInt(getVal('sys-bubble-opp-size')) || 14
        },
        me: {
          bgColor: getVal('sys-bubble-me-bg'),
          strokeColor: getVal('sys-bubble-me-stroke'),
          textColor: getVal('sys-bubble-me-text'),
          fontSize: parseInt(getVal('sys-bubble-me-size')) || 14
        },
        css: getVal('sys-bubble-css')
      },
      theme: {
        topBottomBg: getVal('sys-bar-bg'),
        css: getVal('sys-theme-css')
      },
      chatBg: {
        type: getVal('sys-chatbg-type'),
        color1: getVal('sys-chatbg-color1'),
        color2: getVal('sys-chatbg-color2'),
        gradientType: getVal('sys-chatbg-grad-type')
      },
      replyStrategy: {
        minDelay: parseFloat(getVal('sys-reply-delay-min')) || 2,
        maxDelay: parseFloat(getVal('sys-reply-delay-max')) || 5,
        replyCountMin: parseInt(getVal('sys-reply-count-min')) || 1,
        replyCountMax: parseInt(getVal('sys-reply-count-max')) || 3,
        proactiveProb: parseInt(getVal('sys-proactive-prob')) || 20,
        proactiveIntervalMin: parseFloat(getVal('sys-proactive-min')) || 10,
        proactiveIntervalMax: parseFloat(getVal('sys-proactive-max')) || 30,
        proactiveUnit: getVal('sys-proactive-unit') || 'min'
      }
    });
  }

  function updateAvatarPreview(imgId, srcUrl) {
    const img = document.getElementById(imgId);
    if (!img) return;
    if (srcUrl) {
      img.src = srcUrl;
      img.classList.add('show');
    } else {
      img.src = '';
      img.classList.remove('show');
    }
  }

  function renderPresetsUI() {
    const s = global.SystemState.getSettings();

    // 气泡预设渲染
    const bGrid = document.getElementById('bubble-presets-grid');
    if (bGrid) {
      bGrid.innerHTML = '';
      s.bubbles.presets.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = `preset-card ${s.bubbles.activePreset === idx ? 'active' : ''}`;
        card.textContent = p.name;
        card.onclick = () => {
          setVal('sys-bubble-opp-bg', p.oppBg);
          setVal('sys-bubble-opp-bg-hex', p.oppBg);
          setVal('sys-bubble-me-bg', p.meBg);
          setVal('sys-bubble-me-hex', p.meBg);
          s.bubbles.activePreset = idx;
          renderPresetsUI();
          updateBubblePreview();
          markDirty();
        };
        bGrid.appendChild(card);
      });
    }

    // 背景预设渲染
    const bgGrid = document.getElementById('bg-presets-grid');
    if (bgGrid) {
      bgGrid.innerHTML = '';
      s.chatBg.presets.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = `preset-card ${s.chatBg.activePreset === idx ? 'active' : ''}`;
        card.textContent = p.name;
        card.onclick = () => {
          setVal('sys-chatbg-type', p.type);
          setVal('sys-chatbg-color1', p.color1);
          setVal('sys-chatbg-color2', p.color2);
          setVal('sys-chatbg-grad-type', p.gradientType);
          s.chatBg.activePreset = idx;
          renderPresetsUI();
          markDirty();
        };
        bgGrid.appendChild(card);
      });
    }
  }

  function bindSystemEvents() {
    // 头像上传
    bindImageUpload('sys-avatar-opp-file', (dataUrl) => {
      global.SystemState.updateSettings({ avatars: { opponent: dataUrl } });
      updateAvatarPreview('sys-avatar-opp-preview', dataUrl);
      markDirty();
    });
    bindImageUpload('sys-avatar-me-file', (dataUrl) => {
      global.SystemState.updateSettings({ avatars: { me: dataUrl } });
      updateAvatarPreview('sys-avatar-me-preview', dataUrl);
      markDirty();
    });

    // 昵称修改
    onInput('sys-nickname-opp', markDirty);
    onInput('sys-nickname-me', markDirty);

    // 他的气泡绑定
    bindColorSync('sys-bubble-opp-bg', 'sys-bubble-opp-bg-hex', () => {
      updateBubblePreview();
      markDirty();
    });
    onInput('sys-bubble-opp-stroke', () => {
      updateBubblePreview();
      markDirty();
    });
    onInput('sys-bubble-opp-text', () => {
      updateBubblePreview();
      markDirty();
    });
    onInput('sys-bubble-opp-size', () => {
      updateBubblePreview();
      markDirty();
    });

    // 我的气泡绑定
    bindColorSync('sys-bubble-me-bg', 'sys-bubble-me-hex', () => {
      updateBubblePreview();
      markDirty();
    });
    onInput('sys-bubble-me-stroke', () => {
      updateBubblePreview();
      markDirty();
    });
    onInput('sys-bubble-me-text', () => {
      updateBubblePreview();
      markDirty();
    });
    onInput('sys-bubble-me-size', () => {
      updateBubblePreview();
      markDirty();
    });

    // 字体上传
    bindImageUpload('sys-font-file', (fontBase64) => {
      global.SystemState.updateSettings({ fonts: { fontCustom: fontBase64 } });
      markDirty();
    });

    // 气泡 CSS 应用、复制初始与重置
    onClick('btn-apply-bubble-css', markDirty);
    onClick('btn-copy-default-bubble-css', () => {
      const defaultBubbleCss = `/* 消息气泡专属 CSS 自定义示例 */
.msg-row.opponent .bubble {
  border-radius: 14px 14px 14px 2px !important;
}
.msg-row.me .bubble {
  border-radius: 14px 14px 2px 14px !important;
}`;
      navigator.clipboard.writeText(defaultBubbleCss).then(() => alertModal('初始气泡 CSS 模板已成功复制到剪贴板！'));
    });
    onClick('btn-reset-bubble-css', () => {
      setVal('sys-bubble-css', '');
      markDirty();
    });

    // 顶底栏背景
    bindColorSync('sys-bar-bg', 'sys-bar-bg-hex', markDirty);
    bindImageUpload('sys-bar-img-file', (dataUrl) => {
      global.SystemState.updateSettings({ theme: { topBottomImg: dataUrl } });
      markDirty();
    });

    // 全局主题 CSS 应用与复制（包含顶底栏、气泡、背景及字体全套 CSS 变量）
    onClick('btn-apply-theme-css', markDirty);
    onClick('btn-copy-default-theme-css', () => {
      const defaultCss = `/* 包含顶底栏、气泡、背景及字体的全局主题 CSS */
:root {
  /* 聊天界面背景颜色与渐变 */
  --bg-gradient-center: #dcfae2;
  --bg-gradient-100: #fbfefc;

  /* 顶部栏与底部栏背景 */
  --color-bar-bg: #eef8f0;

  /* 聊天文字与描边颜色 */
  --color-text-main: #2e1f19;
  --color-stroke-bubble: #775c55;

  /* 对方与我的气泡默认背景色 */
  --color-bubble-opponent: #f2fbfc;
  --color-bubble-me: #d5eae3;
}`;
      navigator.clipboard.writeText(defaultCss).then(() => alertModal('包含全套配置的默认主题 CSS 模板已成功复制！'));
    });

    // 聊天背景
    onInput('sys-chatbg-type', markDirty);
    bindColorSync('sys-chatbg-color1', null, markDirty);
    bindColorSync('sys-chatbg-color2', null, markDirty);
    onInput('sys-chatbg-grad-type', markDirty);
    bindImageUpload('sys-chatbg-img-file', (dataUrl) => {
      global.SystemState.updateSettings({ chatBg: { type: 'image', image: dataUrl } });
      markDirty();
    });
    onClick('btn-reset-chatbg', () => {
      setVal('sys-chatbg-type', 'gradient');
      setVal('sys-chatbg-color1', '#dcfae2');
      setVal('sys-chatbg-color2', '#fbfefc');
      setVal('sys-chatbg-grad-type', 'radial');
      markDirty();
    });

    // 回复策略
    ['sys-reply-delay-min', 'sys-reply-delay-max', 'sys-reply-count-min', 'sys-reply-count-max', 'sys-proactive-prob', 'sys-proactive-min', 'sys-proactive-max', 'sys-proactive-unit'].forEach(id => {
      onInput(id, markDirty);
    });
  }

  function markDirty() {
    isDirty = true;
  }

  function updateBubblePreview() {
    const oppPrev = document.getElementById('prev-bubble-opp');
    const mePrev = document.getElementById('prev-bubble-me');

    const oppBg = getVal('sys-bubble-opp-bg');
    const oppStroke = getVal('sys-bubble-opp-stroke');
    const oppText = getVal('sys-bubble-opp-text');
    const oppSize = getVal('sys-bubble-opp-size');

    const meBg = getVal('sys-bubble-me-bg');
    const meStroke = getVal('sys-bubble-me-stroke');
    const meText = getVal('sys-bubble-me-text');
    const meSize = getVal('sys-bubble-me-size');

    if (oppPrev) {
      oppPrev.style.backgroundColor = oppBg;
      oppPrev.style.color = oppText;
      oppPrev.style.fontSize = `${parseInt(oppSize) || 14}px`;
      oppPrev.style.borderColor = oppStroke;
    }
    if (mePrev) {
      mePrev.style.backgroundColor = meBg;
      mePrev.style.color = meText;
      mePrev.style.fontSize = `${parseInt(meSize) || 14}px`;
      mePrev.style.borderColor = meStroke;
    }
  }

  function bindColorSync(colorId, hexId, onChange) {
    const cEl = document.getElementById(colorId);
    const hEl = hexId ? document.getElementById(hexId) : null;
    if (cEl) {
      cEl.addEventListener('input', (e) => {
        if (hEl) hEl.value = e.target.value;
        onChange(e.target.value);
      });
    }
    if (hEl) {
      hEl.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
          if (cEl) cEl.value = e.target.value;
          onChange(e.target.value);
        }
      });
    }
  }

  function bindImageUpload(inputId, callback) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => callback(evt.target.result);
      reader.readAsDataURL(file);
    });
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function onInput(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', (e) => fn(e.target.value));
  }

  function onClick(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
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

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})(window);
