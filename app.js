// ===== Состояние =====
const STORAGE_KEY = 'fitnessTrackerData';
let data = loadData();
let currentDate = todayStr();
let currentDateW = todayStr();
let weekChart = null;
let workoutChart = null;

const quickFoods = [
  { name: 'Овсянка', cal: 150, p: 5, f: 3, c: 27 },
  { name: 'Куриная грудка', cal: 165, p: 31, f: 3.6, c: 0 },
  { name: 'Яйцо', cal: 70, p: 6, f: 5, c: 0.6 },
  { name: 'Банан', cal: 105, p: 1.3, f: 0.4, c: 27 },
  { name: 'Рис (100г)', cal: 130, p: 2.7, f: 0.3, c: 28 },
  { name: 'Творог', cal: 98, p: 18, f: 1.8, c: 3.3 },
  { name: 'Яблоко', cal: 52, p: 0.3, f: 0.2, c: 14 },
  { name: 'Гречка', cal: 110, p: 4, f: 1, c: 21 },
];

const quickExercises = [
  { name: 'Жим лёжа', sets: 4, reps: 10, weight: 60, duration: 15 },
  { name: 'Приседания', sets: 4, reps: 12, weight: 80, duration: 20 },
  { name: 'Становая тяга', sets: 3, reps: 8, weight: 100, duration: 20 },
  { name: 'Подтягивания', sets: 3, reps: 10, weight: 0, duration: 10 },
  { name: 'Отжимания', sets: 3, reps: 15, weight: 0, duration: 10 },
  { name: 'Бег', sets: 1, reps: 1, weight: 0, duration: 30 },
];

// ===== Инициализация =====
function init() {
  document.getElementById('dateInput').value = currentDate;
  document.getElementById('dateInputW').value = currentDateW;
  document.getElementById('goalInput').value = data.goal;
  document.getElementById('workoutGoalInput').value = data.workoutGoal;
  
  renderQuickFoods();
  renderQuickExercises();
  renderCalories();
  renderWorkouts();
  renderCaloriesChart();
  renderWorkoutsChart();
  bindEvents();
}

function bindEvents() {
  // Навигация
  document.querySelectorAll('.main-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.section}-section`).classList.add('active');
    });
  });

  // Калории
  document.getElementById('addBtn').addEventListener('click', addMeal);
  document.getElementById('dateInput').addEventListener('change', e => {
    currentDate = e.target.value;
    renderCalories();
    renderCaloriesChart();
  });
  document.getElementById('prevDay').addEventListener('click', () => shiftDay(-1, 'cal'));
  document.getElementById('nextDay').addEventListener('click', () => shiftDay(1, 'cal'));

  // Тренировки
  document.getElementById('addWorkoutBtn').addEventListener('click', addExercise);
  document.getElementById('dateInputW').addEventListener('change', e => {
    currentDateW = e.target.value;
    renderWorkouts();
    renderWorkoutsChart();
  });
  document.getElementById('prevDayW').addEventListener('click', () => shiftDay(-1, 'workout'));
  document.getElementById('nextDayW').addEventListener('click', () => shiftDay(1, 'workout'));

  // Настройки
  document.getElementById('goalInput').addEventListener('change', e => {
    data.goal = parseInt(e.target.value) || 2000;
    saveData();
    renderCalories();
    renderCaloriesChart();
  });
  document.getElementById('workoutGoalInput').addEventListener('change', e => {
    data.workoutGoal = parseInt(e.target.value) || 60;
    saveData();
    renderWorkouts();
    renderWorkoutsChart();
  });

  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importData);
  document.getElementById('clearBtn').addEventListener('click', clearAll);

  // Enter для добавления
  ['foodName','calories','protein','fat','carbs'].forEach(id => {
    document.getElementById(id).addEventListener('keypress', e => {
      if (e.key === 'Enter') addMeal();
    });
  });
  ['workoutName','sets','reps','weight','duration'].forEach(id => {
    document.getElementById(id).addEventListener('keypress', e => {
      if (e.key === 'Enter') addExercise();
    });
  });
}

// ===== Утилиты =====
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function shiftDay(days, type) {
  const dateStr = type === 'cal' ? currentDate : currentDateW;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const newDate = d.toISOString().split('T')[0];
  
  if (type === 'cal') {
    currentDate = newDate;
    document.getElementById('dateInput').value = currentDate;
    renderCalories();
    renderCaloriesChart();
  } else {
    currentDateW = newDate;
    document.getElementById('dateInputW').value = currentDateW;
    renderWorkouts();
    renderWorkoutsChart();
  }
}
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return { goal: 2000, workoutGoal: 60, meals: {}, workouts: {} };
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function getDayMeals() {
  return data.meals[currentDate] || [];
}
function getDayExercises() {
  return data.workouts[currentDateW] || [];
}
function getDayCalories(dateStr) {
  const meals = data.meals[dateStr] || [];
  return meals.reduce((sum, m) => sum + m.cal, 0);
}
function getDayWorkoutMinutes(dateStr) {
  const exercises = data.workouts[dateStr] || [];
  return exercises.reduce((sum, e) => sum + (e.duration || 0), 0);
}
function getDayVolume(dateStr) {
  const exercises = data.workouts[dateStr] || [];
  return exercises.reduce((sum, e) => sum + (e.sets * e.reps * (e.weight || 0)), 0);
}
function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const days = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  return days[d.getDay()];
}
function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}.${String(d.getMonth()+1).padStart(2,'0')}`;
}
function calculateCaloriesBurned(exercise) {
  // Примерная формула: 5 ккал/мин для силовых, 8 ккал/мин для кардио
  const duration = exercise.duration || 10;
  const isCardio = exercise.weight === 0;
  const rate = isCardio ? 8 : 5;
  return Math.round(duration * rate);
}

// ===== Действия с калориями =====
function addMeal() {
  const name = document.getElementById('foodName').value.trim();
  const cal = parseFloat(document.getElementById('calories').value);
  const p = parseFloat(document.getElementById('protein').value) || 0;
  const f = parseFloat(document.getElementById('fat').value) || 0;
  const c = parseFloat(document.getElementById('carbs').value) || 0;

  if (!name || !cal) {
    alert('Введите название и калории');
    return;
  }

  if (!data.meals[currentDate]) data.meals[currentDate] = [];
  data.meals[currentDate].push({
    id: Date.now(),
    name, cal, p, f, c,
    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  });

  saveData();
  renderCalories();
  renderCaloriesChart();
  clearFoodForm();
}

function addQuickFood(food) {
  document.getElementById('foodName').value = food.name;
  document.getElementById('calories').value = food.cal;
  document.getElementById('protein').value = food.p;
  document.getElementById('fat').value = food.f;
  document.getElementById('carbs').value = food.c;
  addMeal();
}

function deleteMeal(id) {
  if (!confirm('Удалить запись?')) return;
  data.meals[currentDate] = data.meals[currentDate].filter(m => m.id !== id);
  if (data.meals[currentDate].length === 0) delete data.meals[currentDate];
  saveData();
  renderCalories();
  renderCaloriesChart();
}

function clearFoodForm() {
  ['foodName','calories','protein','fat','carbs'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

// ===== Действия с тренировками =====
function addExercise() {
  const name = document.getElementById('workoutName').value.trim();
  const sets = parseInt(document.getElementById('sets').value) || 0;
  const reps = parseInt(document.getElementById('reps').value) || 0;
  const weight = parseFloat(document.getElementById('weight').value) || 0;
  const duration = parseInt(document.getElementById('duration').value) || 0;

  if (!name || (!sets && !duration)) {
    alert('Введите название и подходы или длительность');
    return;
  }

  if (!data.workouts[currentDateW]) data.workouts[currentDateW] = [];
  data.workouts[currentDateW].push({
    id: Date.now(),
    name, sets, reps, weight, duration
  });

  saveData();
  renderWorkouts();
  renderWorkoutsChart();
  clearWorkoutForm();
}

function addQuickExercise(exercise) {
  document.getElementById('workoutName').value = exercise.name;
  document.getElementById('sets').value = exercise.sets;
  document.getElementById('reps').value = exercise.reps;
  document.getElementById('weight').value = exercise.weight;
  document.getElementById('duration').value = exercise.duration;
  addExercise();
}

function deleteExercise(id) {
  if (!confirm('Удалить упражнение?')) return;
  data.workouts[currentDateW] = data.workouts[currentDateW].filter(e => e.id !== id);
  if (data.workouts[currentDateW].length === 0) delete data.workouts[currentDateW];
  saveData();
  renderWorkouts();
  renderWorkoutsChart();
}

function clearWorkoutForm() {
  ['workoutName','sets','reps','weight','duration'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

// ===== Экспорт/Импорт =====
function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitness-tracker-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      data = JSON.parse(ev.target.result);
      saveData();
      document.getElementById('goalInput').value = data.goal;
      document.getElementById('workoutGoalInput').value = data.workoutGoal;
      renderCalories();
      renderWorkouts();
      renderCaloriesChart();
      renderWorkoutsChart();
      alert('Данные импортированы!');
    } catch { alert('Ошибка файла'); }
  };
  reader.readAsText(file);
}

function clearAll() {
  if (!confirm('Удалить ВСЕ данные? Это действие необратимо.')) return;
  data = { goal: 2000, workoutGoal: 60, meals: {}, workouts: {} };
  saveData();
  document.getElementById('goalInput').value = 2000;
  document.getElementById('workoutGoalInput').value = 60;
  renderCalories();
  renderWorkouts();
  renderCaloriesChart();
  renderWorkoutsChart();
}

// ===== Графики =====
function renderCaloriesChart() {
  const labels = [];
  const calories = [];
  const today = new Date();
  let total = 0;
  let daysOnTarget = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const cal = getDayCalories(dateStr);
    labels.push(`${formatDateLabel(dateStr)}\n${formatShortDate(dateStr)}`);
    calories.push(cal);
    total += cal;
    if (cal > 0 && cal <= data.goal) daysOnTarget++;
  }

  const avg = Math.round(total / 7);

  document.getElementById('avgCal').textContent = avg;
  document.getElementById('totalCal').textContent = total.toLocaleString('ru-RU');
  document.getElementById('daysOnTarget').textContent = `${daysOnTarget}/7`;

  const ctx = document.getElementById('weekChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, 'rgba(102, 126, 234, 0.9)');
  gradient.addColorStop(1, 'rgba(118, 75, 162, 0.6)');

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Калории',
        data: calories,
        backgroundColor: gradient,
        borderColor: '#667eea',
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Цель',
        data: Array(7).fill(data.goal),
        type: 'line',
        borderColor: '#f44336',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        tension: 0,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(74, 74, 138, 0.95)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items) => items[0].label.replace('\n', ' '),
          label: (item) => item.datasetIndex === 0 ? `  Калории: ${item.raw} ккал` : null
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#888',
          font: { size: 11 },
          maxRotation: 0,
          callback: function(value, index) {
            return this.getLabelForValue(value).split('\n');
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
        ticks: { color: '#888', font: { size: 11 }, callback: (v) => v + ' ккал' }
      }
    }
  };

  if (weekChart) {
    weekChart.data = chartData;
    weekChart.update();
  } else {
    weekChart = new Chart(ctx, { type: 'bar', data: chartData, options });
  }
}

function renderWorkoutsChart() {
  const labels = [];
  const minutes = [];
  const today = new Date();
  let totalMinutes = 0;
  let totalWorkouts = 0;
  let totalVolume = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const mins = getDayWorkoutMinutes(dateStr);
    labels.push(`${formatDateLabel(dateStr)}\n${formatShortDate(dateStr)}`);
    minutes.push(mins);
    totalMinutes += mins;
    if (mins > 0) totalWorkouts++;
    totalVolume += getDayVolume(dateStr);
  }

  document.getElementById('weekWorkouts').textContent = totalWorkouts;
  document.getElementById('weekMinutes').textContent = totalMinutes;
  document.getElementById('weekVolume').textContent = Math.round(totalVolume).toLocaleString('ru-RU');

  const ctx = document.getElementById('workoutChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, 'rgba(76, 175, 80, 0.9)');
  gradient.addColorStop(1, 'rgba(56, 142, 60, 0.6)');

  const chartData = {
    labels: labels,
    datasets: [{
      label: 'Минуты',
      data: minutes,
      backgroundColor: gradient,
      borderColor: '#4caf50',
      borderWidth: 1,
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(56, 142, 60, 0.95)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items) => items[0].label.replace('\n', ' '),
          label: (item) => `  ${item.raw} минут`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#888',
          font: { size: 11 },
          maxRotation: 0,
          callback: function(value, index) {
            return this.getLabelForValue(value).split('\n');
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
        ticks: { color: '#888', font: { size: 11 }, callback: (v) => v + ' мин' }
      }
    }
  };

  if (workoutChart) {
    workoutChart.data = chartData;
    workoutChart.update();
  } else {
    workoutChart = new Chart(ctx, { type: 'bar', data: chartData, options });
  }
}

// ===== Рендер =====
function renderQuickFoods() {
  const list = document.getElementById('quickList');
  list.innerHTML = quickFoods.map(f =>
    `<button class="quick-item">${f.name} · ${f.cal} ккал</button>`
  ).join('');
  list.querySelectorAll('.quick-item').forEach((btn, i) => {
    btn.addEventListener('click', () => addQuickFood(quickFoods[i]));
  });
}

function renderQuickExercises() {
  const list = document.getElementById('quickExercises');
  list.innerHTML = quickExercises.map(e =>
    `<button class="quick-item">${e.name}</button>`
  ).join('');
  list.querySelectorAll('.quick-item').forEach((btn, i) => {
    btn.addEventListener('click', () => addQuickExercise(quickExercises[i]));
  });
}

function renderCalories() {
  const meals = getDayMeals();
  const totals = meals.reduce((acc, m) => ({
    cal: acc.cal + m.cal,
    p: acc.p + m.p,
    f: acc.f + m.f,
    c: acc.c + m.c
  }), { cal: 0, p: 0, f: 0, c: 0 });

  document.getElementById('consumed').textContent = Math.round(totals.cal);
  document.getElementById('goal').textContent = data.goal;
  
  const circle = document.getElementById('progressCircle');
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = circumference;
  const percent = Math.min(totals.cal / data.goal, 1);
  circle.style.strokeDashoffset = circumference * (1 - percent);
  const color = percent < 0.8 ? '#4caf50' : percent < 1 ? '#ff9800' : '#f44336';
  circle.style.stroke = color;

  document.getElementById('proteinVal').textContent = totals.p.toFixed(1);
  document.getElementById('fatVal').textContent = totals.f.toFixed(1);
  document.getElementById('carbsVal').textContent = totals.c.toFixed(1);

  const list = document.getElementById('mealsList');
  if (meals.length === 0) {
    list.innerHTML = '<li class="empty">Пока нет записей за этот день</li>';
  } else {
    list.innerHTML = meals.map(m => `
      <li class="meal-item">
        <div class="meal-info">
          <div class="meal-name">${escapeHtml(m.name)}</div>
          <div class="meal-details">Б: ${m.p} · Ж: ${m.f} · У: ${m.c} ${m.time ? '· ' + m.time : ''}</div>
        </div>
        <div class="meal-cal">${m.cal} ккал</div>
        <button class="delete-btn" data-id="${m.id}">×</button>
      </li>
    `).join('');
    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteMeal(parseInt(btn.dataset.id)));
    });
  }
}

function renderWorkouts() {
  const exercises = getDayExercises();
  const totalDuration = exercises.reduce((sum, e) => sum + (e.duration || 0), 0);
  const totalVolume = exercises.reduce((sum, e) => sum + (e.sets * e.reps * (e.weight || 0)), 0);
  const totalSets = exercises.reduce((sum, e) => sum + (e.sets || 0), 0);
  const totalBurned = exercises.reduce((sum, e) => sum + calculateCaloriesBurned(e), 0);

  document.getElementById('workoutDuration').textContent = totalDuration;
  document.getElementById('totalVolume').textContent = Math.round(totalVolume).toLocaleString('ru-RU');
  document.getElementById('totalSets').textContent = totalSets;
  document.getElementById('caloriesBurned').textContent = totalBurned;

  const circle = document.getElementById('workoutProgressCircle');
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = circumference;
  const percent = Math.min(totalDuration / data.workoutGoal, 1);
  circle.style.strokeDashoffset = circumference * (1 - percent);
  circle.style.stroke = percent < 0.8 ? '#4caf50' : percent < 1 ? '#ff9800' : '#2196f3';

  const list = document.getElementById('exercisesList');
  if (exercises.length === 0) {
    list.innerHTML = '<li class="empty">Пока нет тренировок за этот день</li>';
  } else {
    list.innerHTML = exercises.map(e => {
      const volume = e.sets * e.reps * (e.weight || 0);
      const details = [];
      if (e.sets) details.push(`${e.sets}×${e.reps}`);
      if (e.weight) details.push(`${e.weight}кг`);
      if (e.duration) details.push(`${e.duration}мин`);
      
      return `
        <li class="exercise-item">
          <div class="exercise-info">
            <div class="exercise-name">${escapeHtml(e.name)}</div>
            <div class="exercise-details">${details.join(' · ')}</div>
          </div>
          ${volume > 0 ? `<div class="exercise-volume">${Math.round(volume)} кг</div>` : ''}
          <button class="delete-btn" data-id="${e.id}">×</button>
        </li>
      `;
    }).join('');
    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteExercise(parseInt(btn.dataset.id)));
    });
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

init();
