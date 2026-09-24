/**
 * “系统”管理面板交互逻辑与样式实时预览处理模块
 */
(function (global) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const btnOpenSystem = document.getElementById('btn-open-system');
    const systemOverlay = document.getElementById('system-overlay');
    const btnCloseSystem = document.getElementById('btn-close-system');
    const btnBackSystem = document.getElementById('btn-back-system');

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
      });
    }

    // 关闭系统面板
    if (btnCloseSystem) {
      btnCloseSystem.addEventListener('click', () => {
        systemOverlay.classList.remove('show');
      });
    }

    if (btnBackSystem) {
      btnBackSystem.addEventListener('click', () => {
        systemOverlay.classList.remove('show');
        const settingsOverlay = document.getElementById('settings-overlay');
        if (settingsOverlay) settingsOverlay.classList.add('show');
      });
    }

    systemOverlay.addEventListener('click', (e) => {
      if (e.target === systemOverlay) {
        systemOverlay.classList.remove('show');
      }
    });

    bindSystemEvents();
  });

  function initSystemFormValues() {
    const s = global.SystemState.getSettings();

    // 资料
    setVal('sys-nickname-opp', s.nicknames.opponent);
    setVal('sys-nickname-me', s.nicknames.me);

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

    setVal('sys-global-font-size', s.fonts.globalFontSize || 14);
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
          global.SystemState.updateSettings({
            bubbles: {
              activePreset: idx,
              opponent: { bgColor: p.oppBg },
              me: { bgColor: p.meBg }
            }
          });
          initSystemFormValues();
          renderPresetsUI();
          updateBubblePreview();
          global.applySystemStyles();
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
          global.SystemState.updateSettings({
            chatBg: {
              activePreset: idx,
              type: p.type,
              color1: p.color1,
              color2: p.color2,
              gradientType: p.gradientType
            }
          });
          initSystemFormValues();
          renderPresetsUI();
          global.applySystemStyles();
        };
        bgGrid.appendChild(card);
      });
    }
  }

  function bindSystemEvents() {
    // 头像上传
    bindImageUpload('sys-avatar-opp-file', (dataUrl) => {
      global.SystemState.updateSettings({ avatars: { opponent: dataUrl } });
      global.applySystemStyles();
    });
    bindImageUpload('sys-avatar-me-file', (dataUrl) => {
      global.SystemState.updateSettings({ avatars: { me: dataUrl } });
      global.applySystemStyles();
    });

    // 昵称修改
    onInput('sys-nickname-opp', (val) => {
      global.SystemState.updateSettings({ nicknames: { opponent: val } });
      global.applySystemStyles();
    });
    onInput('sys-nickname-me', (val) => {
      global.SystemState.updateSettings({ nicknames: { me: val } });
      global.applySystemStyles();
    });

    // 他的气泡绑定
    bindColorSync('sys-bubble-opp-bg', 'sys-bubble-opp-bg-hex', (c) => {
      global.SystemState.updateSettings({ bubbles: { opponent: { bgColor: c } } });
      updateBubblePreview();
      global.applySystemStyles();
    });
    onInput('sys-bubble-opp-stroke', (val) => {
      global.SystemState.updateSettings({ bubbles: { opponent: { strokeColor: val } } });
      updateBubblePreview();
      global.applySystemStyles();
    });
    onInput('sys-bubble-opp-text', (val) => {
      global.SystemState.updateSettings({ bubbles: { opponent: { textColor: val } } });
      updateBubblePreview();
      global.applySystemStyles();
    });
    onInput('sys-bubble-opp-size', (val) => {
      global.SystemState.updateSettings({ bubbles: { opponent: { fontSize: parseInt(val) || 14 } } });
      updateBubblePreview();
      global.applySystemStyles();
    });

    // 我的气泡绑定
    bindColorSync('sys-bubble-me-bg', 'sys-bubble-me-hex', (c) => {
      global.SystemState.updateSettings({ bubbles: { me: { bgColor: c } } });
      updateBubblePreview();
      global.applySystemStyles();
    });
    onInput('sys-bubble-me-stroke', (val) => {
      global.SystemState.updateSettings({ bubbles: { me: { strokeColor: val } } });
      updateBubblePreview();
      global.applySystemStyles();
    });
    onInput('sys-bubble-me-text', (val) => {
      global.SystemState.updateSettings({ bubbles: { me: { textColor: val } } });
      updateBubblePreview();
      global.applySystemStyles();
    });
    onInput('sys-bubble-me-size', (val) => {
      global.SystemState.updateSettings({ bubbles: { me: { fontSize: parseInt(val) || 14 } } });
      updateBubblePreview();
      global.applySystemStyles();
    });

    // 字体与 CSS
    onInput('sys-global-font-size', (val) => {
      global.SystemState.updateSettings({ fonts: { globalFontSize: parseInt(val) || 14 } });
      global.applySystemStyles();
    });
    bindImageUpload('sys-font-file', (fontBase64) => {
      global.SystemState.updateSettings({ fonts: { fontCustom: fontBase64 } });
      global.applySystemStyles();
    });

    onClick('btn-apply-bubble-css', () => {
      const code = document.getElementById('sys-bubble-css').value;
      global.SystemState.updateSettings({ bubbles: { css: code } });
      global.applySystemStyles();
    });
    onClick('btn-reset-bubble-css', () => {
      document.getElementById('sys-bubble-css').value = '';
      global.SystemState.updateSettings({ bubbles: { css: '' } });
      global.applySystemStyles();
    });

    // 顶底栏背景
    bindColorSync('sys-bar-bg', 'sys-bar-bg-hex', (c) => {
      global.SystemState.updateSettings({ theme: { topBottomBg: c } });
      global.applySystemStyles();
    });
    bindImageUpload('sys-bar-img-file', (dataUrl) => {
      global.SystemState.updateSettings({ theme: { topBottomImg: dataUrl } });
      global.applySystemStyles();
    });

    // 主题 CSS
    onClick('btn-apply-theme-css', () => {
      const code = document.getElementById('sys-theme-css').value;
      global.SystemState.updateSettings({ theme: { css: code } });
      global.applySystemStyles();
    });
    onClick('btn-copy-default-theme-css', () => {
      const defaultCss = `:root {\n  --bg-gradient-center: #dcfae2;\n  --bg-gradient-100: #fbfefc;\n  --color-bar-bg: #eef8f0;\n}`;
      navigator.clipboard.writeText(defaultCss).then(() => alert('默认主题 CSS 模板已复制到剪贴板'));
    });

    // 聊天背景
    onInput('sys-chatbg-type', (val) => {
      global.SystemState.updateSettings({ chatBg: { type: val } });
      global.applySystemStyles();
    });
    bindColorSync('sys-chatbg-color1', null, (c) => {
      global.SystemState.updateSettings({ chatBg: { color1: c } });
      global.applySystemStyles();
    });
    bindColorSync('sys-chatbg-color2', null, (c) => {
      global.SystemState.updateSettings({ chatBg: { color2: c } });
      global.applySystemStyles();
    });
    onInput('sys-chatbg-grad-type', (val) => {
      global.SystemState.updateSettings({ chatBg: { gradientType: val } });
      global.applySystemStyles();
    });
    bindImageUpload('sys-chatbg-img-file', (dataUrl) => {
      global.SystemState.updateSettings({ chatBg: { type: 'image', image: dataUrl } });
      global.applySystemStyles();
    });
    onClick('btn-reset-chatbg', () => {
      global.SystemState.updateSettings({
        chatBg: { type: 'gradient', color1: '#dcfae2', color2: '#fbfefc', gradientType: 'radial', image: '' }
      });
      initSystemFormValues();
      global.applySystemStyles();
    });

    // 回复策略
    const updateReplyStrategy = () => {
      global.SystemState.updateSettings({
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
    };

    ['sys-reply-delay-min', 'sys-reply-delay-max', 'sys-reply-count-min', 'sys-reply-count-max', 'sys-proactive-prob', 'sys-proactive-min', 'sys-proactive-max', 'sys-proactive-unit'].forEach(id => {
      onInput(id, updateReplyStrategy);
    });
  }

  function updateBubblePreview() {
    const oppPrev = document.getElementById('prev-bubble-opp');
    const mePrev = document.getElementById('prev-bubble-me');
    const s = global.SystemState.getSettings();

    if (oppPrev) {
      oppPrev.style.backgroundColor = s.bubbles.opponent.bgColor;
      oppPrev.style.color = s.bubbles.opponent.textColor;
      oppPrev.style.fontSize = `${s.bubbles.opponent.fontSize}px`;
      oppPrev.style.borderColor = s.bubbles.opponent.strokeColor;
    }
    if (mePrev) {
      mePrev.style.backgroundColor = s.bubbles.me.bgColor;
      mePrev.style.color = s.bubbles.me.textColor;
      mePrev.style.fontSize = `${s.bubbles.me.fontSize}px`;
      mePrev.style.borderColor = s.bubbles.me.strokeColor;
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

})(window);
