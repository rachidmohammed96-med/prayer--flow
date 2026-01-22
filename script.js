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

// --- THE NAVIGATION ---
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// --- PRAYER LOGIC ---
async function fetchTimes() {
    try {
        const res = await fetch('https://api.aladhan.com/v1/timings?latitude=33.5731&longitude=-7.5898&method=3');
        const json = await res.json();
        state.todayTimes = { Fajr: json.data.timings.Fajr, Dhuhr: json.data.timings.Dhuhr, Asr: json.data.timings.Asr, Maghrib: json.data.timings.Maghrib, Isha: json.data.timings.Isha };
        renderTimes();
        renderAdhanList();
    } catch (e) { console.error("API Error"); }
}

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('main-clock').textContent = timeStr;
    document.getElementById('main-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    if (state.todayTimes) {
        Object.entries(state.todayTimes).forEach(([name, time]) => {
            if (timeStr === time && !state.isLocked) triggerLock(name);
        });
    }
}

// --- THE LOCK LOGIC ---
function triggerLock(prayerName) {
    state.isLocked = true;
    document.getElementById('lockScreen').classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = prayerName.toUpperCase();
    
    player.src = state.selectedAdhan;
    player.play().catch(() => {
        // If it's still blocked, the user MUST tap the lock screen once to hear it
        console.log("Automatic play blocked by browser.");
    });
}

// --- GESTURE LOGIC (Hold 5s to unlock) ---
let holdTimer;
const lockEl = document.getElementById('lockScreen');

const startHold = () => {
    player.pause(); // Tap once to stop noise
    holdTimer = setTimeout(() => {
        state.isLocked = false;
        lockEl.classList.add('hidden');
    }, 5000);
};
const endHold = () => clearTimeout(holdTimer);

lockEl.addEventListener('touchstart', startHold);
lockEl.addEventListener('touchend', endHold);

// --- THE FIXED SELECTION LOGIC ---
function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);

    // 1. Prime the player
    player.src = url;
    player.muted = true; 
    
    // 2. Start playing (Muted first to bypass the block)
    player.play().then(() => {
        // 3. If it works, unmute and play for 3 seconds
        player.muted = false;
        setTimeout(() => {
            player.pause();
            player.currentTime = 0;
        }, 3000);
    }).catch(err => {
        // If the browser STILL blocks it, we show this simpler message
        console.log("Audio Blocked: " + err);
        alert("Please tap the 'Madinah' or 'Makkah' text one more time.");
    });

    renderAdhanList();
}

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
