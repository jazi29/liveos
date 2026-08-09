/* ==========================================================
   tasks.js — CRUD задач + рендер вида «Задачи».
   ========================================================== */

const Tasks = {
  filterPriority: 'all',
  sortBy: 'date',

  add(task){
    const item = {
      id: Util.uid(),
      title: task.title,
      description: task.description || '',
      date: task.date || Util.todayISO(),
      priority: task.priority || 'Medium',
      category: task.category || '',
      completed: false
    };
    Store.addItem('tasks', item);
    return item;
  },

  update(id, patch){ Store.updateItem('tasks', id, patch); },
  remove(id){ Store.deleteItem('tasks', id); },

  toggleComplete(id){
    const t = Store.getCollection('tasks').find(t => t.id === id);
    if(!t) return;
    Store.updateItem('tasks', id, { completed: !t.completed });
    App.refreshAll();
    App.toast(t.completed ? 'Задача снова открыта' : 'Задача выполнена');
  },

  setFilter(p){ this.filterPriority = p; this.render(); },
  setSort(s){ this.sortBy = s; this.render(); },

  getFiltered(){
    let items = Store.getCollection('tasks');
    if(this.filterPriority !== 'all') items = items.filter(t => t.priority === this.filterPriority);
    if(this.sortBy === 'priority'){
      const order = { High:0, Medium:1, Low:2 };
      items = [...items].sort((a,b) => order[a.priority]-order[b.priority]);
    }else{
      items = [...items].sort((a,b) => (a.date||'').localeCompare(b.date||''));
    }
    return items;
  },

  priorityLabel(p){
    return { Low:'Низкий', Medium:'Средний', High:'Высокий' }[p] || p;
  },

  render(){
    const today = Util.todayISO();
    const items = this.getFiltered();

    const todayItems = items.filter(t => !t.completed && t.date === today);
    const upcomingItems = items.filter(t => !t.completed && t.date > today);
    const otherActive = items.filter(t => !t.completed && t.date < today);
    const completedItems = items.filter(t => t.completed);

    this.renderSection('tasks-today', todayItems, 'На сегодня задач нет. Добавьте одну, чтобы начать.');
    this.renderSection('tasks-upcoming', [...otherActive, ...upcomingItems], 'Пока ничего не запланировано.');
    this.renderSection('tasks-completed', completedItems, 'Выполненные задачи появятся здесь.');
  },

  renderSection(containerId, items, emptyText){
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    if(items.length === 0){
      el.innerHTML = `<li class="empty-list">${emptyText}</li>`;
      return;
    }
    items.forEach(t => {
      const li = document.createElement('li');
      li.className = 'task-item' + (t.completed ? ' is-done' : '');
      li.innerHTML = `
        <span class="task-check">${t.completed ? '✓' : ''}</span>
        <div class="task-body">
          <p class="task-title">${App.escapeHTML(t.title)}</p>
          <div class="task-meta">
            <span class="tag">${this.priorityLabel(t.priority)}</span>
            ${t.date ? `<span class="task-date">${Util.formatFriendlyDate(t.date)}</span>` : ''}
            ${t.category ? `<span class="task-date">${App.escapeHTML(t.category)}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn" data-act="edit"><svg class="ic"><use href="#ic-edit"/></svg></button>
          <button class="icon-btn" data-act="delete"><svg class="ic"><use href="#ic-trash"/></svg></button>
        </div>`;
      li.querySelector('.task-check').addEventListener('click', () => this.toggleComplete(t.id));
      li.querySelector('[data-act="edit"]').addEventListener('click', () => this.openForm(t));
      li.querySelector('[data-act="delete"]').addEventListener('click', () => {
        App.confirm(`Удалить «${t.title}»?`, () => {
          this.remove(t.id);
          App.refreshAll();
          App.toast('Задача удалена');
        });
      });
      el.appendChild(li);
    });
  },

  openForm(existing, presetDate){
    const isEdit = !!existing;
    const body = `
      <div class="field"><label>Название</label><input type="text" id="f-title" value="${existing ? App.escapeAttr(existing.title) : ''}" placeholder="Что нужно сделать?"></div>
      <div class="field"><label>Описание</label><textarea id="f-desc" placeholder="Необязательные заметки">${existing ? App.escapeHTML(existing.description||'') : ''}</textarea></div>
      <div class="field"><label>Дата</label><input type="date" id="f-date" value="${existing ? existing.date : (presetDate || Util.todayISO())}"></div>
      <div class="field"><label>Приоритет</label>
        <select id="f-priority">
          ${['Low','Medium','High'].map(p => `<option value="${p}" ${existing && existing.priority===p ? 'selected':''}>${this.priorityLabel(p)}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Категория</label><input type="text" id="f-category" value="${existing ? App.escapeAttr(existing.category||'') : ''}" placeholder="например, Работа, Личное"></div>
      <div class="modal-actions">
        <button class="btn-secondary" id="f-cancel">Отмена</button>
        <button class="btn-primary" id="f-save">${isEdit ? 'Сохранить' : 'Добавить задачу'}</button>
      </div>`;
    App.openModal(isEdit ? 'Изменить задачу' : 'Новая задача', body);

    document.getElementById('f-cancel').addEventListener('click', App.closeModal);
    document.getElementById('f-save').addEventListener('click', () => {
      const title = document.getElementById('f-title').value.trim();
      if(!title){ App.toast('Укажите название задачи'); return; }
      const payload = {
        title,
        description: document.getElementById('f-desc').value.trim(),
        date: document.getElementById('f-date').value || Util.todayISO(),
        priority: document.getElementById('f-priority').value,
        category: document.getElementById('f-category').value.trim()
      };
      if(isEdit) this.update(existing.id, payload);
      else this.add(payload);
      App.closeModal();
      App.refreshAll();
      App.toast(isEdit ? 'Задача обновлена' : 'Задача добавлена');
    });
  }
};
