/* ==========================================================
   app.js — точка входа: переключение видов, тема, модалки/
   тосты/подтверждения, настройки, регистрация service worker.
   ========================================================== */

const App = {

  init(){
    this.bindNav();
    this.bindTasksView();
    this.bindHabitsView();
    this.bindLearningView();
    this.bindGoalsView();
    Focus.bindControls();
    Focus.updateDisplay();
    Calendar.bindControls();
    this.bindSettingsView();
    this.bindModalShell();
    this.refreshAll();
    this.registerServiceWorker();
  },

  bindNav(){
    document.querySelectorAll('[data-view]').forEach(btn => {
      if(btn.tagName !== 'BUTTON') return;
      btn.addEventListener('click', () => this.showView(btn.dataset.view));
    });
  },

  showView(name){
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
    document.querySelectorAll('.nav-item, .bn-item').forEach(b => b.classList.toggle('is-active', b.dataset.view === name));
    this.refreshAll();
    window.scrollTo({top:0, behavior:'smooth'});
  },

  bindTasksView(){
    document.getElementById('task-add-btn').addEventListener('click', () => Tasks.openForm());
    document.querySelectorAll('#task-filter-priority .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#task-filter-priority .seg-btn').forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        Tasks.setFilter(btn.dataset.filter);
      });
    });
    document.getElementById('task-sort').addEventListener('change', (e) => Tasks.setSort(e.target.value));
  },

  bindHabitsView(){
    document.getElementById('habit-add-btn').addEventListener('click', () => Habits.openForm());
  },

  bindLearningView(){
    document.getElementById('learning-add-btn').addEventListener('click', () => Learning.openForm());
  },

  bindGoalsView(){
    document.getElementById('goal-add-btn').addEventListener('click', () => Goals.openForm());
  },

  bindSettingsView(){
    document.getElementById('settings-export-btn').addEventListener('click', () => {
      const json = Store.exportJSON();
      const blob = new Blob([json], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifeos-backup-${Util.todayISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast('Данные экспортированы');
    });

    document.getElementById('settings-import-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try{
          Store.importJSON(reader.result);
          this.refreshAll();
          this.toast('Данные импортированы');
        }catch(err){
          this.toast('Не удалось импортировать файл');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('settings-reset-btn').addEventListener('click', () => {
      this.confirm('Сбросить все данные? Это необратимо.', () => {
        Store.resetAll();
        this.refreshAll();
        this.toast('Все данные сброшены');
      });
    });
  },

  bindModalShell(){
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-backdrop').addEventListener('click', (e) => {
      if(e.target.id === 'modal-backdrop') this.closeModal();
    });
    document.getElementById('confirm-backdrop').addEventListener('click', (e) => {
      if(e.target.id === 'confirm-backdrop') this.closeConfirm();
    });
    document.getElementById('confirm-cancel').addEventListener('click', () => this.closeConfirm());
  },

  openModal(title, bodyHTML){
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-backdrop').classList.add('is-open');
  },
  closeModal(){ document.getElementById('modal-backdrop').classList.remove('is-open'); },

  confirm(text, onConfirm){
    document.getElementById('confirm-text').textContent = text;
    document.getElementById('confirm-backdrop').classList.add('is-open');
    const okBtn = document.getElementById('confirm-ok');
    const handler = () => {
      this.closeConfirm();
      okBtn.removeEventListener('click', handler);
      onConfirm();
    };
    okBtn.addEventListener('click', handler);
  },
  closeConfirm(){ document.getElementById('confirm-backdrop').classList.remove('is-open'); },

  toast(message){
    const stack = document.getElementById('toast-stack');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  },

  refreshAll(){
    Dashboard.render();
    Tasks.render();
    Habits.render();
    Calendar.render();
    Learning.render();
    Focus.render();
    Goals.render();
    Statistics.render();
  },

  escapeHTML(str=''){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  escapeAttr(str=''){ return String(str).replace(/"/g,'&quot;'); },

  registerServiceWorker(){
    if('serviceWorker' in navigator){
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {});
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
