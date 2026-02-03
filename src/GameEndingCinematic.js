// ===================================================================================
// ==                    GAME ENDING - CINEMATIC TV EXPERIENCE                      ==
// ==                                                                                 ==
// ==      Three-layer TV aesthetic:                                                  ==
// ==      1. BOTTOM: TV static/noise frequencies                                    ==
// ==      2. MIDDLE: the_idea.mp4 video                                             ==
// ==      3. TOP: Frequency scanlines overlay                                       ==
// ==                                                                                 ==
// ==      No text boxes. Pure visual cinema.                                        ==
// ===================================================================================
/* global THREE */

class GameEndingCinematic {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.isActive = false;
    this.container = null;
    this.videoElement = null;
    this.noiseCanvas = null;
    this.noiseCtx = null;
    this.animationId = null;

    this.DEBUG = window.DEBUG || false;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[GameEndingCinematic]', ...args);
    }
  }

  // Start the cinematic ending
  start() {
    if (this.isActive) return;

    this.debugLog('📺 CINEMATIC ENDING INITIATED');
    this.isActive = true;

    // Create the three-layer container
    this.createContainer();

    // Layer 1: TV Static noise (bottom)
    this.createNoiseLayer();

    // Layer 2: Video (middle)
    this.createVideoLayer();

    // Layer 3: Frequency scanlines (top)
    this.createScanlinesLayer();

    // Start the noise animation
    this.animateNoise();

    // Start with static, then fade in video
    this.startSequence();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'cinematic-ending';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 100000;
      background: #000;
      overflow: hidden;
    `;
    document.body.appendChild(this.container);
  }

  // ═══════════════════════════════════════════════════════════════
  // LAYER 1: TV STATIC NOISE (BOTTOM)
  // ═══════════════════════════════════════════════════════════════
  createNoiseLayer() {
    this.noiseCanvas = document.createElement('canvas');
    this.noiseCanvas.id = 'tv-noise';
    this.noiseCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      opacity: 1;
    `;

    // Set canvas size for performance (will be scaled up)
    this.noiseCanvas.width = 256;
    this.noiseCanvas.height = 256;

    this.noiseCtx = this.noiseCanvas.getContext('2d');
    this.container.appendChild(this.noiseCanvas);

    this.debugLog('📺 Noise layer created');
  }

  animateNoise() {
    if (!this.isActive || !this.noiseCtx) return;

    const ctx = this.noiseCtx;
    const w = this.noiseCanvas.width;
    const h = this.noiseCanvas.height;

    // Create noise pattern
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Random grayscale value
      const gray = Math.random() * 255;

      // Occasionally add colored noise for that analog TV feel
      if (Math.random() < 0.02) {
        // Color burst
        data[i] = Math.random() * 255; // R
        data[i + 1] = Math.random() * 255; // G
        data[i + 2] = Math.random() * 255; // B
      } else {
        data[i] = gray; // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
      }
      data[i + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);

    // Add horizontal interference lines
    if (Math.random() < 0.1) {
      const lineY = Math.random() * h;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
      ctx.fillRect(0, lineY, w, 2 + Math.random() * 3);
    }

    this.animationId = requestAnimationFrame(() => this.animateNoise());
  }

  // ═══════════════════════════════════════════════════════════════
  // LAYER 2: VIDEO (MIDDLE)
  // ═══════════════════════════════════════════════════════════════
  createVideoLayer() {
    this.videoElement = document.createElement('video');
    this.videoElement.id = 'ending-video';
    this.videoElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      min-width: 100%;
      min-height: 100%;
      width: auto;
      height: auto;
      z-index: 2;
      opacity: 0;
      object-fit: cover;
      transition: opacity 2s ease;
    `;

    this.videoElement.src = 'video/the_idea.mp4';
    this.videoElement.muted = false;
    this.videoElement.loop = false;
    this.videoElement.playsInline = true;
    this.videoElement.preload = 'auto';

    // When video ends, show final sequence
    this.videoElement.addEventListener('ended', () => {
      this.onVideoEnded();
    });

    // Error handling
    this.videoElement.addEventListener('error', (e) => {
      this.debugLog('❌ Video error:', e);
      // Fallback to just static with slow fade out
      this.showFinalStatic();
    });

    this.container.appendChild(this.videoElement);
    this.debugLog('🎬 Video layer created');
  }

  // ═══════════════════════════════════════════════════════════════
  // LAYER 3: FREQUENCY SCANLINES (TOP)
  // ═══════════════════════════════════════════════════════════════
  createScanlinesLayer() {
    // Create scanlines overlay
    this.scanlinesOverlay = document.createElement('div');
    this.scanlinesOverlay.id = 'scanlines-overlay';
    this.scanlinesOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 3;
      pointer-events: none;
      opacity: 0.4;
      background:
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, 0.3) 2px,
          rgba(0, 0, 0, 0.3) 4px
        );
    `;
    this.container.appendChild(this.scanlinesOverlay);

    // Create animated frequency bars
    this.frequencyBars = document.createElement('div');
    this.frequencyBars.id = 'frequency-bars';
    this.frequencyBars.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 4;
      pointer-events: none;
      opacity: 0.15;
      overflow: hidden;
    `;

    // Add moving frequency lines
    for (let i = 0; i < 5; i++) {
      const line = document.createElement('div');
      line.className = 'freq-line';
      line.style.cssText = `
        position: absolute;
        left: 0;
        width: 100%;
        height: ${1 + Math.random() * 3}px;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.8) 20%,
          rgba(255, 255, 255, 0.8) 80%,
          transparent 100%
        );
        animation: freqMove ${3 + Math.random() * 4}s linear infinite;
        animation-delay: ${Math.random() * 2}s;
        top: ${Math.random() * 100}%;
      `;
      this.frequencyBars.appendChild(line);
    }

    this.container.appendChild(this.frequencyBars);

    // Add the animation keyframes
    const style = document.createElement('style');
    style.id = 'freq-animation-style';
    style.textContent = `
      @keyframes freqMove {
        0% { transform: translateY(-100vh); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(100vh); opacity: 0; }
      }

      @keyframes glitchShift {
        0% { transform: translateX(0); }
        20% { transform: translateX(-2px); }
        40% { transform: translateX(2px); }
        60% { transform: translateX(-1px); }
        80% { transform: translateX(1px); }
        100% { transform: translateX(0); }
      }

      @keyframes rgbSplit {
        0% { text-shadow: -2px 0 #ff0000, 2px 0 #00ffff; }
        25% { text-shadow: 2px 0 #ff0000, -2px 0 #00ffff; }
        50% { text-shadow: -1px 0 #ff0000, 1px 0 #00ffff; }
        75% { text-shadow: 1px 0 #ff0000, -1px 0 #00ffff; }
        100% { text-shadow: -2px 0 #ff0000, 2px 0 #00ffff; }
      }

      #ending-video.glitch {
        animation: glitchShift 0.1s infinite;
      }
    `;
    document.head.appendChild(style);
    this.animationStyle = style;

    this.debugLog('📡 Scanlines layer created');
  }

  // ═══════════════════════════════════════════════════════════════
  // SEQUENCE CONTROL
  // ═══════════════════════════════════════════════════════════════
  startSequence() {
    this.debugLog('▶️ Starting sequence');

    // Phase 1: Pure static for 2 seconds
    setTimeout(() => {
      this.debugLog('📺 Fading in video...');

      // Start playing video
      this.videoElement
        .play()
        .then(() => {
          // Fade in video over the static
          this.videoElement.style.opacity = '1';

          // Reduce static opacity but keep it slightly visible
          this.noiseCanvas.style.transition = 'opacity 2s ease';
          this.noiseCanvas.style.opacity = '0.08';

          // Boost scanlines slightly during video
          this.scanlinesOverlay.style.opacity = '0.3';
        })
        .catch((err) => {
          this.debugLog('⚠️ Video autoplay blocked:', err);
          // Add click to play
          this.addClickToPlay();
        });
    }, 2000);
  }

  addClickToPlay() {
    const clickPrompt = document.createElement('div');
    clickPrompt.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 24px;
      text-align: center;
      cursor: pointer;
      animation: rgbSplit 0.2s infinite;
    `;
    clickPrompt.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">▶</div>
      <div>CLICK TO CONTINUE</div>
    `;

    clickPrompt.addEventListener('click', () => {
      clickPrompt.remove();
      this.videoElement.play();
      this.videoElement.style.opacity = '1';
      this.noiseCanvas.style.transition = 'opacity 2s ease';
      this.noiseCanvas.style.opacity = '0.08';
    });

    this.container.appendChild(clickPrompt);
  }

  onVideoEnded() {
    this.debugLog('🎬 Video ended, showing final sequence');

    // Glitch effect
    this.videoElement.classList.add('glitch');

    // Fade video out while bringing back static
    setTimeout(() => {
      this.videoElement.style.opacity = '0';
      this.noiseCanvas.style.opacity = '0.6';
      this.scanlinesOverlay.style.opacity = '0.5';
    }, 500);

    // After more static, fade to black
    setTimeout(() => {
      this.showFinalStatic();
    }, 3000);
  }

  showFinalStatic() {
    this.debugLog('📺 Final static sequence');

    // Intensify static briefly
    this.noiseCanvas.style.opacity = '1';
    this.frequencyBars.style.opacity = '0.3';

    // Then slowly fade everything to black
    setTimeout(() => {
      this.container.style.transition = 'opacity 4s ease';
      this.container.style.opacity = '0';

      // Cleanup after fade
      setTimeout(() => {
        this.cleanup();
        this.debugLog('✨ Cinematic ending complete');
      }, 4000);
    }, 2000);
  }

  // Add random glitch effects during playback
  addRandomGlitches() {
    if (!this.isActive) return;

    // Random chance of glitch
    if (Math.random() < 0.05) {
      // Brief static burst
      this.noiseCanvas.style.opacity = '0.3';
      setTimeout(
        () => {
          if (this.noiseCanvas) {
            this.noiseCanvas.style.opacity = '0.08';
          }
        },
        50 + Math.random() * 100,
      );
    }

    // RGB split on video
    if (Math.random() < 0.03) {
      this.videoElement.classList.add('glitch');
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.classList.remove('glitch');
        }
      }, 100);
    }

    setTimeout(() => this.addRandomGlitches(), 500 + Math.random() * 1000);
  }

  // ═══════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════
  cleanup() {
    this.isActive = false;

    // Stop animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Remove DOM elements
    if (this.container) {
      this.container.remove();
    }

    if (this.animationStyle) {
      this.animationStyle.remove();
    }

    // Cleanup references
    this.container = null;
    this.videoElement = null;
    this.noiseCanvas = null;
    this.noiseCtx = null;
    this.scanlinesOverlay = null;
    this.frequencyBars = null;

    this.debugLog('🧹 Cinematic ending cleaned up');
  }
}

// Make available globally
window.GameEndingCinematic = GameEndingCinematic;

// Trigger function
window.triggerCinematicEnding = function () {
  if (window.cinematicEnding && window.cinematicEnding.isActive) {
    console.log('⚠️ Cinematic ending already active');
    return;
  }

  console.log('📺 TRIGGERING CINEMATIC ENDING');
  window.cinematicEnding = new GameEndingCinematic(window.scene, window.camera, window.renderer);
  window.cinematicEnding.start();
};

// Export for module use
/* eslint-disable no-undef */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEndingCinematic;
}
/* eslint-enable no-undef */
