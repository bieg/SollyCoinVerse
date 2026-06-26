class MicAnalyser {
  constructor() {
    this.active = false;
    this.analyser = null;
    this.dataArray = null;

    // Smoothed normalized values (0-1)
    this.amplitude = 0;
    this.low = 0;
    this.mid = 0;
    this.high = 0;

    // Internal raw targets for lerp
    this._rawAmp = 0;
    this._rawLow = 0;
    this._rawMid = 0;
    this._rawHigh = 0;

    // Cached base scales (set on first tick)
    this._starMesh = null;
    this._starBaseScale = 1;
    this._planetBaseScales = null;
    this._solly1BaseScale = null;
    this._miniBaseScales = null;
  }

  async start() {
    if (this.active) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.75;
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount); // 64 bins
      this.active = true;
      console.log('🎤 MicAnalyser actief');
    } catch (e) {
      // Mic geweigerd of niet beschikbaar — stilletjes doorgaan
    }
  }

  _readData() {
    this.analyser.getByteFrequencyData(this.dataArray);
    const bins = this.dataArray.length;

    let totalSum = 0;
    for (let i = 0; i < bins; i++) totalSum += this.dataArray[i];

    let lowSum = 0;
    for (let i = 0; i < 11; i++) lowSum += this.dataArray[i];

    let midSum = 0;
    for (let i = 11; i < 36; i++) midSum += this.dataArray[i];

    let highSum = 0;
    for (let i = 36; i < bins; i++) highSum += this.dataArray[i];

    this._rawAmp = totalSum / (bins * 255);
    this._rawLow = lowSum / (11 * 255);
    this._rawMid = midSum / (25 * 255);
    this._rawHigh = highSum / (28 * 255);

    // Lerp voor vloeiende beweging
    const s = 0.12;
    this.amplitude += (this._rawAmp - this.amplitude) * s;
    this.low += (this._rawLow - this.low) * s;
    this.mid += (this._rawMid - this.mid) * s;
    this.high += (this._rawHigh - this.high) * s;
  }

  tick() {
    if (!this.active || !window.scene) return;
    this._readData();
    this._applyToScene();
  }

  _applyToScene() {
    const now = Date.now();

    // === STERREN: amplitude → schaal-pulse van het hele sterrenveld ===
    if (!this._starMesh) {
      this._starMesh = window.scene.children.find((obj) => obj.isInstancedMesh) || null;
      if (this._starMesh) this._starBaseScale = this._starMesh.scale.x;
    }
    if (this._starMesh) {
      const target = this._starBaseScale * (1 + this.amplitude * 0.35);
      const current = this._starMesh.scale.x;
      this._starMesh.scale.setScalar(current + (target - current) * 0.18);
    }

    // === PLANETEN: lage freq → schaal-pulse, hoge freq → rotatieboost ===
    const planets = window.redPlanets;
    if (planets && planets.length) {
      if (!this._planetBaseScales) {
        this._planetBaseScales = planets.map((p) => p.scale.x);
      }
      planets.forEach((planet, i) => {
        const base = this._planetBaseScales[i] || 1;
        const phase = (i / planets.length) * Math.PI * 2;
        const pulse = 1 + this.low * 0.3 * (0.85 + 0.15 * Math.sin(phase));
        const wobble = this.high * 0.08 * Math.sin(now * 0.008 + phase);
        const target = base * pulse + wobble;
        planet.scale.setScalar(planet.scale.x + (target - planet.scale.x) * 0.15);
        planet.rotation.y += 0.001 + this.high * 0.025;
      });
    }

    // === MINI-SOLLYS: mid freq → rotatiesnelheid ===
    const minis = window.miniSollys;
    if (minis && minis.length) {
      minis.forEach((mini, i) => {
        const phase = (i / minis.length) * Math.PI;
        mini.rotation.x += 0.008 + this.mid * 0.06 * Math.abs(Math.sin(phase));
        mini.rotation.y += 0.006 + this.mid * 0.05;
      });
    }

    // === SOLLY1: amplitude → schaal-glow ===
    if (window.solly1) {
      if (!this._solly1BaseScale) this._solly1BaseScale = window.solly1.scale.x;
      const base = this._solly1BaseScale;
      const target = base * (1 + this.amplitude * 0.45);
      const current = window.solly1.scale.x;
      window.solly1.scale.setScalar(current + (target - current) * 0.1);
    }
  }
}

window.micAnalyser = new MicAnalyser();

// Auto-start zodra het spel live is (na intro)
document.addEventListener('sollyverseStarted', () => {
  setTimeout(() => {
    if (window.micAnalyser) window.micAnalyser.start();
  }, 2500);
});
