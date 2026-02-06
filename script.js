/* --- ТРЕКИ --- */
const tracks = [
    // Замените на свои реальные пути к файлам
    { url: "music/01 - We Shall Sail Together.mp3", title: "We Shall Sail Together", artist: "Sea of Thieves" },
    { url: "music/02 - Maiden Voyage.mp3", title: "Maiden Voyage", artist: "Sea of Thieves" },
    { url: "music/10 - Gold Hoarder.mp3", title: "Gold Hoarder", artist: "Sea of Thieves" }
];

let currentIdx = 0;
let isPlaying = false;

/* --- ЭЛЕМЕНТЫ --- */
const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.src = tracks[currentIdx].url;

const els = {
    play: document.getElementById("play"),
    prev: document.getElementById("prev"),
    next: document.getElementById("next"),
    title: document.getElementById("track-name"),
    artist: document.querySelector(".track-info p"),
    timeline: document.querySelector(".timeline"),
    progress: document.querySelector(".progress"),
    progHead: document.querySelector(".progress-head"),
    currTime: document.getElementById("current-time"),
    durTime: document.getElementById("duration"),
    volume: document.getElementById("volume"),
    // ДИНАМИЧЕСКИЕ ЭЛЕМЕНТЫ
    bgContainer: document.getElementById("dynamic-bg-container"),
    artifact: document.getElementById("artifact"),
    coreGlow: document.getElementById("core-glow"),
    playerUi: document.getElementById("player-ui")
};

let ctx, analyser, src, dataArray;
let contextInitialized = false;

/* --- АУДИО ИНИЦИАЛИЗАЦИЯ --- */
function initAudioContext() {
    if (contextInitialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContext();
    analyser = ctx.createAnalyser();
    src = ctx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(ctx.destination);

    // Оптимальный размер для баланса между скоростью и качеством басов
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    contextInitialized = true;
    loop();
}

/* --- ГЛАВНЫЙ ЦИКЛ АНИМАЦИИ --- */
const canvas = document.getElementById("eq");
const c = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.45;
}
window.onresize = resize;
resize();

function loop() {
    requestAnimationFrame(loop);
    if(!contextInitialized) return;

    analyser.getByteFrequencyData(dataArray);

    // 1. ЭКВАЛАЙЗЕР
    c.clearRect(0, 0, canvas.width, canvas.height);
    const barW = (canvas.width / dataArray.length) * 2.5;
    const cx = canvas.width / 2;

    let bassTotal = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i];
        // Собираем энергию басов (первые 8 частот)
        if (i < 8) bassTotal += val;

        const h = val * 0.9;
        const alpha = (val / 255) * 0.95;
        // Цвет: от бирюзового к ярко-зеленому
        c.fillStyle = `rgba(${26 + val/4}, 255, ${178 - val/5}, ${alpha})`;
        c.fillRect(cx + (i * barW), canvas.height - h, barW - 2, h);
        c.fillRect(cx - (i * barW) - barW, canvas.height - h, barW - 2, h);
    }

    // 2. ВЫЧИСЛЕНИЕ ЭНЕРГИИ БАСА (0.0 - 1.0)
    // Делим на (кол-во частот * макс значение)
    const bassEnergy = bassTotal / (8 * 255);

    // 3. ПРИМЕНЕНИЕ ДИНАМИКИ
    applyDynamics(bassEnergy);
}

/* --- ФУНКЦИЯ РЕАКЦИИ НА МУЗЫКУ --- */
function applyDynamics(energy) {
    // Порог срабатывания "удара"
    const isHit = energy > 0.55;

    // 1. Пульсация артефакта
    const scale = 1 + (energy * 0.2);
    els.artifact.style.transform = `translate(-50%, -50%) scale(${scale})`;

    // 2. Яркость центрального свечения
    els.coreGlow.style.opacity = 0.2 + (energy * 0.8);
    els.coreGlow.style.transform = `scale(${1 + energy * 0.5})`;

    // 3. Тряска всего фона (Дым + Болото) при ударе
    if (isHit) {
        // Небольшое увеличение масштаба фона
        els.bgContainer.style.transform = `scale(${1 + energy * 0.04})`;
        // Подсветка плеера
        els.playerUi.style.boxShadow = `0 15px 60px rgba(26, 255, 178, ${energy * 0.4})`;
    } else {
        els.bgContainer.style.transform = `scale(1)`;
        els.playerUi.style.boxShadow = `0 15px 50px rgba(0,0,0,0.7)`;
    }

    // 4. Ускорение частиц
    globalSpeedMultiplier = 1 + (energy * 4);
}

/* --- ЧАСТИЦЫ (Болотные пузырьки) --- */
const pCanvas = document.getElementById("particle-canvas");
const pc = pCanvas.getContext("2d");
let particles = [];
let globalSpeedMultiplier = 1;

function resizeP() {
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeP);
resizeP();

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * pCanvas.width;
        this.y = pCanvas.height + Math.random() * 150;
        this.baseSpeed = Math.random() * 0.8 + 0.2; // Медленное всплытие
        this.size = Math.random() * 4 + 1;
        // Цвет: варьируется от зеленого до светло-бирюзового
        const g = Math.floor(Math.random() * 55 + 200);
        const b = Math.floor(Math.random() * 100 + 150);
        this.color = `${g}, ${b}`;
        this.opacity = Math.random() * 0.6 + 0.1;
    }
    update() {
        // Скорость зависит от музыки
        this.y -= this.baseSpeed * globalSpeedMultiplier;
        if (this.y < -20) this.reset();
    }
    draw() {
        pc.fillStyle = `rgba(26, ${this.color}, ${this.opacity})`;
        pc.beginPath();
        // Рисуем мягкие круги (пузырьки)
        var gradient = pc.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`); // Ядро
        gradient.addColorStop(1, `rgba(26, ${this.color}, 0)`); // Края
        pc.fillStyle = gradient;
        pc.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        pc.fill();
    }
}

// Создаем 100 частиц
for(let i=0; i<100; i++) particles.push(new Particle());

function animateP() {
    pc.clearRect(0, 0, pCanvas.width, pCanvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateP);
}
animateP();

/* --- УПРАВЛЕНИЕ UI (Без изменений) --- */
els.play.onclick = async () => {
    initAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    if (audio.paused) {
        audio.play();
        els.play.textContent = "⏸";
        isPlaying = true;
    } else {
        audio.pause();
        els.play.textContent = "▶";
        isPlaying = false;
        applyDynamics(0);
    }
};

const changeTrack = (dir) => {
    currentIdx = (currentIdx + dir + tracks.length) % tracks.length;
    audio.src = tracks[currentIdx].url;
    els.title.textContent = tracks[currentIdx].title;
    els.artist.textContent = tracks[currentIdx].artist;
    if (isPlaying) audio.play();
};
els.next.onclick = () => changeTrack(1);
els.prev.onclick = () => changeTrack(-1);

audio.ontimeupdate = () => {
    if(isNaN(audio.duration)) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    els.progress.style.width = `${pct}%`;
    els.progHead.style.left = `${pct}%`;
    els.currTime.textContent = fmt(audio.currentTime);
    els.durTime.textContent = fmt(audio.duration);
};
els.timeline.onclick = (e) => {
    const rect = els.timeline.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
};
els.volume.oninput = (e) => audio.volume = e.target.value;
const fmt = (s) => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;