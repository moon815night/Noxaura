/**
 * 词库数据、表情包、系统设置与聊天记录状态管理模块
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'night_glow_dict_groups';
  const STICKER_KEY = 'night_glow_stickers';
  const CHAT_KEY = 'night_glow_chat_history';
  const SYSTEM_KEY = 'night_glow_system_settings';

  function loadData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('加载数据失败', e);
      return null;
    }
  }

  function saveData(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('保存数据失败', e);
    }
  }

  let groups = loadData(STORAGE_KEY) || [];
  let stickerState = loadData(STICKER_KEY) || {
    myStickers: [], // { id, src, count }
    groups: [],     // { id, name, icon, titleColor, stickers: [] }
    lastColor: '#775c55',
    colorPresets: ['#775c55', '#a4deb9', '#d2c0ba']
  };
  let chatHistory = loadData(CHAT_KEY) || [];

  const defaultSystemState = {
    avatars: { opponent: '', me: '' },
    nicknames: { opponent: '顾时夜', me: '我' },
    bubbles: {
      opponent: { bgColor: '#f2fbfc', strokeColor: '#775c55', textColor: '#2e1f19', fontSize: 14 },
      me: { bgColor: '#d5eae3', strokeColor: '#775c55', textColor: '#2e1f19', fontSize: 14 },
      css: ''
    },
    globalFontSize: 14,
    theme: { topBottomBg: '#eef8f0', topBottomImg: '', css: '' },
    chatBg: { type: 'gradient', color1: '#dcfae2', color2: '#fbfefc', gradientType: 'radial', image: '' },
    replyStrategy: {
      minDelay: 2,
      maxDelay: 5,
      replyCountMin: 1,
      replyCountMax: 3,
      proactiveProb: 20,
      proactiveIntervalMin: 10,
      proactiveIntervalMax: 30,
      proactiveUnit: 'min'
    }
  };

  let systemSettings = loadData(SYSTEM_KEY) || defaultSystemState;

  global.DictState = {
    getGroups() { return groups; },
    setGroups(newGroups) { groups = newGroups; saveData(STORAGE_KEY, groups); },
    addGroup(name) {
      const cleanName = (name || '').trim();
      if (!cleanName) return null;
      const newGroup = { id: 'g_' + Date.now(), name: cleanName, items: [] };
      groups.push(newGroup);
      saveData(STORAGE_KEY, groups);
      return newGroup;
    },
    updateGroupName(groupId, newName) {
      const grp = groups.find(g => g.id === groupId);
      if (grp) { grp.name = newName.trim(); saveData(STORAGE_KEY, groups); return true; }
      return false;
    },
    deleteGroup(groupId) { groups = groups.filter(g => g.id !== groupId); saveData(STORAGE_KEY, groups); },
    deleteGroups(ids) { const s = new Set(ids); groups = groups.filter(g => !s.has(g.id)); saveData(STORAGE_KEY, groups); },
    deleteAllGroups() { groups = []; saveData(STORAGE_KEY, groups); },
    addCardsToGroup(groupId, cardTexts) {
      const grp = groups.find(g => g.id === groupId);
      if (!grp) return 0;
      const list = Array.isArray(cardTexts) ? cardTexts : cardTexts.split('\n');
      const existing = new Set(grp.items.map(i => i.text.trim()));
      let added = 0;
      list.forEach(raw => {
        const t = raw.trim();
        if (t && !existing.has(t)) {
          grp.items.push({ id: 'c_' + Date.now() + Math.random(), text: t });
          existing.add(t); added++;
        }
      });
      if (added > 0) saveData(STORAGE_KEY, groups);
      return added;
    },
    updateCardText(groupId, cardId, newText) {
      const grp = groups.find(g => g.id === groupId);
      if (!grp) return false;
      const exists = grp.items.some(i => i.id !== cardId && i.text === newText.trim());
      if (exists) return false;
      const card = grp.items.find(i => i.id === cardId);
      if (card) { card.text = newText.trim(); saveData(STORAGE_KEY, groups); return true; }
      return false;
    },
    deleteCard(groupId, cardId) {
      const grp = groups.find(g => g.id === groupId);
      if (grp) { grp.items = grp.items.filter(i => i.id !== cardId); saveData(STORAGE_KEY, groups); }
    },
    deleteCards(groupId, ids) {
      const grp = groups.find(g => g.id === groupId);
      if (grp) { const s = new Set(ids); grp.items = grp.items.filter(i => !s.has(i.id)); saveData(STORAGE_KEY, groups); }
    }
  };

  global.StickerState = {
    getData() { return stickerState; },
    setData(newData) { stickerState = newData; saveData(STICKER_KEY, stickerState); },
    save() { saveData(STICKER_KEY, stickerState); },
    addMyStickers(srcs) {
      srcs.forEach(src => {
        stickerState.myStickers.push({ id: 's_' + Date.now() + Math.random(), src, count: 0 });
      });
      this.save();
    },
    deleteMyStickers(ids) {
      const s = new Set(ids);
      stickerState.myStickers = stickerState.myStickers.filter(i => !s.has(i.id));
      this.save();
    },
    recordUsage(id) {
      const s = stickerState.myStickers.find(i => i.id === id);
      if (s) { s.count = (s.count || 0) + 1; this.save(); }
    },
    addGroup(name, icon, color) {
      const newGroup = {
        id: 'sg_' + Date.now(),
        name: name.trim(),
        icon: icon || '',
        titleColor: color || stickerState.lastColor,
        stickers: []
      };
      stickerState.groups.push(newGroup);
      this.save();
      return newGroup;
    },
    updateGroup(id, data) {
      const g = stickerState.groups.find(i => i.id === id);
      if (g) { Object.assign(g, data); this.save(); }
    },
    deleteGroup(id) {
      stickerState.groups = stickerState.groups.filter(i => i.id !== id);
      this.save();
    },
    addStickersToGroup(groupId, srcs) {
      const g = stickerState.groups.find(i => i.id === groupId);
      if (g) {
        srcs.forEach(src => g.stickers.push({ id: 's_' + Date.now() + Math.random(), src }));
        this.save();
      }
    },
    deleteStickersFromGroup(groupId, ids) {
      const g = stickerState.groups.find(i => i.id === groupId);
      if (g) {
        const s = new Set(ids);
        g.stickers = g.stickers.filter(i => !s.has(i.id));
        this.save();
      }
    },
    getRandomReplyContent(count = 1) {
      const pool = [];
      groups.forEach(g => g.items.forEach(i => pool.push({ type: 'text', val: i.text })));
      stickerState.groups.forEach(g => g.stickers.forEach(i => pool.push({ type: 'sticker', val: i.src })));
      if (pool.length === 0) return [{ type: 'text', val: '嗯。' }];
      const res = [];
      for (let i = 0; i < count; i++) res.push(pool[Math.floor(Math.random() * pool.length)]);
      return res;
    }
  };

  global.SystemState = {
    getSettings() { return systemSettings; },
    setSettings(newSettings) {
      systemSettings = Object.assign({}, defaultSystemState, newSettings);
      saveData(SYSTEM_KEY, systemSettings);
    },
    updateSettings(partial) {
      if (partial.avatars) Object.assign(systemSettings.avatars, partial.avatars);
      if (partial.nicknames) Object.assign(systemSettings.nicknames, partial.nicknames);
      if (partial.bubbles) {
        if (partial.bubbles.opponent) Object.assign(systemSettings.bubbles.opponent, partial.bubbles.opponent);
        if (partial.bubbles.me) Object.assign(systemSettings.bubbles.me, partial.bubbles.me);
        if (partial.bubbles.css !== undefined) systemSettings.bubbles.css = partial.bubbles.css;
      }
      if (partial.globalFontSize !== undefined) systemSettings.globalFontSize = partial.globalFontSize;
      if (partial.theme) Object.assign(systemSettings.theme, partial.theme);
      if (partial.chatBg) Object.assign(systemSettings.chatBg, partial.chatBg);
      if (partial.replyStrategy) Object.assign(systemSettings.replyStrategy, partial.replyStrategy);

      saveData(SYSTEM_KEY, systemSettings);
    }
  };

  global.ChatState = {
    getHistory() { return chatHistory; },
    addMessage(msg) {
      chatHistory.push(msg);
      saveData(CHAT_KEY, chatHistory);
    },
    clearHistory() {
      chatHistory = [];
      saveData(CHAT_KEY, chatHistory);
    },
    setHistory(newHistory) {
      chatHistory = newHistory || [];
      saveData(CHAT_KEY, chatHistory);
    }
  };

  global.DataState = {
    exportAllJSON() {
      const allData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        dictGroups: groups,
        stickers: stickerState,
        system: systemSettings,
        chatHistory: chatHistory
      };
      return JSON.stringify(allData, null, 2);
    },
    importAllJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.dictGroups && Array.isArray(parsed.dictGroups)) {
          global.DictState.setGroups(parsed.dictGroups);
        }
        if (parsed.stickers) {
          global.StickerState.setData(parsed.stickers);
        }
        if (parsed.system) {
          global.SystemState.setSettings(parsed.system);
        }
        if (parsed.chatHistory && Array.isArray(parsed.chatHistory)) {
          global.ChatState.setHistory(parsed.chatHistory);
        }
        return true;
      } catch (e) {
        console.error('导入 JSON 失败', e);
        return false;
      }
    },
    clearAllData() {
      global.DictState.deleteAllGroups();
      global.StickerState.setData({
        myStickers: [],
        groups: [],
        lastColor: '#775c55',
        colorPresets: ['#775c55', '#a4deb9', '#d2c0ba']
      });
      global.SystemState.setSettings(defaultSystemState);
      global.ChatState.clearHistory();
    }
  };

})(window);
