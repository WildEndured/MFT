// ===== Состояние =====
const STORAGE_KEY = 'calorieTrackerData';
let data = loadData();
let currentDate = todayStr();
let weekChart = null;

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

// ===== Инициализация =====
function init() {
  document.getElementById('dateInput').value = currentDate;
  document.getElementById('goalInput').value = data.goal;
  renderQuickFoods();
  render();
  renderChart();
  bindEvents();
}

function bindEvents() {
  document.getElementById('addBtn').addEventListener('click', addMeal);
  document.getElementById('dateInput').addEventListener('change', e => {
    currentDate = e.target.value;
    render();
  });
  document.getElementById('prevDay').addEventListener('click', () => shiftDay(-1));
  document.getElementById('nextDay').addEventListener('click', () => shiftDay(1));
  document.getElementById('goalInput').addEventListener('change', e => {
    data.goal = parseInt(e.target.value) || 2000;
    saveData();
    render();
    renderChart();
  });
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importData);
  document.getElementById('clearBtn').addEventListener('click', clearAll);

  ['foodName','calories','protein','fat','carbs'].forEach(id => {
    document.getElementById(id).addEventListener('keypress', e => {
      if (e.key === 'Enter') addMeal();
    });
  });
}

// ===== Утилиты =====
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function shiftDay(days) {
  const d = new Date(currentDate);
  d.setDate(d.getDate() + days);
  currentDate = d.toISOString().split('T')[0];
  document.getElementById('dateInput').value = currentDate;
  render();
}
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return { goal: 2000, meals: {} };
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function getDayMeals() {
  return data.meals[currentDate] || [];
}
function getDayCalories(dateStr) {
  const meals = data.meals[dateStr] || [];
  return meals.reduce((sum, m) => sum + m.cal, 0);
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

// ===== Действия =====
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
  render();
  renderChart();
  clearForm();
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
  render();
  renderChart();
}

function clearForm() {
  ['foodName','calories','protein','fat','carbs'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calorie-tracker-${todayStr()}.json`;
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
      render();
      renderChart();
      alert('Данные импортированы!');
    } catch { alert('Ошибка файла'); }
  };
  reader.readAsText(file);
}

function clearAll() {
  if (!confirm('Удалить ВСЕ данные? Это действие необратимо.')) return;
  data = { goal: 2000, meals: {} };
  saveData();
  document.getElementById('goalInput').value = 2000;
  render();
  renderChart();
}

// ===== 📊 График =====
function renderChart() {
  // Собираем данные за последние 7 дней (включая сегодня)
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

  // Обновляем статистику
  document.getElementById('avgCal').textContent = avg;
  document.getElementById('totalCal').textContent = total.toLocaleString('ru-RU');
  document.getElementById('daysOnTarget').textContent = `${daysOnTarget}/7`;

  // Создаём или обновляем график
  const ctx = document.getElementById('weekChart').getContext('2d');

  // Градиент для столбцов
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
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(74, 74, 138, 0.95)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            const label = items[0].label;
            return label.replace('\n', ' ');
          },
          label: (item) => {
            if (item.datasetIndex === 0) {
              return `  Калории: ${item.raw} ккал`;
            }
            return null;
          }
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
            const parts = this.getLabelForValue(value).split('\n');
            return parts;
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#888',
          font: { size: 11 },
          callback: (v) => v + ' ккал'
        }
      }
    }
  };

  if (weekChart) {
    weekChart.data = chartData;
    weekChart.options = options;
    weekChart.update();
  } else {
    weekChart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: options
    });
  }
}

// ===== Рендер =====
function renderQuickFoods() {
  const list = document.getElementById('quickList');
  list.innerHTML = quickFoods.map(f =>
    `<button class="quick-item" data-name="${f.name}">${f.name} · ${f.cal} ккал</button>`
  ).join('');
  list.querySelectorAll('.quick-item').forEach((btn, i) => {
    btn.addEventListener('click', () => addQuickFood(quickFoods[i]));
  });
}

function render() {
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

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

init();
