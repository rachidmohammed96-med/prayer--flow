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

// --- THE SECRET FIX: "PRIME" THE AUDIO ---
// This function runs on your FIRST tap to "unlock" the speakers for the whole day.
function unlockSpeakers() {
    player.src = "https://www.soundjay.com/buttons/beep-01a.mp3"; // A short, safe sound
    player.volume = 0.1; 
    player.play().then(() => {
        player.pause();
        player.volume = 1.0;
        console.log("Speakers are now UNLOCKED.");
    }).catch(e => console.log("Still waiting for first tap..."));
    
    // Remove listeners so it only runs once
    document.removeEventListener('click', unlockSpeakers);
    document.removeEventListener('touchstart', unlockSpeakers);
}
document.addEventListener('click', unlockSpeakers);
document.addEventListener('touchstart', unlockSpeakers);

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
            if (timeStr === time && !state.isLocked) triggerLock(name);
        });
    }
}

// --- LOCK & 5-SECOND UNLOCK ---
function triggerLock(prayerName) {
    state.isLocked = true;
    const lockScreen = document.getElementById('lockScreen');
    lockScreen.classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = prayerName.toUpperCase();
    
    player.src = state.selectedAdhan;
    player.play().catch(e => {
        // Fallback: If it's still blocked, show a message
        alert("Audio Blocked! Tap the screen to hear the Adhan.");
    });
}

let holdTimer;
const lockEl = document.getElementById('lockScreen');

const startAction = () => {
    player.pause(); // 1. Tap to stop sound
    holdTimer = setTimeout(() => { // 2. Hold 5s to unlock
        state.isLocked = false;
        lockEl.classList.add('hidden');
    }, 5000); 
};
const endAction = () => clearTimeout(holdTimer);

lockEl.addEventListener('touchstart', startAction);
lockEl.addEventListener('mousedown', startAction);
lockEl.addEventListener('touchend', endAction);
lockEl.addEventListener('mouseup', endAction);

// --- SETTINGS ---
function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    player.src = url;
    player.play().then(() => {
        setTimeout(() => player.pause(), 3000); // Test for 3 seconds
    }).catch(e => alert("Tap the screen once first, then try again!"));
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
