/* ==========================================================
   learning.js — курсы/проекты обучения: темы, прогресс,
   учёт затраченного времени (пишет в learningSessions).
   ========================================================== */

const Learning = {
  add(project){
    const item = {
      id: Util.uid(),
      title: project.title,
      description: project.description || '',
      startDate: Util.todayISO(),
      targetDate: project.targetDate || '',
      topics: [],
      notes: ''
    };
    Store.addItem('learningProjects', item);
    return item;
  },
  update(id, patch){ Store.updateItem('learningProjects', id, patch); },
  remove(id){ Store.deleteItem('learningProjects', id); },

  addTopic(projectId, title){
    const p = Store.getCollection('learningProjects').find(p => p.id === projectId);
    if(!p) return;
    const topics = [...(p.topics||[]), { id: Util.uid(), title, done:false }];
    Store.updateItem('learningProjects', projectId, { topics });
  },
  toggleTopic(projectId, topicId){
    const p = Store.getCollection('learningProjects').find(p => p.id === projectId);
    if(!p) return;
    const topics = p.topics.map(t => t.id === topicId ? { ...t, done: !t.done } : t);
    Store.updateItem('learningProjects', projectId, { topics });
  },
  removeTopic(projectId, topicId){
    const p = Store.getCollection('learningProjects').find(p => p.id === projectId);
    if(!p) return;
    Store.updateItem('learningProjects', projectId, { topics: p.topics.filter(t => t.id !== topicId) });
  },

  progress(project){
    if(!project.topics || project.topics.length === 0) return 0;
    const done = project.topics.filter(t => t.done).length;
    return Math.round((done/project.topics.length)*100);
  },

  logTime(projectId, minutes){
    Store.addItem('learningSessions', { id: Util.uid(), projectId, date: Util.todayISO(), minutes });
  },

  totalTime(projectId){
    return Store.getCollection('learningSessions')
      .filter(s => s.projectId === projectId)
      .reduce((sum,s) => sum + s.minutes, 0);
  },

  render(){
    const el = document.getElementById('learning-list');
    const projects = Store.getCollection('learningProjects');
    el.innerHTML = '';
    if(projects.length === 0){
      el.innerHTML = `<div class="empty-state card"><p class="empty-title">Курсов пока нет</p><p class="muted">Добавьте первый курс, чтобы отслеживать прогресс.</p></div>`;
      return;
    }
    projects.forEach(p => {
      const pct = this.progress(p);
      const time = this.totalTime(p.id);
      const card = document.createElement('div');
      card.className = 'learn-card';
      card.innerHTML = `
        <div class="learn-top">
          <div>
            <p class="learn-title">${App.escapeHTML(p.title)}</p>
            ${p.description ? `<p class="muted">${App.escapeHTML(p.description)}</p>` : ''}
          </div>
          <div class="habit-actions">
            <button class="icon-btn" data-act="log">+⏱</button>
            <button class="icon-btn" data-act="edit"><svg class="ic"><use href="#ic-edit"/></svg></button>
            <button class="icon-btn" data-act="delete"><svg class="ic"><use href="#ic-trash"/></svg></button>
          </div>
        </div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <ul class="topic-list" id="topics-${p.id}">
          ${(p.topics||[]).map(t => `
            <li class="topic-item" data-topic="${t.id}">
              <span class="mini-check ${t.done?'is-done':''}" data-role="toggle">${t.done?'✓':''}</span>
              <span style="${t.done?'text-decoration:line-through;color:var(--muted)':''}">${App.escapeHTML(t.title)}</span>
              <button class="icon-btn" data-role="remove" style="margin-left:auto"><svg class="ic"><use href="#ic-trash"/></svg></button>
            </li>`).join('') || '<li class="empty-list" style="padding:0">Темы ещё не добавлены.</li>'}
        </ul>
        <div class="topic-add-row">
          <input type="text" placeholder="Новая тема..." id="topic-input-${p.id}">
          <button class="btn-secondary" data-act="add-topic">Добавить</button>
        </div>
        <div class="learn-meta-row">
          <span class="muted">Прогресс: ${pct}%</span>
          <span class="muted mono">Время: ${Util.minutesToLabel(time)}</span>
        </div>`;

      card.querySelectorAll('[data-role="toggle"]').forEach(elm => {
        elm.addEventListener('click', () => { this.toggleTopic(p.id, elm.closest('[data-topic]').dataset.topic); App.refreshAll(); });
      });
      card.querySelectorAll('[data-role="remove"]').forEach(elm => {
        elm.addEventListener('click', () => { this.removeTopic(p.id, elm.closest('[data-topic]').dataset.topic); App.refreshAll(); });
      });
      card.querySelector('[data-act="add-topic"]').addEventListener('click', () => {
        const input = card.querySelector(`#topic-input-${p.id}`);
        const title = input.value.trim();
        if(!title) return;
        this.addTopic(p.id, title);
        App.refreshAll();
      });
      card.querySelector('[data-act="log"]').addEventListener('click', () => {
        const mins = prompt('Сколько минут вы позанимались?', '30');
        if(mins && !isNaN(mins) && Number(mins) > 0){
          this.logTime(p.id, Number(mins));
          App.refreshAll();
          App.toast('Время добавлено');
        }
      });
      card.querySelector('[data-act="edit"]').addEventListener('click', () => this.openForm(p));
      card.querySelector('[data-act="delete"]').addEventListener('click', () => {
        App.confirm(`Удалить курс «${p.title}»?`, () => { this.remove(p.id); App.refreshAll(); App.toast('Курс удалён'); });
      });
      el.appendChild(card);
    });
  },

  openForm(existing){
    const isEdit = !!existing;
    const body = `
      <div class="field"><label>Название</label><input type="text" id="f-title" value="${existing ? App.escapeAttr(existing.title) : ''}" placeholder="например, Разработчик 1С"></div>
      <div class="field"><label>Описание</label><textarea id="f-desc">${existing ? App.escapeHTML(existing.description||'') : ''}</textarea></div>
      <div class="field"><label>Целевая дата</label><input type="date" id="f-target" value="${existing ? existing.targetDate||'' : ''}"></div>
      <div class="modal-actions">
        <button class="btn-secondary" id="f-cancel">Отмена</button>
        <button class="btn-primary" id="f-save">${isEdit?'Сохранить':'Добавить курс'}</button>
      </div>`;
    App.openModal(isEdit ? 'Изменить курс' : 'Новый курс', body);
    document.getElementById('f-cancel').addEventListener('click', App.closeModal);
    document.getElementById('f-save').addEventListener('click', () => {
      const title = document.getElementById('f-title').value.trim();
      if(!title){ App.toast('Укажите название курса'); return; }
      const payload = { title, description: document.getElementById('f-desc').value.trim(), targetDate: document.getElementById('f-target').value };
      if(isEdit) this.update(existing.id, payload);
      else this.add(payload);
      App.closeModal(); App.refreshAll();
      App.toast(isEdit?'Курс обновлён':'Курс добавлен');
    });
  }
};
