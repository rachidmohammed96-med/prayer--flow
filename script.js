const adhanLibrary = [
    { name: "Makkah", url: "https://www.islamcan.com/common/adhan/makkah.mp3" },
    { name: "Madinah", url: "https://www.islamcan.com/common/adhan/madinah.mp3" },
    { name: "Al-Aqsa", url: "https://www.islamcan.com/common/adhan/alaqsa.mp3" }
];

let state = {
    lockDuration: localStorage.getItem('lockTime') || 15,
    selectedAdhan: localStorage.getItem('adhanUrl') || adhanLibrary[0].url,
    todayTimes: null,
    isLocked: false 
};

const player = document.getElementById('adhanPlayer');

// 1. INIT APP (The Speaker Wakeup)
function initApp() {
    player.src = state.selectedAdhan;
    player.play().then(() => {
        player.pause();
        document.getElementById('start-overlay').classList.add('hidden');
        fetchTimes();
    }).catch(err => alert("Please ensure volume is up and try again."));
}

// 2. NAVIGATION
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// 3. PRAYER ENGINE
async function fetchTimes() {
    const res = await fetch('https://api.aladhan.com/v1/timings?latitude=33.5731&longitude=-7.5898&method=3');
    const json = await res.json();
    state.todayTimes = json.data.timings;
    renderTimes();
    renderAdhanList();
}

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('main-clock').textContent = timeStr;
    document.getElementById('main-date').textContent = now.toDateString();
    
    if (state.todayTimes) {
        ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(name => {
            if (timeStr === state.todayTimes[name] && !state.isLocked) triggerLock(name);
        });
    }
}

// 4. LOCK SCREEN & 5 SEC HOLD
function triggerLock(prayerName) {
    state.isLocked = true;
    document.getElementById('lockScreen').classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = prayerName.toUpperCase();
    player.src = state.selectedAdhan;
    player.play();
}

let holdTimer;
const lockEl = document.getElementById('lockScreen');

const startAction = () => {
    player.pause(); // Tap stops music
    holdTimer = setTimeout(() => {
        state.isLocked = false;
        lockEl.classList.add('hidden');
    }, 5000); // 5 Seconds hold
};

const endAction = () => clearTimeout(holdTimer);

lockEl.addEventListener('touchstart', startAction);
lockEl.addEventListener('touchend', endAction);
lockEl.addEventListener('mousedown', startAction);
lockEl.addEventListener('mouseup', endAction);

// 5. SETTINGS & RENDER
function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    player.src = url;
    player.play();
    setTimeout(() => player.pause(), 5000);
    renderAdhanList();
}

function renderTimes() {
    const list = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    document.getElementById('prayer-list').innerHTML = list.map(n => `
        <div class="line-item"><span>${n}</span><span>${state.todayTimes[n]}</span></div>
    `).join('');
}

function renderAdhanList() {
    document.getElementById('adhan-list').innerHTML = adhanLibrary.map(a => `
        <div class="line-item" onclick="selectAdhan('${a.url}')">
            <span>${a.name}</span><span>${state.selectedAdhan === a.url ? '✅' : ''}</span>
        </div>
    `).join('');
}

function saveSettings() {
    state.lockDuration = document.getElementById('lockInput').value;
    localStorage.setItem('lockTime', state.lockDuration);
    showPage('homePage');
}

setInterval(updateClock, 1000);
