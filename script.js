/* --- CONFIGURATION --- */
const tracks = [
    { url: "music/1.mp3", title: "Becalmed", artist: "Sea of Thieves" },
    { url: "music/2.mp3", title: "Grogg Mayles", artist: "Sea of Thieves" }
];

let currentIdx = 0;
let isPlaying = false;

/* --- ELEMENTS --- */
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
    volume: document.getElementById("volume")
};

/* --- AUDIO CONTEXT --- */
let ctx, analyser, src, dataArray;
let contextInitialized = false;

function initAudioContext() {
    if (contextInitialized) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = ctx.createAnalyser();
    src = ctx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(ctx.destination);

    // Higher FFT size for better resolution
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    contextInitialized = true;
    drawVisualizer();
}

/* --- CONTROLS --- */
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
    }
    updateTrackInfo();
};

const changeTrack = (dir) => {
    currentIdx = (currentIdx + dir + tracks.length) % tracks.length;
    audio.src = tracks[currentIdx].url;
    if (isPlaying) audio.play();
    updateTrackInfo();
};

els.next.onclick = () => changeTrack(1);
els.prev.onclick = () => changeTrack(-1);

function updateTrackInfo() {
    els.title.textContent = tracks[currentIdx].title;
    els.artist.textContent = tracks[currentIdx].artist;
}

/* --- TIMELINE & VOLUME --- */
audio.ontimeupdate = () => {
    if(isNaN(audio.duration)) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    els.progress.style.width = `${pct}%`;
    els.progHead.style.left = `${pct}%`;

    els.currTime.textContent = formatTime(audio.currentTime);
    els.durTime.textContent = formatTime(audio.duration);
};

els.timeline.onclick = (e) => {
    const rect = els.timeline.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
};

els.volume.oninput = (e) => audio.volume = e.target.value;

function formatTime(s) {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/* --- VISUALIZER (SYMMETRIC) --- */
const canvas = document.getElementById("eq");
const c = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.4;
}
window.onresize = resizeCanvas;
resizeCanvas();

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    if(!contextInitialized) return;

    analyser.getByteFrequencyData(dataArray);

    c.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    // Center the visualizer
    const cx = canvas.width / 2;

    for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] * 0.8; // Scale height

        // Dynamic Green/Teal Color
        const r = 20;
        const g = 255;
        const b = 180;
        const alpha = dataArray[i] / 255;

        c.fillStyle = `rgba(${r},${g},${b},${alpha})`;

        // Draw Mirrored
        c.fillRect(cx + x, canvas.height - barHeight, barWidth - 2, barHeight);
        c.fillRect(cx - x - barWidth, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
    }
}

/* --- PARTICLE ENGINE (Swamp Embers) --- */
const pCanvas = document.getElementById("particle-canvas");
const pc = pCanvas.getContext("2d");
let particles = [];

function resizePCanvas() {
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizePCanvas);
resizePCanvas();

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * pCanvas.width;
        this.y = pCanvas.height + Math.random() * 100;
        this.speed = Math.random() * 1 + 0.5;
        this.size = Math.random() * 2;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.fade = Math.random() * 0.005;
    }

    update() {
        this.y -= this.speed;
        this.opacity -= this.fade;

        if (this.y < 0 || this.opacity <= 0) {
            this.reset();
        }
    }

    draw() {
        pc.fillStyle = `rgba(26, 255, 178, ${this.opacity})`;
        pc.beginPath();
        pc.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        pc.fill();
    }
}

function initParticles() {
    for (let i = 0; i < 60; i++) {
        particles.push(new Particle());
    }
    animateParticles();
}

function animateParticles() {
    pc.clearRect(0, 0, pCanvas.width, pCanvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}

initParticles();