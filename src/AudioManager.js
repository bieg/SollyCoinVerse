class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientNodes = [];
    this.currentTheme = null;
    this._muted = false;
    this._volume = 0.45;
  }

  _init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._volume;
    this.masterGain.connect(this.ctx.destination);
  }

  _osc(type, freq, gainVal, startTime, endTime, dest) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainVal;
    osc.connect(gain);
    gain.connect(dest || this.masterGain);
    osc.start(startTime);
    if (endTime) osc.stop(endTime);
    return { osc, gain };
  }

  play(type) {
    this._init();
    const t = this.ctx.currentTime;

    switch (type) {
      case 'click': {
        const { gain } = this._osc('sine', 900, 0.07, t, t + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        break;
      }

      case 'portal': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(1800, t + 0.6);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.6);
        break;
      }

      case 'sollyTouch': {
        [523, 659, 784].forEach((freq, i) => {
          const delay = i * 0.09;
          const { gain } = this._osc('sine', freq, 0.0, t + delay, t + delay + 0.35);
          gain.gain.setValueAtTime(0.13, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);
        });
        break;
      }

      case 'shapeSelect': {
        [440, 660, 880].forEach((freq, i) => {
          const delay = i * 0.08;
          const { gain } = this._osc('triangle', freq, 0.0, t + delay, t + delay + 0.28);
          gain.gain.setValueAtTime(0.14, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.28);
        });
        break;
      }

      case 'chapterComplete': {
        const melody = [523, 659, 784, 1047, 1319];
        melody.forEach((freq, i) => {
          const delay = i * 0.13;
          const { gain } = this._osc('triangle', freq, 0.0, t + delay, t + delay + 0.5);
          gain.gain.setValueAtTime(0.18, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.5);
        });
        break;
      }

      case 'correct': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.setValueAtTime(880, t + 0.06);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.28);
        break;
      }

      case 'wrong': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.35);
        break;
      }

      case 'marbleBounce': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.1);
        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }

      case 'marbleFall': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 1.0);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 1.0);
        break;
      }

      case 'drop': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.18);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.18);
        break;
      }
    }
  }

  startAmbient(theme) {
    this._init();
    if (this.currentTheme === theme) return;
    this.stopAmbient();
    this.currentTheme = theme;

    switch (theme) {
      case 'space':
        return this._ambientSpace();
      case 'cube':
        return this._ambientCube();
      case 'hangman':
        return this._ambientHangman();
      case 'marble':
        return this._ambientMarble();
      case 'void':
        return this._ambientVoid();
    }
  }

  stopAmbient() {
    this.ambientNodes.forEach(({ osc, gain, interval }) => {
      if (interval) clearInterval(interval);
      if (gain && this.ctx) {
        try {
          gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        } catch (e) {
          // node already disconnected
        }
      }
      if (osc && this.ctx) {
        try {
          osc.stop(this.ctx.currentTime + 0.8);
        } catch (e) {
          // node already stopped
        }
      }
    });
    this.ambientNodes = [];
    this.currentTheme = null;
  }

  // Space: deep beating drones + random star-pings
  _ambientSpace() {
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Two slightly-detuned drones create a slow beating effect
    [
      [55, 0.055],
      [57.3, 0.04],
      [82.5, 0.025],
    ].forEach(([freq, vol]) => {
      const { osc, gain } = this._osc('sine', freq, vol, t, null);
      this.ambientNodes.push({ osc, gain });
    });

    // Faint high shimmer
    const { osc: sh, gain: shG } = this._osc('sine', 1760, 0.012, t, null);
    this.ambientNodes.push({ osc: sh, gain: shG });

    // Random star pings
    const pingInterval = setInterval(
      () => {
        if (!this.ctx || this.currentTheme !== 'space') return;
        const pt = this.ctx.currentTime;
        const freq = [1200, 1400, 1600, 2000, 2400][Math.floor(Math.random() * 5)];
        const { gain } = this._osc('sine', freq, 0, pt, pt + 1.8);
        gain.gain.setValueAtTime(0.035, pt);
        gain.gain.exponentialRampToValueAtTime(0.001, pt + 1.8);
      },
      2800 + Math.random() * 3500,
    );
    this.ambientNodes.push({ interval: pingInterval });
  }

  // Cube: digital pulse with square-wave arpeggio
  _ambientCube() {
    const ctx = this.ctx;

    // Sub bass
    const { osc: bass, gain: bassG } = this._osc('sawtooth', 55, 0.04, ctx.currentTime, null);
    this.ambientNodes.push({ osc: bass, gain: bassG });

    const arp = [220, 277, 330, 220, 330, 277];
    let step = 0;
    const arpInterval = setInterval(() => {
      if (!this.ctx || this.currentTheme !== 'cube') return;
      const pt = this.ctx.currentTime;
      const { gain } = this._osc('square', arp[step % arp.length], 0, pt, pt + 0.28);
      gain.gain.setValueAtTime(0.045, pt);
      gain.gain.exponentialRampToValueAtTime(0.001, pt + 0.28);
      step++;
    }, 480);
    this.ambientNodes.push({ interval: arpInterval });
  }

  // Hangman: low ominous drone + slow eerie melody
  _ambientHangman() {
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const { osc: d, gain: dG } = this._osc('triangle', 65, 0.07, t, null);
    this.ambientNodes.push({ osc: d, gain: dG });

    const eerieNotes = [130, 146, 155, 175, 196, 175];
    let noteIdx = 0;
    const eerieInterval = setInterval(
      () => {
        if (!this.ctx || this.currentTheme !== 'hangman') return;
        const pt = this.ctx.currentTime;
        const { gain } = this._osc(
          'triangle',
          eerieNotes[noteIdx % eerieNotes.length],
          0,
          pt,
          pt + 2.2,
        );
        gain.gain.setValueAtTime(0.055, pt);
        gain.gain.exponentialRampToValueAtTime(0.001, pt + 2.2);
        noteIdx++;
      },
      2200 + Math.random() * 1800,
    );
    this.ambientNodes.push({ interval: eerieInterval });
  }

  // Marble: tense focus pad
  _ambientMarble() {
    const ctx = this.ctx;
    const t = ctx.currentTime;

    [
      [110, 0.045],
      [165, 0.03],
      [220, 0.02],
    ].forEach(([freq, vol]) => {
      const { osc, gain } = this._osc('sine', freq, vol, t, null);
      this.ambientNodes.push({ osc, gain });
    });

    // Subtle rhythmic tick
    const tickInterval = setInterval(() => {
      if (!this.ctx || this.currentTheme !== 'marble') return;
      const pt = this.ctx.currentTime;
      const { gain } = this._osc('triangle', 440, 0, pt, pt + 0.05);
      gain.gain.setValueAtTime(0.025, pt);
      gain.gain.exponentialRampToValueAtTime(0.001, pt + 0.05);
    }, 800);
    this.ambientNodes.push({ interval: tickInterval });
  }

  // Void: dark spatial rumble
  _ambientVoid() {
    const ctx = this.ctx;
    const t = ctx.currentTime;

    [
      [38, 0.08],
      [40.5, 0.06],
    ].forEach(([freq, vol]) => {
      const { osc, gain } = this._osc('sine', freq, vol, t, null);
      this.ambientNodes.push({ osc, gain });
    });
  }

  setMute(muted) {
    this._init();
    this._muted = muted;
    this.masterGain.gain.setValueAtTime(muted ? 0.001 : this._volume, this.ctx.currentTime);
  }

  toggleMute() {
    this.setMute(!this._muted);
    return this._muted;
  }

  setVolume(v) {
    this._init();
    this._volume = Math.max(0, Math.min(1, v));
    if (!this._muted) this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
  }
}

window.audioManager = new AudioManager();
