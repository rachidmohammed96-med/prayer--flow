const adhanLibrary = [
    { name: "Makkah (M. Al-Khafaji)", url: "https://www.islamcan.com/common/adhan/makkah.mp3" },
    { name: "Madinah", url: "https://www.islamcan.com/common/adhan/madinah.mp3" },
    { name: "Al-Aqsa", url: "https://www.islamcan.com/common/adhan/alaqsa.mp3" },
    { name: "Egypt (M. Al-Minshawi)", url: "https://www.islamcan.com/common/adhan/egypt.mp3" },
    { name: "Turkey", url: "https://www.islamcan.com/common/adhan/turkey.mp3" }
];

let state = {
    lockDuration: localStorage.getItem('lockTime') || 15,
    selectedAdhan: localStorage.getItem('adhanUrl') || adhanLibrary[0].url,
    todayTimes: null
};

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('main-clock').textContent = timeStr;
    document.getElementById('main-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    // Check for prayer match
    if (state.todayTimes) {
        Object.entries(state.todayTimes).forEach(([name, time]) => {
            if (timeStr === time && !state.isLocked) triggerLock(name);
        });
    }
}

async function fetchTimes() {
    try {
        const res = await fetch('https://api.aladhan.com/v1/timings?latitude=33.5731&longitude=-7.5898&method=3');
        const json = await res.json();
        state.todayTimes = {
            Fajr: json.data.timings.Fajr,
            Dhuhr: json.data.timings.Dhuhr,
            Asr: json.data.timings.Asr,
            Maghrib: json.data.timings.Maghrib,
            Isha: json.data.timings.Isha
        };
        renderTimes();
    } catch (e) { console.error("Network error"); }
}

function renderTimes() {
    const container = document.getElementById('prayer-list');
    container.innerHTML = Object.entries(state.todayTimes).map(([name, time]) => `
        <div class="line-item">
            <span class="text">${name}</span>
            <span style="color:var(--accent); font-weight:bold;">${time}</span>
        </div>
    `).join('');
}

function renderAdhanList() {
    const container = document.getElementById('adhan-list');
    container.innerHTML = adhanLibrary.map(adhan => `
        <div class="line-item" onclick="selectAdhan('${adhan.url}')">
            <span class="text">${adhan.name}</span>
            <span>${state.selectedAdhan === adhan.url ? '✅' : ''}</span>
        </div>
    `).join('');
}

function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    renderAdhanList();
}

function triggerLock(name) {
    state.isLocked = true;
    document.getElementById('lockScreen').classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = name.toUpperCase();
    document.getElementById('lockClock').textContent = document.getElementById('main-clock').textContent;
    
    const player = document.getElementById('adhanPlayer');
    player.src = state.selectedAdhan;
    player.play();
}

function dismissLock() {
    state.isLocked = false;
    document.getElementById('lockScreen').classList.add('hidden');
    const player = document.getElementById('adhanPlayer');
    player.pause();
    player.currentTime = 0;
}

function updateLockLabel(val) { document.getElementById('lockVal').textContent = val; }
function saveSettings() {
    state.lockDuration = document.getElementById('lockRange').value;
    localStorage.setItem('lockTime', state.lockDuration);
    alert("Saved!");
    showPage('page-home');
}

// Start
setInterval(updateClock, 1000);
fetchTimes();
renderAdhanList();
