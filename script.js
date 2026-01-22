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

// --- NAVIGATION ---
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// --- PRAYER LOGIC ---
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
        renderAdhanList();
    } catch (e) { console.error("Could not fetch times"); }
}

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    document.getElementById('main-clock').textContent = timeStr;
    document.getElementById('main-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    if (state.todayTimes) {
        Object.entries(state.todayTimes).forEach(([name, time]) => {
            if (timeStr === time && !state.isLocked) {
                triggerLock(name);
            }
        });
    }
}

// --- LOCK & AUDIO LOGIC ---
function triggerLock(prayerName) {
    state.isLocked = true;
    const lockScreen = document.getElementById('lockScreen');
    lockScreen.classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = prayerName.toUpperCase();
    
    player.src = state.selectedAdhan;
    player.play().catch(() => console.log("Tap screen to enable sound"));
}

let holdTimer;
const lockEl = document.getElementById('lockScreen');

// 1. TOUCH START (Tap to stop sound, start 5s timer)
const startAction = (e) => {
    // Stop the Adhan sound immediately
    player.pause();
    player.currentTime = 0;

    // Start 5-second countdown to unlock
    holdTimer = setTimeout(() => {
        state.isLocked = false;
        lockEl.classList.add('hidden');
        alert("Unlocked");
    }, 5000); 
};

// 2. TOUCH END (Cancel unlock if they let go early)
const endAction = () => {
    clearTimeout(holdTimer);
};

lockEl.addEventListener('mousedown', startAction);
lockEl.addEventListener('touchstart', startAction);
lockEl.addEventListener('mouseup', endAction);
lockEl.addEventListener('touchend', endAction);

// --- SETTINGS ---
function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    
    // Sound Test: plays for 1 second so you know it works
    player.src = url;
    player.play();
    setTimeout(() => player.pause(), 1000);
    
    renderAdhanList();
}

function saveSettings() {
    const val = document.getElementById('lockInput').value;
    localStorage.setItem('lockTime', val);
    alert("Settings Saved!");
    showPage('homePage');
}

// --- RENDERING ---
function renderTimes() {
    document.getElementById('prayer-list').innerHTML = Object.entries(state.todayTimes).map(([n, t]) => `
        <div class="line-item"><span>${n}</span><span style="color:var(--accent);">${t}</span></div>
    `).join('');
}

function renderAdhanList() {
    document.getElementById('adhan-list').innerHTML = adhanLibrary.map(a => `
        <div class="line-item" onclick="selectAdhan('${a.url}')">
            <span>${a.name}</span>
            <span>${state.selectedAdhan === a.url ? '✅' : ''}</span>
        </div>
    `).join('');
}

setInterval(updateClock, 1000);
fetchTimes();
