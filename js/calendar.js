/* ==========================================================
   calendar.js — личный календарь: месячная сетка, точки-
   индикаторы задач/привычек/целей, панель выбранного дня.
   ========================================================== */

const Calendar = {
  viewDate: new Date(),   // месяц, который сейчас показан
  selectedDate: Util.todayISO(),

  monthLabel(){
    return this.viewDate.toLocaleDateString('ru-RU', { month:'long', year:'numeric' });
  },

  shiftMonth(delta){
    this.viewDate.setMonth(this.viewDate.getMonth() + delta);
    this.render();
  },

  goToday(){
    this.viewDate = new Date();
    this.selectedDate = Util.todayISO();
    this.render();
  },

  selectDate(iso){
    this.selectedDate = iso;
    this.render();
  },

  /** Что запланировано на конкретную дату. */
  itemsForDate(iso){
    const data = Store.loadData();
    return {
      tasks: data.tasks.filter(t => t.date === iso),
      habitsDone: data.habits.filter(h => (h.completedDates||[]).includes(iso)),
      goals: data.goals.filter(g => g.deadline === iso)
    };
  },

  render(){
    document.getElementById('cal-month-label').textContent = this.capitalize(this.monthLabel());

    const weekdaysEl = document.getElementById('cal-weekdays');
    weekdaysEl.innerHTML = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => `<span>${d}</span>`).join('');

    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    // Понедельник = 0 ... Воскресенье = 6
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const startDate = new Date(year, month, 1 - startOffset);

    const today = Util.todayISO();
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    for(let i=0;i<42;i++){
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const iso = cellDate.toISOString().slice(0,10);
      const isMuted = cellDate.getMonth() !== month;
      const isToday = iso === today;
      const isSelected = iso === this.selectedDate;
      const items = this.itemsForDate(iso);
      const dotCount = Math.min(items.tasks.length + (items.goals.length?1:0), 4);

      const cell = document.createElement('div');
      cell.className = 'cal-cell' + (isMuted?' is-muted':'') + (isToday?' is-today':'') + (isSelected?' is-selected':'');
      cell.innerHTML = `<span>${cellDate.getDate()}</span>` +
        (dotCount ? `<div class="cal-dots">${'<span class="cal-dot"></span>'.repeat(dotCount)}</div>` : '');
      cell.addEventListener('click', () => this.selectDate(iso));
      grid.appendChild(cell);

      // прекращаем рисовать лишнюю 6-ю неделю, если она целиком не текущий месяц и не нужна
      if(i === 34){
        const remainingAllMuted = Array.from({length:7}, (_,k) => {
          const d = new Date(startDate); d.setDate(startDate.getDate()+35+k);
          return d.getMonth() !== month;
        }).every(Boolean);
        if(remainingAllMuted) break;
      }
    }

    this.renderDayPanel();
  },

  renderDayPanel(){
    const iso = this.selectedDate;
    const d = new Date(iso + 'T00:00:00');
    document.getElementById('cal-selected-date').textContent =
      this.capitalize(d.toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' }));

    const items = this.itemsForDate(iso);
    const content = document.getElementById('cal-day-content');
    const parts = [];

    if(items.tasks.length){
      parts.push('<p class="section-title" style="margin-top:0">Задачи</p>');
      parts.push('<ul class="task-list">' + items.tasks.map(t => `
        <li class="task-item ${t.completed?'is-done':''}">
          <span class="task-check">${t.completed?'✓':''}</span>
          <div class="task-body">
            <p class="task-title">${App.escapeHTML(t.title)}</p>
            <div class="task-meta"><span class="tag">${Tasks.priorityLabel(t.priority)}</span></div>
          </div>
        </li>`).join('') + '</ul>');
    }

    if(items.habitsDone.length){
      parts.push('<p class="section-title">Привычки выполнены</p>');
      parts.push('<ul class="mini-list">' + items.habitsDone.map(h => `<li class="mini-item is-done"><span class="mini-check">✓</span><span>${App.escapeHTML(h.name)}</span></li>`).join('') + '</ul>');
    }

    if(items.goals.length){
      parts.push('<p class="section-title">Дедлайны целей</p>');
      parts.push('<ul class="mini-list">' + items.goals.map(g => `<li class="mini-item"><span>🎯 ${App.escapeHTML(g.title)}</span></li>`).join('') + '</ul>');
    }

    if(parts.length === 0){
      parts.push('<p class="empty-list">На этот день ничего не запланировано.</p>');
    }

    content.innerHTML = parts.join('');
    content.querySelectorAll('.task-check').forEach((el, idx) => {
      el.addEventListener('click', () => Tasks.toggleComplete(items.tasks[idx].id));
    });
  },

  capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); },

  bindControls(){
    document.getElementById('cal-prev').addEventListener('click', () => this.shiftMonth(-1));
    document.getElementById('cal-next').addEventListener('click', () => this.shiftMonth(1));
    document.getElementById('cal-today-btn').addEventListener('click', () => this.goToday());
    document.getElementById('cal-add-task-btn').addEventListener('click', () => Tasks.openForm(null, this.selectedDate));
  }
};
