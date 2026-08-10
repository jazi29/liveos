/* ==========================================================
   habits.js — привычки: CRUD, серии, heatmap в стиле GitHub.
   ========================================================== */

const HABIT_ICONS = ['🔥','📚','💧','🏃','🧘','✍️','🎯','💪','🌱','🎨'];
const HEATMAP_DAYS = 91; // ~13 недель, как в контрибьюшн-графике GitHub

const Habits = {
  add(habit){
    const item = {
      id: Util.uid(),
      name: habit.name,
      icon: habit.icon || '🔥',
      frequency: habit.frequency || 'daily',
      targetDays: habit.targetDays || 7,
      completedDates: []
    };
    Store.addItem('habits', item);
    return item;
  },

  update(id, patch){ Store.updateItem('habits', id, patch); },
  remove(id){ Store.deleteItem('habits', id); },

  toggleDate(id, dateStr){
    const h = Store.getCollection('habits').find(h => h.id === id);
    if(!h) return;
    const dates = new Set(h.completedDates || []);
    if(dates.has(dateStr)) dates.delete(dateStr); else dates.add(dateStr);
    Store.updateItem('habits', id, { completedDates: [...dates] });
    App.refreshAll();
  },

  currentStreak(habit){
    const dates = new Set(habit.completedDates || []);
    let streak = 0;
    let cursor = new Date(); cursor.setHours(0,0,0,0);
    if(!dates.has(Util.todayISO())) cursor.setDate(cursor.getDate()-1);
    while(true){
      const iso = cursor.toISOString().slice(0,10);
      if(dates.has(iso)){ streak++; cursor.setDate(cursor.getDate()-1); } else break;
    }
    return streak;
  },

  bestStreak(habit){
    const dates = [...(habit.completedDates||[])].sort();
    if(dates.length === 0) return 0;
    let best = 1, cur = 1;
    for(let i=1;i<dates.length;i++){
      const diff = (new Date(dates[i]) - new Date(dates[i-1]))/(1000*60*60*24);
      if(diff === 1) cur++; else cur = 1;
      best = Math.max(best, cur);
    }
    return best;
  },

  completionRate(habit, days=30){
    const dates = new Set(habit.completedDates||[]);
    let done = 0;
    for(let i=0;i<days;i++) if(dates.has(Util.isoDaysAgo(i))) done++;
    return Math.round((done/days)*100);
  },

  /** Ячейки heatmap за последние HEATMAP_DAYS дней, выровненные по неделям (пн-вс). */
  heatmapCells(habit){
    const dates = new Set(habit.completedDates||[]);
    const today = Util.todayISO();
    const todayDate = new Date(today + 'T00:00:00');
    const endPad = (todayDate.getDay() + 6) % 7; // сколько дней от начала текущей недели до сегодня
    const totalCells = HEATMAP_DAYS + (6 - endPad);
    const cells = [];
    for(let i = totalCells - 1; i >= 0; i--){
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0,10);
      cells.push({ iso, done: dates.has(iso), isToday: iso === today, isFuture: d > todayDate });
    }
    return cells;
  },

  render(){
    const el = document.getElementById('habit-list');
    const habits = Store.getCollection('habits');
    el.innerHTML = '';
    if(habits.length === 0){
      el.innerHTML = `<div class="empty-state card"><p class="empty-title">Привычек пока нет</p><p class="muted">Создайте первую привычку, чтобы начать серию.</p></div>`;
      return;
    }
    habits.forEach(h => {
      const streak = this.currentStreak(h);
      const best = this.bestStreak(h);
      const rate = this.completionRate(h);
      const cells = this.heatmapCells(h);

      const card = document.createElement('div');
      card.className = 'habit-card';
      card.innerHTML = `
        <div class="habit-top">
          <div class="habit-name">
            <span class="habit-icon">${h.icon}</span>
            <div>
              <div>${App.escapeHTML(h.name)}</div>
              <div class="habit-streak">${streak > 0 ? `<b>${streak}</b> дней подряд` : 'Серия пока не начата'}</div>
            </div>
          </div>
          <div class="habit-actions">
            <button class="icon-btn" data-act="edit"><svg class="ic" viewBox="0 0 24 24"><use href="#ic-edit"/></svg></button>
            <button class="icon-btn" data-act="delete"><svg class="ic" viewBox="0 0 24 24"><use href="#ic-trash"/></svg></button>
          </div>
        </div>
        <div class="heatmap-scroll">
          <div class="heatmap-grid">
            ${cells.map(c => `<div class="heat-cell ${c.isToday?'is-today':''}" data-level="${c.done?1:0}" data-date="${c.iso}" title="${Util.formatFriendlyDate(c.iso)}${c.done ? ' — выполнено' : ''}"></div>`).join('')}
          </div>
        </div>
        <div class="habit-stats">
          <div class="habit-stat"><b>${best}</b>Лучшая серия</div>
          <div class="habit-stat"><b>${rate}%</b>За 30 дней</div>
        </div>`;
      card.querySelectorAll('.heat-cell').forEach(cellEl => {
        if(cellEl.dataset.date > Util.todayISO()) return;
        cellEl.addEventListener('click', () => this.toggleDate(h.id, cellEl.dataset.date));
      });
      card.querySelector('[data-act="edit"]').addEventListener('click', () => this.openForm(h));
      card.querySelector('[data-act="delete"]').addEventListener('click', () => {
        App.confirm(`Удалить привычку «${h.name}»? Вся история будет потеряна.`, () => {
          this.remove(h.id);
          App.refreshAll();
          App.toast('Привычка удалена');
        });
      });
      el.appendChild(card);
    });
    // прокрутить heatmap к сегодняшнему дню (крайняя правая колонка)
    el.querySelectorAll('.heatmap-scroll').forEach(s => { s.scrollLeft = s.scrollWidth; });
  },

  openForm(existing){
    const isEdit = !!existing;
    const selIcon = existing ? existing.icon : HABIT_ICONS[0];
    const body = `
      <div class="field"><label>Название</label><input type="text" id="f-name" value="${existing ? App.escapeAttr(existing.name) : ''}" placeholder="например, Читать, Учиться, Спорт"></div>
      <div class="field"><label>Иконка</label><div class="icon-row" id="f-icons">
        ${HABIT_ICONS.map(i => `<button type="button" class="emoji-opt ${i===selIcon?'is-active':''}" data-icon="${i}">${i}</button>`).join('')}
      </div></div>
      <div class="field"><label>Цель</label>
        <select id="f-frequency">
          <option value="daily" ${existing && existing.frequency==='daily'?'selected':''}>Каждый день</option>
          <option value="weekly" ${existing && existing.frequency==='weekly'?'selected':''}>Несколько раз в неделю</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="f-cancel">Отмена</button>
        <button class="btn-primary" id="f-save">${isEdit ? 'Сохранить' : 'Добавить привычку'}</button>
      </div>`;
    App.openModal(isEdit ? 'Изменить привычку' : 'Новая привычка', body);

    let pickedIcon = selIcon;
    document.querySelectorAll('#f-icons .emoji-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        pickedIcon = btn.dataset.icon;
        document.querySelectorAll('#f-icons .emoji-opt').forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });

    document.getElementById('f-cancel').addEventListener('click', App.closeModal);
    document.getElementById('f-save').addEventListener('click', () => {
      const name = document.getElementById('f-name').value.trim();
      if(!name){ App.toast('Укажите название привычки'); return; }
      const payload = { name, icon: pickedIcon, frequency: document.getElementById('f-frequency').value };
      if(isEdit) this.update(existing.id, payload);
      else this.add(payload);
      App.closeModal();
      App.refreshAll();
      App.toast(isEdit ? 'Привычка обновлена' : 'Привычка добавлена');
    });
  }
};
