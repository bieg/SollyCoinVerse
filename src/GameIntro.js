// ===================================================================================
// ==                           GAME INTRO - VOICE/TYPE INTERACTION                 ==
// ==                                                                                ==
// ==      "Put on your headphones. Solly says hi. Say or type 'hi' to begin."      ==
// ===================================================================================

class GameIntro {
  constructor() {
    this.isActive = false;
    this.recognition = null;
    this.typedText = '';
    this.triggered = false;
    this.audioContext = null;
    this.sollyAudio = null;
    this.starWarsAudio = null;

    // Valid trigger words - LOTR "Speak friend and enter" / "Pedo mellon a minno"
    this.triggerWords = ['mellon', 'friend'];

    // Bind methods
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleSpeechResult = this.handleSpeechResult.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  // Initialize and show the intro screen
  init() {
    console.log('🎬 GameIntro initializing...');
    this.isActive = true;
    this.triggered = false;
    this.typedText = '';

    // Create intro UI
    this.createIntroUI();

    // Setup keyboard listener
    document.addEventListener('keydown', this.handleKeydown);

    // Setup mouse tracking for parallax
    document.addEventListener('mousemove', this.handleMouseMove);

    // Setup speech recognition (optional, may fail)
    this.setupSpeechRecognition();

    // Preload audio
    this.preloadAudio();

    console.log('✅ GameIntro ready - waiting for user interaction');
  }

  // Create the intro screen UI
  createIntroUI() {
    // Remove existing intro if present
    const existing = document.getElementById('game-intro-screen');
    if (existing) existing.remove();

    const introScreen = document.createElement('div');
    introScreen.id = 'game-intro-screen';
    introScreen.innerHTML = `
            <!-- Parallax background layers - extreme depth for more effect -->
            <div class="parallax-container" id="parallax-container">
                <div class="parallax-layer layer-1" data-depth="0.1"></div>
                <div class="parallax-layer layer-2" data-depth="0.4"></div>
                <div class="parallax-layer layer-3" data-depth="0.9"></div>
                <div class="parallax-overlay"></div>
            </div>

            <!-- Spider-Verse style animated background -->
            <div class="spiderverse-bg">
                <div class="comic-dots"></div>
                <div class="color-shift"></div>
            </div>

            <div class="intro-content">
                <!-- Title above: Say Friend -->
                <h1 class="intro-title">
                    <span class="say-friend">Speak <em>Friend</em></span>
                </h1>

                <!-- Headphones with mic inside -->
                <div class="headphones-mic-container">
                    <svg class="headphones-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <!-- Headband -->
                        <path class="headband" d="M30 100 Q30 30 100 30 Q170 30 170 100"
                              fill="none" stroke="url(#headphoneGradient)" stroke-width="12" stroke-linecap="round"/>
                        <!-- Left ear cup -->
                        <ellipse class="ear-cup left" cx="30" cy="110" rx="25" ry="35" fill="url(#cupGradient)"/>
                        <ellipse class="ear-cushion" cx="30" cy="110" rx="18" ry="28" fill="#1a1a2e"/>
                        <!-- Right ear cup -->
                        <ellipse class="ear-cup right" cx="170" cy="110" rx="25" ry="35" fill="url(#cupGradient)"/>
                        <ellipse class="ear-cushion" cx="170" cy="110" rx="18" ry="28" fill="#1a1a2e"/>
                        <!-- Sound waves -->
                        <g class="sound-waves left-waves">
                            <path d="M50 95 Q60 110 50 125" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.6"/>
                            <path d="M60 85 Q75 110 60 135" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.4"/>
                        </g>
                        <g class="sound-waves right-waves">
                            <path d="M150 95 Q140 110 150 125" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.6"/>
                            <path d="M140 85 Q125 110 140 135" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.4"/>
                        </g>
                        <!-- Gradients -->
                        <defs>
                            <linearGradient id="headphoneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#FF6B6B"/>
                                <stop offset="50%" style="stop-color:#FFD700"/>
                                <stop offset="100%" style="stop-color:#4ECDC4"/>
                            </linearGradient>
                            <linearGradient id="cupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:#FF6B6B"/>
                                <stop offset="100%" style="stop-color:#C44569"/>
                            </linearGradient>
                        </defs>
                    </svg>

                    <!-- Microphone centered inside headphones -->
                    <div class="mic-container" id="mic-container">
                        <svg class="mic-svg" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                            <!-- Voice ripples emanating from mic -->
                            <g class="voice-ripples" id="voice-ripples">
                                <circle class="ripple r1" cx="50" cy="40" r="20" fill="none" stroke="#FFD700" stroke-width="2"/>
                                <circle class="ripple r2" cx="50" cy="40" r="30" fill="none" stroke="#FF6B6B" stroke-width="2"/>
                                <circle class="ripple r3" cx="50" cy="40" r="40" fill="none" stroke="#4ECDC4" stroke-width="2"/>
                            </g>
                            <!-- Mic head -->
                            <ellipse class="mic-head" cx="50" cy="35" rx="18" ry="25" fill="url(#micGradient)"/>
                            <!-- Mic grille lines -->
                            <g class="mic-grille">
                                <line x1="38" y1="25" x2="62" y2="25" stroke="#1a1a2e" stroke-width="1.5" opacity="0.5"/>
                                <line x1="36" y1="32" x2="64" y2="32" stroke="#1a1a2e" stroke-width="1.5" opacity="0.5"/>
                                <line x1="36" y1="39" x2="64" y2="39" stroke="#1a1a2e" stroke-width="1.5" opacity="0.5"/>
                                <line x1="38" y1="46" x2="62" y2="46" stroke="#1a1a2e" stroke-width="1.5" opacity="0.5"/>
                            </g>
                            <!-- Mic neck -->
                            <rect class="mic-neck" x="45" y="58" width="10" height="20" rx="2" fill="url(#micGradient)"/>
                            <!-- Mic base -->
                            <ellipse class="mic-base" cx="50" cy="85" rx="20" ry="6" fill="url(#baseGradient)"/>
                            <!-- Gradients -->
                            <defs>
                                <linearGradient id="micGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#5a5a7a"/>
                                    <stop offset="50%" style="stop-color:#4a4a6a"/>
                                    <stop offset="100%" style="stop-color:#3a3a5a"/>
                                </linearGradient>
                                <linearGradient id="baseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#4a4a6a"/>
                                    <stop offset="100%" style="stop-color:#2a2a4a"/>
                                </linearGradient>
                            </defs>
                        </svg>
                        <div class="mic-glow"></div>
                    </div>
                </div>

                <!-- Hint below -->
                <div class="input-hint" id="input-hint">
                    <span class="hint-text">or type, and enter</span>
                    <div class="typed-display" id="typed-display"></div>
                </div>
            </div>
        `;

    // Add styles - Spider-Verse inspired
    const style = document.createElement('style');
    style.id = 'game-intro-styles';
    style.textContent = `
            #game-intro-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #0a0a1a;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 100000;
                overflow: hidden;
            }

            /* Parallax layers */
            .parallax-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                pointer-events: none;
            }

            .parallax-layer {
                position: absolute;
                top: -15%;
                left: -15%;
                width: 130%;
                height: 130%;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                transition: transform 0.15s ease-out;
                will-change: transform;
            }

            .layer-1 {
                background-image: url('images/parallax/layer1.png');
                opacity: 0.85;
                filter: saturate(1.4) contrast(1.1);
            }

            .layer-2 {
                background-image: url('images/parallax/layer2.png');
                opacity: 0.9;
                filter: saturate(1.5) contrast(1.15);
            }

            .layer-3 {
                background-image: url('images/parallax/layer3.png');
                opacity: 0.95;
                filter: saturate(1.6) contrast(1.2);
            }

            .parallax-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(ellipse at center,
                    rgba(10, 10, 26, 0.1) 0%,
                    rgba(10, 10, 26, 0.3) 60%,
                    rgba(10, 10, 26, 0.7) 100%);
                pointer-events: none;
            }

            /* Spider-Verse style background */
            .spiderverse-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }

            .comic-dots {
                position: absolute;
                width: 100%;
                height: 100%;
                background-image: radial-gradient(circle, rgba(255,107,107,0.15) 1px, transparent 1px);
                background-size: 20px 20px;
                animation: dotShift 10s linear infinite;
            }

            .color-shift {
                position: absolute;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    45deg,
                    rgba(255, 107, 107, 0.1) 0%,
                    rgba(78, 205, 196, 0.1) 25%,
                    rgba(255, 215, 0, 0.1) 50%,
                    rgba(155, 89, 182, 0.1) 75%,
                    rgba(255, 107, 107, 0.1) 100%
                );
                background-size: 400% 400%;
                animation: gradientShift 8s ease infinite;
            }

            @keyframes dotShift {
                0% { background-position: 0 0; }
                100% { background-position: 20px 20px; }
            }

            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            #game-intro-screen .intro-content {
                text-align: center;
                color: white;
                font-family: 'Open Sans', sans-serif;
                position: relative;
                z-index: 1;
            }

            /* Say Friend title */
            #game-intro-screen .intro-title {
                font-size: 2.5em;
                margin-bottom: 30px;
                font-weight: 700;
                letter-spacing: 2px;
            }

            .say-friend {
                color: #FFFFFF;
                text-shadow:
                    0 0 10px rgba(255, 255, 255, 0.5),
                    0 0 30px rgba(255, 215, 0, 0.3);
            }

            .say-friend em {
                font-style: italic;
                color: #FFD700;
                text-shadow:
                    0 0 15px rgba(255, 215, 0, 0.8),
                    0 0 30px rgba(255, 215, 0, 0.5);
            }

            /* Headphones with mic container */
            .headphones-mic-container {
                position: relative;
                width: 320px;
                height: 280px;
                margin: 0 auto 30px auto;
            }

            .headphones-svg {
                width: 100%;
                height: 100%;
                filter: drop-shadow(0 0 30px rgba(255, 107, 107, 0.5))
                        drop-shadow(0 0 60px rgba(255, 215, 0, 0.3));
            }

            .headband {
                animation: headbandPulse 2s ease-in-out infinite;
            }

            .ear-cup {
                animation: cupPulse 2s ease-in-out infinite;
            }

            .ear-cup.right {
                animation-delay: 0.5s;
            }

            .sound-waves path {
                animation: soundWave 1.5s ease-in-out infinite;
            }

            .left-waves path:nth-child(1) { animation-delay: 0s; }
            .left-waves path:nth-child(2) { animation-delay: 0.2s; }
            .right-waves path:nth-child(1) { animation-delay: 0.1s; }
            .right-waves path:nth-child(2) { animation-delay: 0.3s; }

            @keyframes headbandPulse {
                0%, 100% { stroke-width: 12; }
                50% { stroke-width: 14; }
            }

            @keyframes cupPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            @keyframes soundWave {
                0%, 100% { opacity: 0.2; transform: translateX(0); }
                50% { opacity: 0.8; transform: translateX(5px); }
            }

            /* Mic centered inside headphones */
            .headphones-mic-container .mic-container {
                position: absolute;
                top: 50%;
                left: calc(50% - 15px);
                transform: translate(-50%, -50%);
                width: 70px;
                height: 90px;
                margin: 0;
                animation: micTremble 0.15s ease-in-out infinite;
            }

            .headphones-mic-container .mic-svg {
                width: 100%;
                height: 100%;
                filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.3));
            }

            .headphones-mic-container .mic-glow {
                position: absolute;
                top: 15%;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 60px;
                background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                animation: glowPulse 1.5s ease-in-out infinite;
            }

            /* Mic tremble animation */
            @keyframes micTremble {
                0%, 100% { transform: translate(-50%, -40%) rotate(0deg); }
                25% { transform: translate(calc(-50% - 1px), -40%) rotate(-0.5deg); }
                75% { transform: translate(calc(-50% + 1px), -40%) rotate(0.5deg); }
            }

            @keyframes glowPulse {
                0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
                50% { opacity: 0.8; transform: translateX(-50%) scale(1.1); }
            }

            /* Input hint - regular weight 300 */
            #game-intro-screen .input-hint {
                margin-top: 30px;
                font-size: 1.3em;
                text-align: center;
            }

            .hint-text {
                color: rgba(255, 255, 255, 0.85);
                font-weight: 300;
                font-size: 1em;
                letter-spacing: 0.5px;
            }

            #game-intro-screen .typed-display {
                width: 100%;
                margin-top: 20px;
                font-size: 2em;
                font-weight: 700;
                color: #4ECDC4;
                min-height: 60px;
                letter-spacing: 8px;
                text-shadow: 0 0 20px rgba(78, 205, 196, 0.8);
            }

            /* Microphone container */
            .mic-container {
                position: relative;
                width: 120px;
                height: 160px;
                margin: 30px auto 0 auto;
                animation: micFloat 2s ease-in-out infinite, micTremble 0.15s ease-in-out infinite;
            }

            .mic-svg {
                width: 100%;
                height: 100%;
                filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.4));
            }

            .mic-head {
                transform-origin: center center;
            }

            /* Mic glow effect */
            .mic-glow {
                position: absolute;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                width: 80px;
                height: 80px;
                background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                animation: glowPulse 1.5s ease-in-out infinite;
            }

            /* Subtle constant tremble */
            @keyframes micTremble {
                0%, 100% { transform: translateX(0) rotate(0deg); }
                25% { transform: translateX(-1px) rotate(-0.5deg); }
                75% { transform: translateX(1px) rotate(0.5deg); }
            }

            @keyframes micFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }

            @keyframes glowPulse {
                0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
                50% { opacity: 0.8; transform: translateX(-50%) scale(1.1); }
            }

            /* Voice ripples - idle state (subtle) */
            .voice-ripples .ripple {
                opacity: 0.2;
                transform-origin: center;
            }

            .ripple.r1 {
                animation: rippleIdle 2s ease-in-out infinite;
            }
            .ripple.r2 {
                animation: rippleIdle 2s ease-in-out infinite 0.3s;
            }
            .ripple.r3 {
                animation: rippleIdle 2s ease-in-out infinite 0.6s;
            }

            @keyframes rippleIdle {
                0%, 100% { opacity: 0.1; transform: scale(0.9); }
                50% { opacity: 0.25; transform: scale(1.05); }
            }

            /* Voice ripples - ACTIVE state when Solly speaks */
            .mic-container.speaking .ripple {
                opacity: 1;
            }

            .mic-container.speaking .ripple.r1 {
                animation: rippleSpeak 0.4s ease-out infinite;
            }
            .mic-container.speaking .ripple.r2 {
                animation: rippleSpeak 0.4s ease-out infinite 0.1s;
            }
            .mic-container.speaking .ripple.r3 {
                animation: rippleSpeak 0.4s ease-out infinite 0.2s;
            }

            @keyframes rippleSpeak {
                0% {
                    opacity: 0.9;
                    transform: scale(0.8);
                    stroke-width: 4;
                }
                100% {
                    opacity: 0;
                    transform: scale(1.8);
                    stroke-width: 1;
                }
            }

            /* Mic shakes more intensely when speaking */
            .mic-container.speaking {
                animation: micFloat 2s ease-in-out infinite, micShake 0.08s ease-in-out infinite;
            }

            @keyframes micShake {
                0%, 100% { transform: translateX(0) rotate(0deg); }
                25% { transform: translateX(-3px) rotate(-2deg); }
                75% { transform: translateX(3px) rotate(2deg); }
            }

            .mic-container.speaking .mic-glow {
                animation: glowIntense 0.3s ease-in-out infinite;
            }

            @keyframes glowIntense {
                0%, 100% {
                    opacity: 0.6;
                    transform: translateX(-50%) scale(1);
                    background: radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 70%);
                }
                50% {
                    opacity: 1;
                    transform: translateX(-50%) scale(1.3);
                    background: radial-gradient(circle, rgba(255, 107, 107, 0.6) 0%, rgba(255, 215, 0, 0.3) 50%, transparent 70%);
                }
            }

            /* Gravitational wave effect - more colorful */
            .gravitational-wave {
                position: fixed;
                top: 50%;
                left: 50%;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                border: 6px solid;
                border-color: #FF6B6B #FFD700 #4ECDC4 #9B59B6;
                transform: translate(-50%, -50%);
                animation: expandWave 2.8s cubic-bezier(0.15, 0.6, 0.4, 1) forwards;
                pointer-events: none;
                z-index: 100001;
                box-shadow:
                    0 0 30px rgba(255, 107, 107, 0.9),
                    0 0 60px rgba(255, 215, 0, 0.7),
                    inset 0 0 30px rgba(78, 205, 196, 0.5);
            }

            @keyframes expandWave {
                0% {
                    width: 10px;
                    height: 10px;
                    opacity: 1;
                    border-width: 6px;
                    transform: translate(-50%, -50%) rotate(0deg);
                    box-shadow:
                        0 0 40px rgba(255, 107, 107, 1),
                        0 0 80px rgba(255, 215, 0, 0.9);
                }
                50% {
                    opacity: 0.85;
                    box-shadow:
                        0 0 80px rgba(255, 107, 107, 0.8),
                        0 0 150px rgba(255, 215, 0, 0.6);
                }
                100% {
                    width: 400vmax;
                    height: 400vmax;
                    opacity: 0;
                    border-width: 100px;
                    transform: translate(-50%, -50%) rotate(180deg);
                    box-shadow:
                        0 0 150px rgba(255, 107, 107, 0),
                        0 0 200px rgba(255, 215, 0, 0);
                }
            }

            /* Screen flash - subtle white burst */
            .screen-flash {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: radial-gradient(ellipse at center,
                    rgba(255, 255, 255, 0.9) 0%,
                    rgba(255, 215, 0, 0.4) 40%,
                    rgba(78, 205, 196, 0.2) 70%,
                    transparent 100%);
                z-index: 100002;
                animation: flashColor 0.8s ease-out forwards;
                pointer-events: none;
            }

            @keyframes flashColor {
                0% { opacity: 0; transform: scale(0.8); }
                20% { opacity: 0.7; transform: scale(1); }
                100% { opacity: 0; transform: scale(1.2); }
            }

            /* Transition start - subtle zoom begins */
            #game-intro-screen.transition-start {
                animation: transitionZoom 2.5s ease-in-out forwards;
            }

            #game-intro-screen.transition-start .parallax-layer {
                animation: parallaxPullIn 2.5s ease-in-out forwards;
            }

            #game-intro-screen.transition-start .intro-content {
                animation: contentFadeUp 1.5s ease-out forwards;
            }

            @keyframes transitionZoom {
                0% { transform: scale(1); }
                100% { transform: scale(1.15); }
            }

            @keyframes parallaxPullIn {
                0% { filter: saturate(1.5) contrast(1.2); }
                50% { filter: saturate(2) contrast(1.4) brightness(1.1); }
                100% { filter: saturate(0.5) contrast(0.8) brightness(1.5); }
            }

            @keyframes contentFadeUp {
                0% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-50px); }
            }

            /* Fade out animation - smoother */
            #game-intro-screen.fade-out {
                animation: fadeOutSmooth 1s ease-in-out forwards;
            }

            @keyframes fadeOutSmooth {
                0% { opacity: 1; }
                100% { opacity: 0; transform: scale(1.3); }
            }
        `;

    document.head.appendChild(style);
    document.body.appendChild(introScreen);
  }

  // Handle mouse movement for parallax effect
  handleMouseMove(event) {
    if (!this.isActive) return;

    const container = document.getElementById('parallax-container');
    if (!container) return;

    const layers = container.querySelectorAll('.parallax-layer');
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Calculate mouse offset from center (-1 to 1)
    const mouseX = (event.clientX - centerX) / centerX;
    const mouseY = (event.clientY - centerY) / centerY;

    layers.forEach((layer) => {
      const depth = parseFloat(layer.dataset.depth) || 0.5;
      const moveX = mouseX * depth * 80; // Max 80px movement - doubled for more effect
      const moveY = mouseY * depth * 60; // Max 60px movement - doubled for more effect

      layer.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
    });
  }

  // Setup Web Speech API recognition
  setupSpeechRecognition() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('⚠️ Speech recognition not supported in this browser');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US'; // Also recognizes "hallo" etc.

      this.recognition.onresult = this.handleSpeechResult;

      this.recognition.onerror = (event) => {
        // Only log once, not on every error
        if (!this.speechErrorLogged) {
          console.warn('⚠️ Speech recognition error:', event.error);
          this.speechErrorLogged = true;
        }
        // Stop retrying on permission errors
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.speechDisabled = true;
        }
      };

      this.recognition.onend = () => {
        // Restart if still active, not triggered, and not disabled due to errors
        if (this.isActive && !this.triggered && !this.speechDisabled) {
          try {
            this.recognition.start();
          } catch (e) {
            // Ignore restart errors
          }
        }
      };

      // Start listening
      this.recognition.start();

      // Show mic indicator as active
      const micIndicator = document.getElementById('mic-indicator');
      if (micIndicator) micIndicator.classList.add('active');

      console.log('🎤 Speech recognition started');
    } catch (error) {
      console.warn('⚠️ Could not start speech recognition:', error);
    }
  }

  // Handle speech recognition results
  handleSpeechResult(event) {
    if (this.triggered) return;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript.toLowerCase().trim();
      console.log('🎤 Heard:', transcript);

      // Check if any trigger word is in the transcript
      for (const word of this.triggerWords) {
        if (transcript.includes(word)) {
          console.log(`✅ Trigger word detected: "${word}"`);
          this.trigger();
          return;
        }
      }

      // Only accept "melon" as speech recognition variant of "mellon"
      if (transcript.includes('melon')) {
        console.log('✅ "Melon" detected (mellon variant)');
        this.trigger();
        return;
      }
    }
  }

  // Handle keyboard input
  handleKeydown(event) {
    if (this.triggered || !this.isActive) return;

    // Ignore modifier keys
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key.toLowerCase();

    // Only accept letters
    if (key.length === 1 && /[a-z]/.test(key)) {
      this.typedText += key;

      // Update display
      const display = document.getElementById('typed-display');
      if (display) {
        display.textContent = this.typedText;
      }

      // Check if typed text matches any trigger word
      for (const word of this.triggerWords) {
        if (this.typedText.endsWith(word)) {
          console.log(`✅ Typed trigger word: "${word}"`);
          this.trigger();
          return;
        }
      }

      // Reset if typed text gets too long
      if (this.typedText.length > 10) {
        this.typedText = this.typedText.slice(-5);
      }
    }

    // Backspace to correct
    if (key === 'backspace') {
      this.typedText = this.typedText.slice(0, -1);
      const display = document.getElementById('typed-display');
      if (display) display.textContent = this.typedText;
    }
  }

  // Trigger the game start sequence
  trigger() {
    if (this.triggered) return;
    this.triggered = true;
    this.isActive = false;

    console.log('🚀 TRIGGER! Starting game sequence...');

    // Stop speech recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        /* ignore */
      }
    }

    // Remove keyboard listener
    document.removeEventListener('keydown', this.handleKeydown);

    // Remove mouse listener
    document.removeEventListener('mousemove', this.handleMouseMove);

    // Smooth transition sequence
    const introScreen = document.getElementById('game-intro-screen');

    // Step 1: Start fading parallax immediately with zoom effect
    if (introScreen) {
      introScreen.classList.add('transition-start');
    }

    // Step 2: Gravitational wave builds up (starts subtle)
    setTimeout(() => {
      this.createGravitationalWave();
    }, 300);

    // Step 3: Screen flash at the peak moment
    setTimeout(() => {
      this.createScreenFlash();
    }, 900);

    // Step 5: Final fade out
    setTimeout(() => {
      if (introScreen) {
        introScreen.classList.add('fade-out');
      }
    }, 1100);

    // Step 6: Clean transition to game
    setTimeout(() => {
      this.cleanup();
      this.startGame();
    }, 2200);
  }

  // Create gravitational wave effect
  createGravitationalWave() {
    console.log('🌊 Creating gravitational wave...');

    // Create multiple waves
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const wave = document.createElement('div');
        wave.className = 'gravitational-wave';
        document.body.appendChild(wave);

        // Remove after animation
        setTimeout(() => wave.remove(), 2000);
      }, i * 150);
    }
  }

  // Create screen flash effect
  createScreenFlash() {
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }

  // Preload audio files
  preloadAudio() {
    // Solly "Hi" audio (text-to-speech fallback)
    this.sollyAudio = new Audio();
  }

  // Play Solly's "Hi" greeting
  playSollyHi() {
    const micContainer = document.getElementById('mic-container');

    // Activate mic speaking animation BEFORE speech starts
    if (micContainer) {
      micContainer.classList.add('speaking');
    }

    // Try Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Hi!');
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      utterance.volume = 0.8;

      // Try to find a friendly voice
      const voices = speechSynthesis.getVoices();
      const friendlyVoice = voices.find(
        (v) => v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en'),
      );
      if (friendlyVoice) utterance.voice = friendlyVoice;

      // When speech ends, stop mic animation
      utterance.onend = () => {
        if (micContainer) {
          micContainer.classList.remove('speaking');
        }
      };

      // Also set a backup timeout in case onend doesn't fire
      setTimeout(() => {
        if (micContainer) {
          micContainer.classList.remove('speaking');
        }
      }, 1500);

      speechSynthesis.speak(utterance);
      console.log('🔊 Solly says Hi! - mic vibrating');
    } else {
      // If no speech synthesis, still animate mic briefly
      setTimeout(() => {
        if (micContainer) {
          micContainer.classList.remove('speaking');
        }
      }, 800);
    }
  }

  // Cleanup intro elements
  cleanup() {
    const introScreen = document.getElementById('game-intro-screen');
    const introStyles = document.getElementById('game-intro-styles');

    if (introScreen) introScreen.remove();
    if (introStyles) introStyles.remove();

    console.log('🧹 GameIntro cleaned up');
  }

  // Start the actual game
  startGame() {
    console.log('🎮 Starting Sollyverse...');

    // Emit custom event for main.js to catch
    const event = new CustomEvent('gameIntroComplete', {
      detail: { timestamp: Date.now() },
    });
    document.dispatchEvent(event);

    // Also call global function if available
    if (typeof window.onGameIntroComplete === 'function') {
      window.onGameIntroComplete();
    }
  }

  // Stop and cleanup everything
  destroy() {
    this.isActive = false;
    this.triggered = true;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        /* ignore */
      }
    }

    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    this.cleanup();
  }
}

// Export for use in main.js
window.GameIntro = GameIntro;

console.log('✅ GameIntro.js loaded');
