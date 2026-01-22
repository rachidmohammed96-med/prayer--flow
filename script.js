// I changed the links to a more reliable source for testing
const adhanLibrary = [
    { name: "Adhan 1", url: "https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg" }, // Test Sound (Birds)
    { name: "Makkah", url: "https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3" }, // Test Sound (Bell)
    { name: "Custom", url: "https://www.islamcan.com/common/adhan/makkah.mp3" }
];

let state = {
    lockDuration: localStorage.getItem('lockTime') || 15,
    selectedAdhan: localStorage.getItem('adhanUrl') || adhanLibrary[0].url,
    todayTimes: null,
    isLocked: false 
};

const player = document.getElementById('adhanPlayer');

// --- THE WAKE UP LOGIC ---
// This runs the moment you touch ANY part of the screen
function forceUnlockAudio() {
    player.src = state.selectedAdhan;
    player.muted = true; // Start muted to bypass browser blocks
    player.play().then(() => {
        player.pause();
        player.muted = false; // Unmute for later
        console.log("Audio Engine Ready");
    });
    document.removeEventListener('click', forceUnlockAudio);
}
document.addEventListener('click', forceUnlockAudio);

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

// --- LOCK & 5-SECOND UNLOCK ---
function triggerLock(prayerName) {
    state.isLocked = true;
    const lockScreen = document.getElementById('lockScreen');
    lockScreen.classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = prayerName.toUpperCase();
    
    player.src = state.selectedAdhan;
    player.play().catch(e => alert("Tap screen to allow Adhan!"));
}

let holdTimer;
const lockEl = document.getElementById('lockScreen');

const startAction = () => {
    player.pause(); 
    holdTimer = setTimeout(() => {
        state.isLocked = false;
        lockEl.classList.add('hidden');
    }, 5000); 
};
const endAction = () => clearTimeout(holdTimer);

lockEl.addEventListener('mousedown', startAction);
lockEl.addEventListener('touchstart', startAction);
lockEl.addEventListener('mouseup', endAction);
lockEl.addEventListener('touchend', endAction);

// --- SETTINGS ---
function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    
    player.src = url;
    player.load(); // Force the browser to load the new file
    player.play().catch(e => alert("Sound blocked by browser. Tap again."));
    
    // Play for 3 seconds so you can hear it
    setTimeout(() => player.pause(), 3000);
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
