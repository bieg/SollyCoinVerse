// ===================================================================================
// ==                    GAME ENDING - TV FREQUENCIES                               ==
// ==                                                                                 ==
// ==      Pure TV static aesthetic - nothing else                                   ==
// ===================================================================================

class GameEndingCinematic {
  constructor() {
    this.isActive = false;
    this.container = null;
    this.noiseCanvas = null;
    this.noiseCtx = null;
    this.animationId = null;
    this.DEBUG = true;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[CinematicEnding]', ...args);
    }
  }

  start() {
    if (this.isActive) return;

    this.debugLog('📺 TV FREQUENCIES STARTING');
    this.isActive = true;

    this.createContainer();
    this.createNoiseLayer();
    this.createVideoLayer();
    this.createColorGlitchLayer();
    this.createScanlinesLayer();
    this.createRefreshBar();
    this.animateNoise();
    this.startSequence();
    this.startColorGlitches();
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
    this.debugLog('Container created');
  }

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
    `;

    this.noiseCanvas.width = 256;
    this.noiseCanvas.height = 256;

    this.noiseCtx = this.noiseCanvas.getContext('2d');
    this.container.appendChild(this.noiseCanvas);
    this.debugLog('Noise layer created');
  }

  createVideoLayer() {
    // Video layer - sits between noise and scanlines
    this.videoElement = document.createElement('video');
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

    this.videoElement.addEventListener('ended', () => this.onVideoEnded());
    this.videoElement.addEventListener('error', (e) => {
      this.debugLog('Video error:', e);
    });

    this.container.appendChild(this.videoElement);
    this.debugLog('Video layer created');
  }

  createColorGlitchLayer() {
    // Container for fast color glitch stripes
    this.glitchLayer = document.createElement('div');
    this.glitchLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 4;
      pointer-events: none;
      overflow: hidden;
    `;
    this.container.appendChild(this.glitchLayer);
    this.debugLog('Color glitch layer created');
  }

  startColorGlitches() {
    // Random color glitch stripes that flash across the screen
    const colors = [
      'rgba(255, 0, 100, 0.4)', // Magenta/pink
      'rgba(0, 255, 200, 0.4)', // Cyan
      'rgba(255, 50, 0, 0.4)', // Red/orange
      'rgba(100, 0, 255, 0.3)', // Purple
      'rgba(255, 255, 0, 0.3)', // Yellow
      'rgba(0, 150, 255, 0.4)', // Blue
    ];

    const triggerGlitch = () => {
      if (!this.isActive) return;

      // Random chance of glitch
      if (Math.random() < 0.15) {
        const stripe = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const height = 2 + Math.random() * 8;
        const top = Math.random() * 100;

        stripe.style.cssText = `
          position: absolute;
          left: 0;
          width: 100%;
          height: ${height}px;
          top: ${top}%;
          background: ${color};
          box-shadow: 0 0 10px ${color};
        `;

        this.glitchLayer.appendChild(stripe);

        // Remove after quick flash (30-80ms)
        setTimeout(
          () => {
            stripe.remove();
          },
          30 + Math.random() * 50,
        );
      }

      // Schedule next glitch check
      setTimeout(triggerGlitch, 50 + Math.random() * 150);
    };

    triggerGlitch();
  }

  triggerIntenseGlitch() {
    if (!this.isActive || !this.glitchLayer) return;

    const colors = [
      'rgba(255, 215, 0, 0.6)', // Gold (dominant)
      'rgba(255, 255, 0, 0.5)', // Yellow
      'rgba(0, 150, 255, 0.5)', // Blue
      'rgba(255, 100, 0, 0.5)', // Orange
      'rgba(255, 0, 100, 0.5)', // Magenta
      'rgba(0, 255, 200, 0.5)', // Cyan
    ];

    const stripe = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const height = 5 + Math.random() * 20; // Thicker stripes
    const top = Math.random() * 100;

    stripe.style.cssText = `
      position: absolute;
      left: 0;
      width: 100%;
      height: ${height}px;
      top: ${top}%;
      background: ${color};
      box-shadow: 0 0 20px ${color};
    `;

    this.glitchLayer.appendChild(stripe);

    setTimeout(() => stripe.remove(), 50 + Math.random() * 100);
  }

  createScanlinesLayer() {
    // Scanlines overlay - above video
    this.scanlinesOverlay = document.createElement('div');
    this.scanlinesOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 5;
      pointer-events: none;
      opacity: 0.4;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.3) 2px,
        rgba(0, 0, 0, 0.3) 4px
      );
    `;
    this.container.appendChild(this.scanlinesOverlay);

    // Moving frequency lines - above video
    this.frequencyBars = document.createElement('div');
    this.frequencyBars.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 6;
      pointer-events: none;
      overflow: hidden;
    `;

    // Add animated lines
    for (let i = 0; i < 8; i++) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        left: 0;
        width: 100%;
        height: ${1 + Math.random() * 4}px;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.6) 20%,
          rgba(255, 255, 255, 0.6) 80%,
          transparent 100%
        );
        animation: freqMove ${2 + Math.random() * 3}s linear infinite;
        animation-delay: ${Math.random() * 2}s;
        top: ${Math.random() * 100}%;
      `;
      this.frequencyBars.appendChild(line);
    }

    this.container.appendChild(this.frequencyBars);

    // Animation keyframes
    const style = document.createElement('style');
    style.id = 'freq-style';
    style.textContent = `
      @keyframes freqMove {
        0% { transform: translateY(-100vh); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(100vh); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    this.animationStyle = style;

    this.debugLog('Scanlines created');
  }

  createRefreshBar() {
    // The classic CRT refresh rate bar - thick horizontal band that rolls down
    this.refreshBar = document.createElement('div');
    this.refreshBar.style.cssText = `
      position: absolute;
      left: 0;
      width: 100%;
      height: 80px;
      z-index: 7;
      pointer-events: none;
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(255, 255, 255, 0.03) 20%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.03) 80%,
        transparent 100%
      );
      top: 0;
    `;
    this.container.appendChild(this.refreshBar);

    // Animate the refresh bar rolling down
    this.refreshBarY = 0;
    this.debugLog('Refresh bar created');
  }

  startSequence() {
    // Start with static for 2 seconds, then fade in video
    setTimeout(() => {
      this.debugLog('Starting video...');
      this.videoElement
        .play()
        .then(() => {
          // Fade in video
          this.videoElement.style.opacity = '1';
          // Reduce noise but keep visible
          this.noiseCanvas.style.opacity = '0.15';
        })
        .catch((err) => {
          this.debugLog('Autoplay blocked:', err);
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
      z-index: 100;
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 24px;
      text-align: center;
      cursor: pointer;
    `;
    clickPrompt.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">▶</div>
      <div>CLICK TO PLAY</div>
    `;

    clickPrompt.addEventListener('click', () => {
      clickPrompt.remove();
      this.videoElement.play();
      this.videoElement.style.opacity = '1';
      this.noiseCanvas.style.opacity = '0.15';
    });

    this.container.appendChild(clickPrompt);
  }

  onVideoEnded() {
    this.debugLog('Video ended - DIRECT GEEL VLAK');

    // Video VOLLEDIG verwijderen (geen ghost!)
    this.videoElement.pause();
    this.videoElement.style.display = 'none';
    this.videoElement.remove();

    // Noise ook weg
    this.noiseCanvas.style.opacity = '0';

    // === STAP 1: ZWART VLAK groeit vanuit midden ===
    const blackOverlay = document.createElement('div');
    blackOverlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: #000000;
      z-index: 100;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.3s ease-out;
    `;
    this.container.appendChild(blackOverlay);

    // Start groei naar volledig scherm
    setTimeout(() => {
      blackOverlay.style.width = '200vmax';
      blackOverlay.style.height = '200vmax';
    }, 10);

    // Na 300ms groei: 100% zwart scherm, even rust
    setTimeout(() => {
      blackOverlay.style.borderRadius = '0';
      blackOverlay.style.width = '100%';
      blackOverlay.style.height = '100%';
      blackOverlay.style.top = '0';
      blackOverlay.style.left = '0';
      blackOverlay.style.transform = 'none';

      // Na 150ms zwart: HOT PINK!
      setTimeout(() => {
        blackOverlay.style.background = '#FF69B4';

        // Na 50ms: GEEL!
        setTimeout(() => {
          blackOverlay.style.background = '#FFD700';

          // Na 60ms: fade out naar ei
          setTimeout(() => {
            blackOverlay.style.transition = 'opacity 0.4s ease';
            blackOverlay.style.opacity = '0';

            // Bring back subtle noise
            this.noiseCanvas.style.transition = 'opacity 0.4s ease';
            this.noiseCanvas.style.opacity = '0.3';

            // Start egg reveal
            setTimeout(() => {
              blackOverlay.remove();
              this.showEggReveal();
            }, 400);
          }, 60);
        }, 50);
      }, 150);
    }, 300);
  }

  showEggReveal() {
    this.debugLog('Showing egg reveal');

    // Reduce static
    this.noiseCanvas.style.transition = 'opacity 1s ease';
    this.noiseCanvas.style.opacity = '0.3';

    // Create egg container - boven alle andere layers (scanlines, glitches, etc)
    const eggContainer = document.createElement('div');
    eggContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 50;
      text-align: center;
    `;

    // Create the egg (oval shape) - translucent/glass-like
    const egg = document.createElement('div');
    egg.style.cssText = `
      width: 120px;
      height: 160px;
      background: linear-gradient(180deg,
        rgba(255, 250, 220, 0.3) 0%,
        rgba(218, 165, 32, 0.4) 50%,
        rgba(184, 134, 11, 0.3) 100%);
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      margin: 0 auto;
      position: relative;
      box-shadow:
        0 0 60px rgba(255, 215, 0, 0.5),
        inset 0 0 40px rgba(255, 255, 255, 0.2),
        inset 0 -20px 40px rgba(0,0,0,0.2);
      animation: eggGlow 1s ease-in-out infinite alternate;
      border: 1px solid rgba(255, 215, 0, 0.5);
      backdrop-filter: blur(2px);
    `;
    this.egg = egg;

    // Add crack lines (will animate)
    const crack = document.createElement('div');
    crack.style.cssText = `
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 60px;
      border-left: 2px solid transparent;
      transition: all 0.5s ease;
    `;
    crack.id = 'egg-crack';
    egg.appendChild(crack);

    eggContainer.appendChild(egg);
    this.container.appendChild(eggContainer);
    this.eggContainer = eggContainer;

    // Add animation style
    const eggStyle = document.createElement('style');
    eggStyle.id = 'egg-style';
    eggStyle.textContent = `
      @keyframes eggGlow {
        0% { box-shadow: 0 0 60px rgba(255, 215, 0, 0.4), inset 0 -20px 40px rgba(0,0,0,0.3); }
        100% { box-shadow: 0 0 100px rgba(255, 215, 0, 0.8), inset 0 -20px 40px rgba(0,0,0,0.3); }
      }
      @keyframes eggShake {
        0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
        25% { transform: translate(-50%, -50%) rotate(-2deg); }
        75% { transform: translate(-50%, -50%) rotate(2deg); }
      }
      @keyframes crackSpread {
        0% { clip-path: polygon(45% 0, 55% 0, 55% 0, 45% 0); }
        100% { clip-path: polygon(30% 0, 70% 0, 80% 100%, 20% 100%); }
      }
    `;
    document.head.appendChild(eggStyle);
    this.eggStyle = eggStyle;

    // Sequence: shake start
    setTimeout(() => {
      eggContainer.style.animation = 'eggShake 0.1s ease infinite';
    }, 100);

    // Show crack
    setTimeout(() => {
      crack.style.borderLeft = '3px solid #333';
      crack.style.width = '40px';
      crack.style.borderImage =
        'linear-gradient(180deg, transparent, #333 20%, #333 80%, transparent) 1';
    }, 300);

    // Create the final screen INSIDE the egg (tiny)
    setTimeout(() => {
      this.createFinalScreenInsideEgg();
    }, 500);

    // Start scaling + HOT PINK FLASH tijdens het groeien!
    setTimeout(() => {
      eggContainer.style.animation = 'none';

      // Start scaling
      egg.style.transition = 'all 1.2s ease-out';
      egg.style.transform = 'scale(8)';
      egg.style.opacity = '0';

      // Final screen grows from tiny to full size
      if (this.finalScreen) {
        this.finalScreen.style.transition = 'all 1.2s ease-out';
        this.finalScreen.style.transform = 'translate(-50%, -50%) scale(1)';
        this.finalScreen.style.opacity = '1';
      }

      // HOT PINK FLASH tijdens het groeien! (na 200ms)
      setTimeout(() => {
        egg.style.background = '#FF69B4';
        egg.style.boxShadow = '0 0 200px #FF69B4';
        egg.style.opacity = '0.8';

        // Terug naar goud na 50ms
        setTimeout(() => {
          egg.style.background = '#FFD700';
          egg.style.boxShadow = '0 0 300px rgba(255, 215, 0, 0.8)';
          egg.style.opacity = '0';
        }, 50);
      }, 200);

      // Fade noise back down
      setTimeout(() => {
        if (this.noiseCanvas) {
          this.noiseCanvas.style.transition = 'opacity 1s ease';
          this.noiseCanvas.style.opacity = '0.15';
        }
      }, 400);

      // Fade out glitches en scanlines
      setTimeout(() => {
        if (this.glitchLayer) {
          this.glitchLayer.style.transition = 'opacity 0.8s ease';
          this.glitchLayer.style.opacity = '0';
        }
        if (this.scanlinesOverlay) {
          this.scanlinesOverlay.style.transition = 'opacity 0.8s ease';
          this.scanlinesOverlay.style.opacity = '0';
        }
        if (this.frequencyBars) {
          this.frequencyBars.style.transition = 'opacity 0.8s ease';
          this.frequencyBars.style.opacity = '0';
        }
        if (this.refreshBar) {
          this.refreshBar.style.transition = 'opacity 0.8s ease';
          this.refreshBar.style.opacity = '0';
        }
      }, 600);
    }, 700);

    // Cleanup egg after animation
    setTimeout(() => {
      if (!this.isActive) return;
      if (this.eggContainer) this.eggContainer.remove();
      if (this.eggStyle) this.eggStyle.remove();
      if (this.noiseCanvas) this.noiseCanvas.style.opacity = '0.1';
    }, 2800);
  }

  createFinalScreenInsideEgg() {
    this.debugLog('Creating final screen inside egg');

    // Create final message - starts tiny inside egg
    // Semi-transparent with golden/amber tint - boven alle layers
    const finalScreen = document.createElement('div');
    finalScreen.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.05);
      z-index: 60;
      text-align: center;
      max-width: 900px;
      padding: 60px 80px;
      background: rgba(20, 15, 0, 0.92);
      border: 3px solid #FFD700;
      box-shadow: 0 0 100px rgba(255, 215, 0, 0.5), inset 0 0 80px rgba(255, 215, 0, 0.1);
      font-family: 'Courier New', monospace;
      color: #FFD700;
      opacity: 0;
      backdrop-filter: blur(4px);
    `;
    this.finalScreen = finalScreen;

    finalScreen.innerHTML = `
      <div style="margin-bottom: 25px; font-size: 14px; color: #B8860B;">
        ████████████████████████████████████████
      </div>
      <div style="margin-bottom: 30px; font-size: 18px; letter-spacing: 4px; color: #FFD700; text-shadow: 0 0 15px rgba(255,215,0,0.6);">
        S.'S JOURNAL - FINAL ENTRY
      </div>
      <div style="margin-bottom: 30px; font-size: 14px; color: #B8860B;">
        ████████████████████████████████████████
      </div>

      <p style="line-height: 2.1; margin-bottom: 24px; font-size: 21px; text-align: left; color: #DAA520;">
        "I created the OASIS because I never felt at home in the real world.
      </p>
      <p style="line-height: 2.1; margin-bottom: 24px; font-size: 21px; text-align: left; color: #DAA520;">
        But <span style="color: #FFFFFF; text-shadow: 0 0 10px #fff;">you</span>... you did something I never could.
      </p>
      <p style="line-height: 2.1; margin-bottom: 24px; font-size: 21px; text-align: left; color: #FFD700;">
        You didn't just find the egg.
      </p>
      <p style="line-height: 2.1; font-size: 26px; text-align: left; color: #FFFFFF; text-shadow: 0 0 20px #FFD700, 0 0 40px #FFD700;">
        You created your own Sollyverse."
      </p>

      <div style="text-align: right; margin-top: 45px; font-style: italic; color: #B8860B; font-size: 18px;">
        - S.<br>
        <span style="font-size: 13px; color: #8B7355;">(Solly? Satoshi? Someone else?)</span>
      </div>

      <div style="margin-top: 40px; font-size: 18px; color: #DAA520; text-align: center;">
        Thank you for playing my game
      </div>

      <div style="margin-top: 30px; font-size: 14px; color: #8B7355;">
        Press ESC to return
      </div>
    `;

    this.container.appendChild(finalScreen);

    // ESC to close
    this.escHandler = (e) => {
      if (e.key === 'Escape') {
        this.cleanup();
        document.removeEventListener('keydown', this.escHandler);
      }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  animateNoise() {
    if (!this.isActive || !this.noiseCtx) return;

    const ctx = this.noiseCtx;
    const w = this.noiseCanvas.width;
    const h = this.noiseCanvas.height;

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Darker noise - more like video static (0-80 range instead of 0-255)
      const gray = Math.random() * 80;

      // Occasional muted color burst (darker tones)
      if (Math.random() < 0.03) {
        data[i] = Math.random() * 100; // R - muted
        data[i + 1] = Math.random() * 80; // G - darker
        data[i + 2] = Math.random() * 120; // B - slightly more
      } else {
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    // Random horizontal interference
    if (Math.random() < 0.15) {
      const lineY = Math.random() * h;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.6})`;
      ctx.fillRect(0, lineY, w, 2 + Math.random() * 4);
    }

    // Animate refresh bar rolling down
    if (this.refreshBar) {
      this.refreshBarY += 2; // Speed of roll
      if (this.refreshBarY > window.innerHeight) {
        this.refreshBarY = -80;
      }
      this.refreshBar.style.top = this.refreshBarY + 'px';
    }

    this.animationId = requestAnimationFrame(() => this.animateNoise());
  }

  cleanup() {
    this.isActive = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Remove ESC handler
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }

    if (this.container) {
      this.container.remove();
    }

    if (this.animationStyle) {
      this.animationStyle.remove();
    }

    if (this.eggStyle) {
      this.eggStyle.remove();
    }

    this.container = null;
    this.noiseCanvas = null;
    this.noiseCtx = null;
    this.finalScreen = null;
    this.eggContainer = null;

    this.debugLog('Cleaned up');
  }
}

// Global access
window.GameEndingCinematic = GameEndingCinematic;

window.triggerCinematicEnding = function () {
  if (window.cinematicEnding && window.cinematicEnding.isActive) {
    console.log('⚠️ Already active');
    return;
  }

  console.log('📺 TRIGGERING TV FREQUENCIES');
  window.cinematicEnding = new GameEndingCinematic();
  window.cinematicEnding.start();
};
