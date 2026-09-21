/**
 * 词库数据与状态管理模块
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'night_glow_dict_groups';

  function loadGroups() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('加载词库失败', e);
    }
    return [];
  }

  function saveGroups(groups) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    } catch (e) {
      console.error('保存词库失败', e);
    }
  }

  let groups = loadGroups();

  global.DictState = {
    getGroups() {
      return groups;
    },

    setGroups(newGroups) {
      groups = newGroups;
      saveGroups(groups);
    },

    addGroup(name) {
      const cleanName = (name || '').trim();
      if (!cleanName) return null;
      const newGroup = {
        id: 'g_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: cleanName,
        items: []
      };
      groups.push(newGroup);
      saveGroups(groups);
      return newGroup;
    },

    updateGroupName(groupId, newName) {
      const cleanName = (newName || '').trim();
      if (!cleanName) return false;
      const grp = groups.find(g => g.id === groupId);
      if (grp) {
        grp.name = cleanName;
        saveGroups(groups);
        return true;
      }
      return false;
    },

    deleteGroup(groupId) {
      groups = groups.filter(g => g.id !== groupId);
      saveGroups(groups);
    },

    deleteAllGroups() {
      groups = [];
      saveGroups(groups);
    },

    /**
     * 批量添加字卡（支持单条/多条），自动去重
     */
    addCardsToGroup(groupId, cardTexts) {
      const grp = groups.find(g => g.id === groupId);
      if (!grp) return 0;

      let rawList = [];
      if (Array.isArray(cardTexts)) {
        rawList = cardTexts;
      } else if (typeof cardTexts === 'string') {
        rawList = cardTexts.split('\n');
      }

      const existingTexts = new Set(grp.items.map(item => item.text.trim()));
      let addedCount = 0;

      rawList.forEach(raw => {
        const text = raw.trim();
        if (text && !existingTexts.has(text)) {
          existingTexts.add(text);
          grp.items.push({
            id: 'c_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
            text: text
          });
          addedCount++;
        }
      });

      if (addedCount > 0) {
        saveGroups(groups);
      }
      return addedCount;
    },

    updateCardText(groupId, cardId, newText) {
      const cleanText = (newText || '').trim();
      if (!cleanText) return false;
      const grp = groups.find(g => g.id === groupId);
      if (!grp) return false;

      // 检查当前分组是否已有完全相同的字卡（排除自身）
      const exists = grp.items.some(item => item.id !== cardId && item.text === cleanText);
      if (exists) return false;

      const card = grp.items.find(item => item.id === cardId);
      if (card) {
        card.text = cleanText;
        saveGroups(groups);
        return true;
      }
      return false;
    },

    deleteCard(groupId, cardId) {
      const grp = groups.find(g => g.id === groupId);
      if (grp) {
        grp.items = grp.items.filter(item => item.id !== cardId);
        saveGroups(groups);
      }
    },

    /**
     * 从所有词库中随机抽取 1-3 条回复
     */
    getRandomCards(count = 1) {
      const allItems = [];
      groups.forEach(g => {
        g.items.forEach(item => {
          allItems.push(item.text);
        });
      });

      if (allItems.length === 0) {
        return [];
      }

      const result = [];
      for (let i = 0; i < count; i++) {
        const randIdx = Math.floor(Math.random() * allItems.length);
        result.push(allItems[randIdx]);
      }
      return result;
    }
  };

})(window);
