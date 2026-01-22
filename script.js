const adhanLibrary = [
    { name: "Makkah", url: "https://www.islamcan.com/common/adhan/makkah.mp3" },
    { name: "Madinah", url: "https://www.islamcan.com/common/adhan/madinah.mp3" },
    { name: "Al-Aqsa", url: "https://www.islamcan.com/common/adhan/alaqsa.mp3" }
];

let state = {
    lockDuration: localStorage.getItem('lockTime') || 15,
    selectedAdhan: localStorage.getItem('adhanUrl') || adhanLibrary[0].url,
    todayTimes: null,
    isLocked: false,
    audioEnabled: false
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
    // We try to play, but if it fails, we show a button on the lock screen
    player.play().catch(() => {
        document.getElementById('lockPrayerName').innerHTML += "<br><button onclick='player.play()' style='margin-top:20px; padding:15px; background:white; color:black; border-radius:10px;'>TAP TO HEAR ADHAN</button>";
    });
}

// --- GESTURE LOGIC (Hold 5s to unlock) ---
let holdTimer;
const lockEl = document.getElementById('lockScreen');

const startHold = (e) => {
    player.pause(); 
    holdTimer = setTimeout(() => {
        state.isLocked = false;
        lockEl.classList.add('hidden');
        // Reset the lock screen text for next time
        document.getElementById('lockPrayerName').innerHTML = "";
    }, 5000);
};
const endHold = () => clearTimeout(holdTimer);

lockEl.addEventListener('touchstart', startHold);
lockEl.addEventListener('touchend', endHold);

// --- THE NEW "SELECT" LOGIC ---
function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);

    // FORCE LOAD
    player.src = url;
    player.load();
    
    // Most browsers WILL allow sound if the user clicked exactly on the list item
    player.play()
        .then(() => {
            setTimeout(() => player.pause(), 4000);
        })
        .catch(err => {
            console.log("Still blocked");
            // If it's blocked, we tell the user to click specifically on the text
            alert("Touch the name 'Makkah' or 'Madinah' very firmly.");
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
