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
    audioUnlocked: false
};

const player = document.getElementById('adhanPlayer');

// --- AUTO-UNLOCK AUDIO ON FIRST TOUCH ---
function unlockAudio() {
    if (state.audioUnlocked) return;
    player.src = "data:audio/wav;base64,UklGRigAAABXQVZFWm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/";
    player.play().then(() => {
        player.pause();
        state.audioUnlocked = true;
        document.getElementById('audio-status').textContent = "System Active";
        document.getElementById('audio-status').style.color = "#4cd964";
    }).catch(() => {});
}
document.addEventListener('touchstart', unlockAudio);
document.addEventListener('mousedown', unlockAudio);

// --- CLOCK & PRAYER CHECK ---
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('main-clock').textContent = timeStr;
    document.getElementById('main-date').textContent = now.toDateString();
    
    if (state.todayTimes && !state.isLocked) {
        ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(name => {
            if (timeStr === state.todayTimes[name]) triggerLock(name);
        });
    }
}

// --- LOCK LOGIC ---
function triggerLock(prayerName) {
    state.isLocked = true;
    document.getElementById('lockScreen').classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = prayerName.toUpperCase();
    
    player.src = state.selectedAdhan;
    player.play().catch(e => console.log("Audio blocked - interaction needed"));

    // AUTO UNLOCK after the duration set in settings
    setTimeout(() => {
        if(state.isLocked) performUnlock();
    }, state.lockDuration * 60000);
}

// --- GESTURE HANDLING ---
let holdTimer;
const lockEl = document.getElementById('lockScreen');

lockEl.addEventListener('touchstart', (e) => {
    player.pause(); // 1. Simple tap stops the sound
    
    // 2. Start 5s timer for Force Unlock
    holdTimer = setTimeout(() => {
        performUnlock();
    }, 5000);
});

lockEl.addEventListener('touchend', () => clearTimeout(holdTimer));

function performUnlock() {
    state.isLocked = false;
    document.getElementById('lockScreen').classList.add('hidden');
}

// --- APP UTILITIES ---
async function fetchTimes() {
    try {
        const res = await fetch('https://api.aladhan.com/v1/timings?latitude=33.5731&longitude=-7.5898&method=3');
        const json = await res.json();
        state.todayTimes = json.data.timings;
        renderTimes();
        renderAdhanList();
    } catch (e) { console.error("API Offline"); }
}

function saveSettings() {
    const val = parseInt(document.getElementById('lockInput').value);
    if (val >= 10 && val <= 30) {
        state.lockDuration = val;
        localStorage.setItem('lockTime', val);
        showPage('homePage');
    } else {
        alert("Enter 10 to 30 minutes");
    }
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    player.src = url;
    player.play();
    setTimeout(() => player.pause(), 5000); // 5s preview
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

setInterval(updateClock, 1000);
fetchTimes();
