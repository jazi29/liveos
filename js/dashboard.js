/* ==========================================================
   dashboard.js — рендер главной страницы «сегодня».
   Минимум: прогресс дня, задачи и привычки на сегодня.
   ========================================================== */

const Dashboard = {
  render(){
    const today = Util.todayISO();
    const data = Store.loadData();

    document.getElementById('dash-date').textContent =
      new Date().toLocaleDateString('ru-RU', { weekday:'long', month:'long', day:'numeric' });
    const name = (Store.getSettings().userName || '').trim();
    document.getElementById('dash-greeting').textContent = name ? `${this.greeting()}, ${name}` : this.greeting();

    const todayTasks = data.tasks.filter(t => t.date === today);
    document.getElementById('dash-tasks-count').textContent = todayTasks.length;
    this.renderMiniList('dash-tasks-list', todayTasks.map(t => ({
      id:t.id, label:t.title, done:t.completed
    })), 'task', 'На сегодня задач нет.');

    const todayHabits = data.habits;
    document.getElementById('dash-habits-count').textContent = todayHabits.length;
    this.renderMiniList('dash-habits-list', todayHabits.map(h => ({
      id:h.id, label:h.name, done:(h.completedDates||[]).includes(today)
    })), 'habit', 'Привычек пока нет.');

    const totalToday = todayTasks.length + todayHabits.length;
    const doneToday = todayTasks.filter(t=>t.completed).length +
      todayHabits.filter(h => (h.completedDates||[]).includes(today)).length;
    const pct = totalToday ? Math.round((doneToday/totalToday)*100) : 0;

    document.getElementById('dash-progress').textContent = pct + '%';
    document.getElementById('dash-progress-fill').style.width = pct + '%';
    document.getElementById('dash-progress-sub').textContent =
      totalToday === 0 ? 'Пока ничего не отмечено — начнём.' :
      pct === 100 ? 'На сегодня всё сделано.' :
      `Готово ${doneToday} из ${totalToday}.`;
  },

  renderMiniList(containerId, items, kind, emptyLabel){
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    if(items.length === 0){
      el.innerHTML = `<li class="empty-mini">${emptyLabel}</li>`;
      return;
    }
    items.slice(0,5).forEach(item => {
      const li = document.createElement('li');
      li.className = 'mini-item' + (item.done ? ' is-done' : '');
      li.innerHTML = `<span class="mini-check">${item.done ? '✓' : ''}</span><span>${App.escapeHTML(item.label)}</span>`;
      li.querySelector('.mini-check').addEventListener('click', () => {
        if(kind === 'task') Tasks.toggleComplete(item.id);
        else Habits.toggleDate(item.id, Util.todayISO());
      });
      el.appendChild(li);
    });
  },

  greeting(){
    const h = new Date().getHours();
    if(h < 5) return 'Ещё не спишь?';
    if(h < 12) return 'Доброе утро';
    if(h < 18) return 'Добрый день';
    return 'Добрый вечер';
  }
};
