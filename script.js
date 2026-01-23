const adhanLibrary = [
    { name: "Makkah", url: "https://www.islamcan.com/common/adhan/makkah.mp3" },
    { name: "Madinah", url: "https://www.islamcan.com/common/adhan/madinah.mp3" },
    { name: "Al-Aqsa", url: "https://www.islamcan.com/common/adhan/alaqsa.mp3" }
];

let state = {
    lockDuration: parseInt(localStorage.getItem('lockTime')) || 15,
    selectedAdhan: localStorage.getItem('adhanUrl') || adhanLibrary[0].url,
    todayTimes: null,
    isLocked: false,
    audioReady: false
};

const player = document.getElementById('adhanPlayer');

// 1. ONE-TOUCH UNLOCK (Vital for Sound)
document.addEventListener('click', () => {
    if (state.audioReady) return;
    player.src = "data:audio/wav;base64,UklGRigAAABXQVZFWm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/";
    player.play().then(() => {
        player.pause();
        state.audioReady = true;
        document.getElementById('audio-status').textContent = "System Active ✅";
        document.getElementById('audio-status').style.color = "#4cd964";
    });
}, { once: true });

// 2. TRIGGER: MANUAL SELECTION
function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    player.src = url;
    player.play();
    setTimeout(() => { if(!state.isLocked) player.pause(); }, 5000); 
    renderAdhanList();
}

// 3. TRIGGER: AUTOMATIC PRAYER TIME
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('main-clock').textContent = timeStr;
    document.getElementById('main-date').textContent = now.toDateString();

    if (state.todayTimes && !state.isLocked) {
        ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(p => {
            if (timeStr === state.todayTimes[p]) triggerLock(p);
        });
    }
}

function triggerLock(pName) {
    state.isLocked = true;
    document.getElementById('lockScreen').classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = pName.toUpperCase();
    player.src = state.selectedAdhan;
    player.play().catch(e => console.log("Audio Blocked"));
    
    // Automatic unlock after chosen duration
    setTimeout(unlock, state.lockDuration * 60000);
}

// GESTURES: Tap to stop, Hold 5s to Unlock
let holdTimer;
const lockEl = document.getElementById('lockScreen');

function handleStart() {
    player.pause(); // One tap stops the sound
    holdTimer = setTimeout(unlock, 5000); // 5s Hold to unlock screen
}

lockEl.addEventListener('touchstart', handleStart);
lockEl.addEventListener('touchend', () => clearTimeout(holdTimer));
lockEl.addEventListener('mousedown', handleStart);
lockEl.addEventListener('mouseup', () => clearTimeout(holdTimer));

function unlock() {
    state.isLocked = false;
    document.getElementById('lockScreen').classList.add('hidden');
}

async function fetchTimes() {
    try {
        const res = await fetch('https://api.aladhan.com/v1/timings?latitude=33.5731&longitude=-7.5898&method=3');
        const json = await res.json();
        state.todayTimes = json.data.timings;
        renderTimes();
        renderAdhanList();
    } catch (e) { console.error("API Error"); }
}

function renderTimes() {
    document.getElementById('prayer-list').innerHTML = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
        .map(n => `<div class="line-item"><span>${n}</span><span>${state.todayTimes[n]}</span></div>`).join('');
}

function renderAdhanList() {
    document.getElementById('adhan-list').innerHTML = adhanLibrary.map(a => `
        <div class="line-item" onclick="selectAdhan('${a.url}')">
            <span>${a.name}</span><span>${state.selectedAdhan === a.url ? '✅' : ''}</span>
        </div>`).join('');
}

function showPage(p) {
    document.querySelectorAll('.page').forEach(pg => pg.classList.add('hidden'));
    document.getElementById(p).classList.remove('hidden');
}

function saveSettings() {
    state.lockDuration = document.getElementById('lockInput').value;
    localStorage.setItem('lockTime', state.lockDuration);
    showPage('homePage');
}

setInterval(updateClock, 1000);
fetchTimes();
