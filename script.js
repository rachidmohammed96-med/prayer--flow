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

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function saveSettings() {
    const val = document.getElementById('lockInput').value;
    state.lockDuration = val;
    localStorage.setItem('lockTime', val);
    alert("Settings Saved!");
    showPage('homePage');
}

async function fetchTimes() {
    try {
        const res = await fetch('https://api.aladhan.com/v1/timings?latitude=33.5731&longitude=-7.5898&method=3');
        const json = await res.json();
        state.todayTimes = { Fajr: json.data.timings.Fajr, Dhuhr: json.data.timings.Dhuhr, Asr: json.data.timings.Asr, Maghrib: json.data.timings.Maghrib, Isha: json.data.timings.Isha };
        renderTimes();
        renderAdhanList();
    } catch (e) { console.error("API error"); }
}

function renderTimes() {
    const list = document.getElementById('prayer-list');
    list.innerHTML = Object.entries(state.todayTimes).map(([n, t]) => `<div class="line-item"><span>${n}</span><span style="color:var(--accent)">${t}</span></div>`).join('');
}

function renderAdhanList() {
    const list = document.getElementById('adhan-list');
    list.innerHTML = adhanLibrary.map(a => `<div class="line-item" onclick="selectAdhan('${a.url}')"><span>${a.name}</span><span>${state.selectedAdhan === a.url ? '✅' : ''}</span></div>`).join('');
}

function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    renderAdhanList();
}

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('main-clock').textContent = timeStr;
    document.getElementById('main-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    if (state.todayTimes) {
        Object.entries(state.todayTimes).forEach(([n, t]) => {
            if (timeStr === t && !state.isLocked) triggerLock(n);
        });
    }
}

function triggerLock(n) {
    state.isLocked = true;
    document.getElementById('lockScreen').classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = n.toUpperCase();
    const player = document.getElementById('adhanPlayer');
    player.src = state.selectedAdhan;
    player.play().catch(() => console.log("Tap screen to enable audio"));
}

document.getElementById('lockScreen').onclick = () => {
    state.isLocked = false;
    document.getElementById('lockScreen').classList.add('hidden');
    document.getElementById('adhanPlayer').pause();
};

setInterval(updateClock, 1000);
fetchTimes();
