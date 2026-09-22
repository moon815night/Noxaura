/**
 * 词库数据与状态管理模块
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'night_glow_dict_groups';
  const STICKER_KEY = 'night_glow_stickers';

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

  global.DictState = {
    getGroups() { return groups; },
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

})(window);
