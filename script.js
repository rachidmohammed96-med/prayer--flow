// Reliable HTTPS links
const adhanLibrary = [
    { name: "Makkah", url: "https://www.islamcan.com/common/adhan/makkah.mp3" },
    { name: "Madinah", url: "https://www.islamcan.com/common/adhan/madinah.mp3" }
];

let state = {
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

// --- SOUND TEST FUNCTION ---
// Click this button on your phone to see if sound is even possible
function testSound() {
    player.src = state.selectedAdhan;
    player.play().then(() => {
        alert("SOUND WORKING! Wait 3 seconds...");
        setTimeout(() => player.pause(), 3000);
    }).catch(err => {
        alert("BROWSER STILL BLOCKING. Error: " + err.name);
    });
}

// --- LOCK LOGIC ---
function triggerLock(prayerName) {
    state.isLocked = true;
    const lockScreen = document.getElementById('lockScreen');
    lockScreen.classList.remove('hidden');
    document.getElementById('lockPrayerName').textContent = prayerName.toUpperCase();
    
    player.src = state.selectedAdhan;
    player.play().catch(() => {
        // Create a button if it fails
        const btn = document.createElement("button");
        btn.innerText = "TAP TO ENABLE ADHAN";
        btn.style.cssText = "margin-top:20px; padding:20px; background:gold; color:black; border:none; border-radius:10px; font-weight:bold;";
        btn.onclick = () => player.play();
        document.getElementById('lockScreen').appendChild(btn);
    });
}

// --- 5 SECOND HOLD TO UNLOCK ---
let holdTimer;
const lockEl = document.getElementById('lockScreen');

const startHold = () => {
    player.pause(); // Tap stops music
    holdTimer = setTimeout(() => {
        state.isLocked = false;
        lockEl.classList.add('hidden');
        // Clear buttons
        const btns = lockEl.getElementsByTagName('button');
        while(btns[0]) btns[0].parentNode.removeChild(btns[0]);
    }, 5000); // 5 Seconds
};
const stopHold = () => clearTimeout(holdTimer);

lockEl.addEventListener('touchstart', startHold);
lockEl.addEventListener('touchend', stopHold);
lockEl.addEventListener('mousedown', startHold);
lockEl.addEventListener('mouseup', stopHold);

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

function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    player.src = url;
    player.play().then(() => setTimeout(() => player.pause(), 3000));
    renderAdhanList();
}

setInterval(updateClock, 1000);
fetchTimes();
