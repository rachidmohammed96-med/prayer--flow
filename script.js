// New, more reliable test links
const adhanLibrary = [
    { name: "Makkah", url: "https://prayersanddua.com/wp-content/uploads/2023/04/Adhan-Makkah.mp3" },
    { name: "Madinah", url: "https://www.al-makkah.com/audio/adhan/madinah.mp3" },
    { name: "Emergency Test", url: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg" }
];

let state = {
    lockDuration: localStorage.getItem('lockTime') || 15,
    selectedAdhan: localStorage.getItem('adhanUrl') || adhanLibrary[0].url,
    todayTimes: null,
    isLocked: false 
};

const player = document.getElementById('adhanPlayer');

// --- THE FIX: FORCE UNLOCK AUDIO ENGINE ---
function initAudio() {
    player.src = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";
    player.play().then(() => {
        player.pause();
        console.log("Audio engine is awake!");
    }).catch(e => console.log("Waiting for user tap..."));
    document.removeEventListener('click', initAudio);
}
document.addEventListener('click', initAudio);

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
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
        renderAdhanList();
    } catch (e) { alert("Network Error: Cannot get prayer times."); }
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

function triggerLock(prayerName) {
    state.isLocked = true;
    document.getElementById('lockScreen').classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = prayerName.toUpperCase();
    
    player.src = state.selectedAdhan;
    player.play().catch(e => alert("Please tap the screen to allow audio!"));
}

// --- LOCK CONTROLS (Hold 5s) ---
let holdTimer;
const lockEl = document.getElementById('lockScreen');

const startAction = () => {
    player.pause(); // Stop sound on first tap
    holdTimer = setTimeout(() => {
        state.isLocked = false;
        lockEl.classList.add('hidden');
    }, 5000); 
};
const endAction = () => clearTimeout(holdTimer);

lockEl.addEventListener('touchstart', startAction);
lockEl.addEventListener('touchend', endAction);
lockEl.addEventListener('mousedown', startAction);
lockEl.addEventListener('mouseup', endAction);

// --- SELECTION LOGIC ---
function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    
    // Test the sound immediately
    player.src = url;
    player.load();
    player.play()
        .then(() => {
            console.log("Playing test...");
            setTimeout(() => player.pause(), 3000);
        })
        .catch(err => {
            alert("Browser blocked sound. Tap anywhere on the screen first, then try again.");
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
