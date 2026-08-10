/* ==========================================================
   statistics.js — сводные показатели и простые CSS-графики
   без внешних библиотек.
   ========================================================== */

const Statistics = {
  render(){
    const data = Store.loadData();

    const totalTasks = data.tasks.length;
    const doneTasks = data.tasks.filter(t=>t.completed).length;
    document.getElementById('stat-tasks-rate').textContent = totalTasks ? Math.round((doneTasks/totalTasks)*100)+'%' : '0%';

    const habits = data.habits;
    const avgHabitRate = habits.length
      ? Math.round(habits.reduce((sum,h) => sum + Habits.completionRate(h), 0) / habits.length)
      : 0;
    document.getElementById('stat-habits-rate').textContent = avgHabitRate + '%';

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

    const streaksEl = document.getElementById('chart-streaks');
    streaksEl.innerHTML = habits.length === 0
      ? '<li class="empty-mini">Привычек пока нет.</li>'
      : habits.map(h => `<li class="mini-item"><span>${h.icon}</span><span>${App.escapeHTML(h.name)} — <b class="mono">${Habits.currentStreak(h)}</b> дней</span></li>`).join('');
  }
};
