/* ==========================================================
   focus.js — таймер в стиле Pomodoro. Работает на setInterval,
   по завершении сохраняет сессию в focusSessions.
   ========================================================== */

const Focus = {
  totalSeconds: 25*60,
  remaining: 25*60,
  timerId: null,
  running: false,

  bindControls(){
    document.querySelectorAll('#focus-durations [data-min]').forEach(btn => {
      btn.addEventListener('click', () => {
        if(this.running) return;
        document.querySelectorAll('#focus-durations .seg-btn').forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        this.setDuration(Number(btn.dataset.min)*60);
      });
    });
    document.querySelector('#focus-durations [data-custom]').addEventListener('click', () => {
      if(this.running) return;
      const mins = prompt('Длительность в минутах:', '30');
      if(mins && !isNaN(mins) && Number(mins) > 0){
        document.querySelectorAll('#focus-durations .seg-btn').forEach(b=>b.classList.remove('is-active'));
        this.setDuration(Number(mins)*60);
      }
    });
    document.getElementById('focus-start').addEventListener('click', () => this.start());
    document.getElementById('focus-pause').addEventListener('click', () => this.pause());
    document.getElementById('focus-reset').addEventListener('click', () => this.reset());
  },

  setDuration(seconds){
    this.totalSeconds = seconds;
    this.remaining = seconds;
    this.updateDisplay();
  },

  start(){
    if(this.running) return;
    this.running = true;
    document.getElementById('focus-start').textContent = 'Идёт сессия…';
    document.getElementById('focus-start').disabled = true;
    document.getElementById('focus-pause').disabled = false;
    this.timerId = setInterval(() => {
      this.remaining--;
      this.updateDisplay();
      if(this.remaining <= 0){
        this.complete();
      }
    }, 1000);
  },

  pause(){
    if(!this.running) return;
    clearInterval(this.timerId);
    this.running = false;
    document.getElementById('focus-start').textContent = 'Продолжить';
    document.getElementById('focus-start').disabled = false;
    document.getElementById('focus-pause').disabled = true;
  },

  reset(){
    clearInterval(this.timerId);
    this.running = false;
    this.remaining = this.totalSeconds;
    document.getElementById('focus-start').textContent = 'Начать';
    document.getElementById('focus-start').disabled = false;
    document.getElementById('focus-pause').disabled = true;
    this.updateDisplay();
  },

  complete(){
    clearInterval(this.timerId);
    this.running = false;
    const minutes = Math.round(this.totalSeconds/60);
    const category = document.getElementById('focus-category').value;
    Store.addItem('focusSessions', { id: Util.uid(), date: Util.todayISO(), minutes, category });
    if(category === 'Обучение'){
      Store.addItem('learningSessions', { id: Util.uid(), projectId:null, date: Util.todayISO(), minutes });
    }
    App.toast('Сессия завершена — отлично поработали');
    document.getElementById('focus-start').textContent = 'Начать';
    document.getElementById('focus-start').disabled = false;
    document.getElementById('focus-pause').disabled = true;
    this.remaining = this.totalSeconds;
    this.updateDisplay();
    App.refreshAll();
  },

  updateDisplay(){
    const m = Math.floor(Math.max(this.remaining,0)/60).toString().padStart(2,'0');
    const s = Math.max(this.remaining,0)%60;
    document.getElementById('focus-display').textContent = `${m}:${s.toString().padStart(2,'0')}`;
  },

  render(){
    const today = Util.todayISO();
    const sessions = Store.getCollection('focusSessions');
    const todaySessions = sessions.filter(s => s.date === today);
    document.getElementById('focus-today-time').textContent = Util.minutesToLabel(todaySessions.reduce((s,x)=>s+x.minutes,0));
    document.getElementById('focus-today-count').textContent = todaySessions.length;

    const list = document.getElementById('focus-history');
    const recent = [...sessions].sort((a,b)=>b.id.localeCompare(a.id)).slice(0,10);
    list.innerHTML = recent.length === 0
      ? '<li class="empty-list">Сессий пока не было.</li>'
      : recent.map(s => `
        <li class="task-item">
          <div class="task-body">
            <p class="task-title">${App.escapeHTML(s.category)}</p>
            <div class="task-meta"><span class="task-date">${Util.formatFriendlyDate(s.date)}</span><span class="task-date">${Util.minutesToLabel(s.minutes)}</span></div>
          </div>
        </li>`).join('');
  }
};
