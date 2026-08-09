/* ==========================================================
   statistics.js — сводные показатели и простые CSS-графики
   без внешних библиотек.
   ========================================================== */

const Statistics = {
  render(){
    const data = Store.loadData();

    // Доля выполненных задач (за всё время)
    const totalTasks = data.tasks.length;
    const doneTasks = data.tasks.filter(t=>t.completed).length;
    document.getElementById('stat-tasks-rate').textContent = totalTasks ? Math.round((doneTasks/totalTasks)*100)+'%' : '0%';

    // Средняя выполняемость привычек за 30 дней
    const habits = data.habits;
    const avgHabitRate = habits.length
      ? Math.round(habits.reduce((sum,h) => sum + Habits.completionRate(h), 0) / habits.length)
      : 0;
    document.getElementById('stat-habits-rate').textContent = avgHabitRate + '%';

    // Часы обучения и фокуса всего
    const learningMinutes = data.learningSessions.reduce((s,x)=>s+x.minutes,0);
    const focusMinutes = data.focusSessions.reduce((s,x)=>s+x.minutes,0);
    document.getElementById('stat-learning-hours').textContent = (learningMinutes/60).toFixed(1) + 'ч';
    document.getElementById('stat-focus-hours').textContent = (focusMinutes/60).toFixed(1) + 'ч';

    // Гистограмма: выполненные задачи за 7 дней
    const taskChart = document.getElementById('chart-tasks');
    const dayShort = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    const last7 = Array.from({length:7}, (_,i) => Util.isoDaysAgo(6-i));
    const taskCounts = last7.map(iso => data.tasks.filter(t => t.date === iso && t.completed).length);
    const maxTask = Math.max(1, ...taskCounts);
    taskChart.innerHTML = last7.map((iso,i) => {
      const d = new Date(iso+'T00:00:00');
      const h = Math.round((taskCounts[i]/maxTask)*100);
      return `<div class="bar-col"><div class="bar" style="height:${h}%"></div><span class="bar-label">${dayShort[d.getDay()]}</span></div>`;
    }).join('');

    // Гистограмма: минуты обучения+фокуса за 7 дней
    const focusChart = document.getElementById('chart-focus');
    const minutesByDay = last7.map(iso =>
      data.learningSessions.filter(s=>s.date===iso).reduce((s,x)=>s+x.minutes,0) +
      data.focusSessions.filter(s=>s.date===iso).reduce((s,x)=>s+x.minutes,0)
    );
    const maxMin = Math.max(1, ...minutesByDay);
    focusChart.innerHTML = last7.map((iso,i) => {
      const d = new Date(iso+'T00:00:00');
      const h = Math.round((minutesByDay[i]/maxMin)*100);
      return `<div class="bar-col"><div class="bar" style="height:${h}%"></div><span class="bar-label">${dayShort[d.getDay()]}</span></div>`;
    }).join('');

    // Текущие серии привычек
    const streaksEl = document.getElementById('chart-streaks');
    streaksEl.innerHTML = habits.length === 0
      ? '<li class="empty-mini">Привычек пока нет.</li>'
      : habits.map(h => `<li class="mini-item"><span>${h.icon}</span><span>${App.escapeHTML(h.name)} — <b class="mono">${Habits.currentStreak(h)}</b> дней</span></li>`).join('');
  }
};
