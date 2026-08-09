/* ==========================================================
   goals.js — цели: дедлайны, вехи (milestones), прогресс.
   ========================================================== */

const Goals = {
  add(goal){
    const item = {
      id: Util.uid(),
      title: goal.title,
      description: goal.description || '',
      category: goal.category || '',
      deadline: goal.deadline || '',
      milestones: []
    };
    Store.addItem('goals', item);
    return item;
  },
  update(id, patch){ Store.updateItem('goals', id, patch); },
  remove(id){ Store.deleteItem('goals', id); },

  addMilestone(goalId, title){
    const g = Store.getCollection('goals').find(g => g.id === goalId);
    if(!g) return;
    const milestones = [...(g.milestones||[]), { id: Util.uid(), title, done:false }];
    Store.updateItem('goals', goalId, { milestones });
  },
  toggleMilestone(goalId, milestoneId){
    const g = Store.getCollection('goals').find(g => g.id === goalId);
    if(!g) return;
    const milestones = g.milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m);
    Store.updateItem('goals', goalId, { milestones });
  },
  removeMilestone(goalId, milestoneId){
    const g = Store.getCollection('goals').find(g => g.id === goalId);
    if(!g) return;
    Store.updateItem('goals', goalId, { milestones: g.milestones.filter(m => m.id !== milestoneId) });
  },

  progress(goal){
    if(!goal.milestones || goal.milestones.length === 0) return 0;
    return Math.round((goal.milestones.filter(m=>m.done).length / goal.milestones.length) * 100);
  },

  render(){
    const el = document.getElementById('goal-list');
    const goals = Store.getCollection('goals');
    el.innerHTML = '';
    if(goals.length === 0){
      el.innerHTML = `<div class="empty-state card"><p class="empty-title">Целей пока нет</p><p class="muted">Добавьте первую цель и разбейте её на вехи.</p></div>`;
      return;
    }
    goals.forEach(g => {
      const pct = this.progress(g);
      const card = document.createElement('div');
      card.className = 'goal-card';
      card.innerHTML = `
        <div class="goal-top">
          <div>
            <p class="goal-title">🎯 ${App.escapeHTML(g.title)}</p>
            ${g.deadline ? `<p class="goal-deadline">до ${Util.formatFriendlyDate(g.deadline)}</p>` : ''}
          </div>
          <div class="habit-actions">
            <button class="icon-btn" data-act="edit"><svg class="ic"><use href="#ic-edit"/></svg></button>
            <button class="icon-btn" data-act="delete"><svg class="ic"><use href="#ic-trash"/></svg></button>
          </div>
        </div>
        ${g.description ? `<p class="muted" style="margin:8px 0">${App.escapeHTML(g.description)}</p>` : ''}
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <ul class="topic-list" id="milestones-${g.id}">
          ${(g.milestones||[]).map(m => `
            <li class="milestone-item" data-m="${m.id}">
              <span class="mini-check ${m.done?'is-done':''}" data-role="toggle">${m.done?'✓':''}</span>
              <span style="${m.done?'text-decoration:line-through;color:var(--muted)':''}">${App.escapeHTML(m.title)}</span>
              <button class="icon-btn" data-role="remove" style="margin-left:auto"><svg class="ic"><use href="#ic-trash"/></svg></button>
            </li>`).join('') || '<li class="empty-list" style="padding:0">Вехи ещё не добавлены.</li>'}
        </ul>
        <div class="topic-add-row">
          <input type="text" placeholder="Новая веха..." id="m-input-${g.id}">
          <button class="btn-secondary" data-act="add-m">Добавить</button>
        </div>
        <div class="learn-meta-row"><span class="muted">Прогресс: ${pct}%</span></div>`;

      card.querySelectorAll('[data-role="toggle"]').forEach(elm => {
        elm.addEventListener('click', () => { this.toggleMilestone(g.id, elm.closest('[data-m]').dataset.m); App.refreshAll(); });
      });
      card.querySelectorAll('[data-role="remove"]').forEach(elm => {
        elm.addEventListener('click', () => { this.removeMilestone(g.id, elm.closest('[data-m]').dataset.m); App.refreshAll(); });
      });
      card.querySelector('[data-act="add-m"]').addEventListener('click', () => {
        const input = card.querySelector(`#m-input-${g.id}`);
        const title = input.value.trim();
        if(!title) return;
        this.addMilestone(g.id, title);
        App.refreshAll();
      });
      card.querySelector('[data-act="edit"]').addEventListener('click', () => this.openForm(g));
      card.querySelector('[data-act="delete"]').addEventListener('click', () => {
        App.confirm(`Удалить цель «${g.title}»?`, () => { this.remove(g.id); App.refreshAll(); App.toast('Цель удалена'); });
      });
      el.appendChild(card);
    });
  },

  openForm(existing){
    const isEdit = !!existing;
    const body = `
      <div class="field"><label>Название</label><input type="text" id="f-title" value="${existing ? App.escapeAttr(existing.title) : ''}" placeholder="Чего вы хотите достичь?"></div>
      <div class="field"><label>Описание</label><textarea id="f-desc">${existing ? App.escapeHTML(existing.description||'') : ''}</textarea></div>
      <div class="field"><label>Категория</label><input type="text" id="f-category" value="${existing ? App.escapeAttr(existing.category||'') : ''}" placeholder="например, Карьера, Здоровье"></div>
      <div class="field"><label>Дедлайн</label><input type="date" id="f-deadline" value="${existing ? existing.deadline||'' : ''}"></div>
      <div class="modal-actions">
        <button class="btn-secondary" id="f-cancel">Отмена</button>
        <button class="btn-primary" id="f-save">${isEdit?'Сохранить':'Добавить цель'}</button>
      </div>`;
    App.openModal(isEdit ? 'Изменить цель' : 'Новая цель', body);
    document.getElementById('f-cancel').addEventListener('click', App.closeModal);
    document.getElementById('f-save').addEventListener('click', () => {
      const title = document.getElementById('f-title').value.trim();
      if(!title){ App.toast('Укажите название цели'); return; }
      const payload = {
        title,
        description: document.getElementById('f-desc').value.trim(),
        category: document.getElementById('f-category').value.trim(),
        deadline: document.getElementById('f-deadline').value
      };
      if(isEdit) this.update(existing.id, payload);
      else this.add(payload);
      App.closeModal(); App.refreshAll();
      App.toast(isEdit?'Цель обновлена':'Цель добавлена');
    });
  }
};
