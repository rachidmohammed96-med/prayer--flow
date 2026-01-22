const adhanLibrary = [
    { name: "Makkah", url: "https://www.islamcan.com/common/adhan/makkah.mp3" },
    { name: "Madinah", url: "https://www.islamcan.com/common/adhan/madinah.mp3" },
    { name: "Al-Aqsa", url: "https://www.islamcan.com/common/adhan/alaqsa.mp3" }
];

let state = {
    selectedAdhan: localStorage.getItem('adhanUrl') || adhanLibrary[0].url,
    todayTimes: null,
    isLocked: false 
};

const player = document.getElementById('adhanPlayer');

// THIS IS THE KEY: It wakes up the audio engine on the first click
function initApp() {
    player.src = state.selectedAdhan;
    player.play().then(() => {
        player.pause();
        document.getElementById('start-overlay').classList.add('hidden');
        fetchTimes();
    }).catch(() => alert("Tap again and make sure your volume is UP!"));
}

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
    
    if (state.todayTimes) {
        ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(name => {
            if (timeStr === state.todayTimes[name] && !state.isLocked) triggerLock(name);
        });
    }
}

function triggerLock(prayerName) {
    state.isLocked = true;
    document.getElementById('lockScreen').classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = prayerName.toUpperCase();
    player.src = state.selectedAdhan;
    player.play();
}

// 5 SECOND HOLD TO UNLOCK
let holdTimer;
const lockEl = document.getElementById('lockScreen');

lockEl.addEventListener('touchstart', () => {
    player.pause(); // Tap stops adhan
    holdTimer = setTimeout(() => {
        state.isLocked = false;
        lockEl.classList.add('hidden');
    }, 5000);
});

lockEl.addEventListener('touchend', () => clearTimeout(holdTimer));

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

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

setInterval(updateClock, 1000);
