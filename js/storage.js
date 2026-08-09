/* ==========================================================
   storage.js — слой хранения данных в localStorage.
   Все остальные модули читают/пишут только через Store.
   ========================================================== */

const STORAGE_KEY = 'lifeos_data_v1';

const DEFAULT_DATA = {
  tasks: [],
  habits: [],
  learningProjects: [],
  learningSessions: [],
  focusSessions: [],
  goals: [],
  calendarEvents: [],
  settings: { theme: 'light' }
};

const Store = {
  loadData(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return structuredClone(DEFAULT_DATA);
      const parsed = JSON.parse(raw);
      return { ...structuredClone(DEFAULT_DATA), ...parsed };
    }catch(err){
      console.error('LifeOS: повреждённые данные, сброс к значениям по умолчанию.', err);
      return structuredClone(DEFAULT_DATA);
    }
  },

  saveData(data){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    }catch(err){
      console.error('LifeOS: не удалось сохранить данные', err);
      return false;
    }
  },

  getCollection(name){ return this.loadData()[name] || []; },

  setCollection(name, items){
    const data = this.loadData();
    data[name] = items;
    return this.saveData(data);
  },

  addItem(name, item){
    const items = this.getCollection(name);
    items.push(item);
    this.setCollection(name, items);
    return item;
  },

  updateItem(name, id, patch){
    const items = this.getCollection(name);
    const idx = items.findIndex(i => i.id === id);
    if(idx === -1) return null;
    items[idx] = { ...items[idx], ...patch };
    this.setCollection(name, items);
    return items[idx];
  },

  deleteItem(name, id){
    this.setCollection(name, this.getCollection(name).filter(i => i.id !== id));
  },

  getSettings(){ return this.loadData().settings; },

  updateSettings(patch){
    const data = this.loadData();
    data.settings = { ...data.settings, ...patch };
    this.saveData(data);
    return data.settings;
  },

  resetAll(){ this.saveData(structuredClone(DEFAULT_DATA)); },
  exportJSON(){ return JSON.stringify(this.loadData(), null, 2); },
  importJSON(jsonString){
    const parsed = JSON.parse(jsonString);
    this.saveData({ ...structuredClone(DEFAULT_DATA), ...parsed });
  }
};

const Util = {
  uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
  todayISO(){ const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); },
  isoDaysAgo(n){ const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); },
  formatFriendlyDate(dateStr){
    if(!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', { month:'short', day:'numeric' });
  },
  minutesToLabel(mins){
    if(!mins) return '0м';
    const h = Math.floor(mins/60), m = mins%60;
    return h ? `${h}ч ${m}м` : `${m}м`;
  }
};
