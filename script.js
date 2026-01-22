const adhanLibrary = [
    { name: "Makkah", url: "https://www.islamcan.com/common/adhan/makkah.mp3" },
    { name: "Madinah", url: "https://www.islamcan.com/common/adhan/madinah.mp3" }
];

let state = {
    lockDuration: parseInt(localStorage.getItem('lockTime')) || 15,
    selectedAdhan: localStorage.getItem('adhanUrl') || adhanLibrary[0].url,
    todayTimes: null,
    isLocked: false,
    audioEnabled: false
};

const player = document.getElementById('adhanPlayer');

// UNLOCK AUDIO: Must happen on a user click
document.addEventListener('click', () => {
    if (state.audioEnabled) return;
    player.src = "https://www.soundjay.com/buttons/beep-01a.mp3";
    player.play().then(() => {
        player.pause();
        state.audioEnabled = true;
        document.getElementById('audio-hint').style.display = 'none';
    });
}, { once: true });

function selectAdhan(url) {
    state.selectedAdhan = url;
    localStorage.setItem('adhanUrl', url);
    player.src = url;
    player.play();
    setTimeout(() => player.pause(), 5000); 
    renderAdhanList();
}

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
    player.play().catch(e => console.log("Sound Blocked"));
    setTimeout(unlock, state.lockDuration * 60000);
}

let holdTimer;
const lockEl = document.getElementById('lockScreen');
const stopAndHold = () => {
    player.pause();
    holdTimer = setTimeout(unlock, 5000);
};

lockEl.addEventListener('touchstart', stopAndHold);
lockEl.addEventListener('touchend', () => clearTimeout(holdTimer));
lockEl.addEventListener('mousedown', stopAndHold);
lockEl.addEventListener('mouseup', () => clearTimeout(holdTimer));

function unlock() {
    state.isLocked = false;
    document.getElementById('lockScreen').classList.add('hidden');
}

async function fetchTimes() {
    const res = await fetch('https://api.aladhan.com/v1/timings?latitude=33.5731&longitude=-7.5898&method=3');
    const json = await res.json();
    state.todayTimes = json.data.timings;
    renderTimes();
    renderAdhanList();
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
