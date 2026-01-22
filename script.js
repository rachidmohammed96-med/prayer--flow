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

// 1. Fixed Sound Unlock for Mobile
function initApp() {
    // Play a tiny base64 silent beep to unlock the audio channel
    player.src = "data:audio/wav;base64,UklGRigAAABXQVZFWm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/";
    player.play().then(() => {
        player.pause();
        document.getElementById('start-overlay').classList.add('hidden');
        fetchTimes(); // Load everything else after unlock
    }).catch(err => {
        alert("Please tap firmly and ensure your volume is turned UP.");
    });
}

// 2. Navigation
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// 3. Updated Date and Clock
function updateClock() {
    const now = new Date();
    document.getElementById('main-clock').textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    // Fix: This updates the "Loading" text immediately
    document.getElementById('main-date').textContent = now.toLocaleDateString('en-US', { 
        weekday: 'long', month: 'short', day: 'numeric' 
    });
    
    if (state.todayTimes) {
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(name => {
            if (timeStr === state.todayTimes[name] && !state.isLocked) triggerLock(name);
        });
    }
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

// 4. Lock Screen Hold (5 Seconds)
function triggerLock(prayerName) {
    state.isLocked = true;
    document.getElementById('lockScreen').classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = prayerName.toUpperCase();
    player.src = state.selectedAdhan;
    player.play().catch(e => console.log("Sound blocked"));
}

let holdTimer;
const lockEl = document.getElementById('lockScreen');

lockEl.addEventListener('touchstart', () => {
    player.pause(); // Tap stops music
    holdTimer = setTimeout(() => {
        state.isLocked = false;
        lockEl.classList.add('hidden');
    }, 5000); // 5s Hold
});
lockEl.addEventListener('touchend', () => clearTimeout(holdTimer));

// 5. Library Selection
function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    player.src = url;
    player.play().then(() => setTimeout(() => player.pause(), 5000));
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
updateClock(); // Run immediately so 'Loading' disappears
