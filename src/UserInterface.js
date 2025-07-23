// User Interface voor Solly World - Coin-based
class UserInterface {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.startedWithCoin = false;
    this.gameStarted = false; // Track of game is gestart
    this.createUI();
  }

  createUI() {
    // Maak alleen de Load Coin button (verborgen tot game start)
    const loadCoinButton = document.createElement('button');
    loadCoinButton.id = 'load-coin-btn';
    loadCoinButton.textContent = '📁 Load Coin';
    loadCoinButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      border: none;
      background: #8A2BE2;
      color: white;
      cursor: pointer;
      font-weight: bold;
      z-index: 3000;
      display: none;
      box-shadow: 0 4px 12px rgba(138, 43, 226, 0.4);
      transition: all 0.2s ease;
    `;

    // Hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'coin-file-input';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    // Add elements to page
    document.body.appendChild(loadCoinButton);
    document.body.appendChild(fileInput);

    // Setup event listeners
    this.setupEventListeners();
  }

  // Toon de Load Coin button wanneer game start
  showLoadCoinButton() {
    const loadCoinBtn = document.getElementById('load-coin-btn');
    if (loadCoinBtn) {
      loadCoinBtn.style.display = 'block';
    }
  }

  // Verberg de Load Coin button (bijvoorbeeld na het laden van een coin)
  hideLoadCoinButton() {
    const loadCoinBtn = document.getElementById('load-coin-btn');
    if (loadCoinBtn) {
      loadCoinBtn.style.display = 'none';
    }
  }

  // Set if user started with coin (called from main game)
  setStartedWithCoin(startedWithCoin) {
    this.startedWithCoin = startedWithCoin;
    this.updateLoadCoinButton();
  }

  // Set if game has started
  setGameStarted(started) {
    this.gameStarted = started;
    if (started) {
      this.showLoadCoinButton();
      // Initialize kaboom counter when game starts
      this.updateKaboomUI();
    }
    this.updateLoadCoinButton();
  }

  updateLoadCoinButton() {
    const loadCoinBtn = document.getElementById('load-coin-btn');
    if (loadCoinBtn) {
      if (this.startedWithCoin) {
        loadCoinBtn.style.display = 'none';
        loadCoinBtn.title = 'Coin al geladen - geen nieuwe coin mogelijk';
      } else if (this.gameStarted) {
        loadCoinBtn.style.display = 'block';
        loadCoinBtn.title = 'Upload je SollyCoin om je game te veranderen';
      } else {
        loadCoinBtn.style.display = 'none';
        loadCoinBtn.title = 'Game nog niet gestart';
      }
    }
  }

  setupEventListeners() {
    const loadCoinBtn = document.getElementById('load-coin-btn');
    const fileInput = document.getElementById('coin-file-input');

    loadCoinBtn.addEventListener('click', () => {
      if (!this.startedWithCoin && this.gameStarted) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', (e) => {
      this.handleCoinImport(e.target.files[0]);
    });
  }

  handleCoinImport(file) {
    if (!file || this.startedWithCoin) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const coinData = JSON.parse(e.target.result);
        
        // Validate coin structure
        if (!this.isValidCoin(coinData)) {
          throw new Error('Ongeldige SollyCoin structuur');
        }

        // Load coin as current user
        this.gameManager.loadCoinData(coinData);
        
        // Mark as started with coin
        this.setStartedWithCoin(true);
        
        // Show success message
        this.showMessage('✅ Coin succesvol geladen! Universe herstart...', 'success');
        
        // Restart universe with new coin data (niet hele pagina reloaden)
        setTimeout(() => {
          if (typeof restartUniverse === 'function') {
            restartUniverse();
          } else {
            // Fallback naar page reload als restartUniverse niet beschikbaar is
            location.reload();
          }
        }, 2000);
        
      } catch (error) {
        this.showMessage('❌ Fout bij importeren: ' + error.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  isValidCoin(data) {
    return data && 
           typeof data.level === 'string' &&
           typeof data.shape === 'string' &&
           typeof data.size === 'number' &&
           typeof data.kaboom === 'number' &&
           data.sterren && typeof data.sterren.wit === 'number' &&
           data.planeten && typeof data.planeten.rood === 'number' &&
           data.sollys && typeof data.sollys === 'object' &&
           typeof data.sollys.geel === 'number' && 
           typeof data.sollys.blauw === 'number' &&
           typeof data.sollys.pink === 'number' &&
           typeof data.sollys.rood === 'number' &&
           (!data.uniqueIdentifier || typeof data.uniqueIdentifier === 'string') &&
           (!data.id || typeof data.id === 'string') &&
           (!data.createdAt || typeof data.createdAt === 'string') &&
           (!data.lastPlayed || typeof data.lastPlayed === 'string') &&
           (!data.sessionStart || typeof data.sessionStart === 'string') &&
           (!data.metadata || typeof data.metadata === 'object');
  }

  showMessage(message, type) {
    // Remove existing messages
    document.querySelectorAll('.coin-message').forEach(msg => msg.remove());

    const messageEl = document.createElement('div');
    messageEl.className = 'coin-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-weight: bold;
    `;

    document.body.appendChild(messageEl);
    setTimeout(() => messageEl.remove(), 3000);
  }

  // Public method to refresh UI
  refresh() {
    this.updateLoadCoinButton();
  }

  updateKaboomUI() {
    if (this.gameManager) {
      const kaboomCount = this.gameManager.getKaboomCount();
      const kaboomNumber = document.getElementById('kaboom-number');
      if (kaboomNumber) {
        kaboomNumber.textContent = kaboomCount;
        console.log('💥 KABOOM UI bijgewerkt naar:', kaboomCount);
      }
    }
  }

  // Initialize method for module compatibility
  async initialize() {
    console.log("🎨 UserInterface initialized");
    return Promise.resolve();
  }

  // Start method for module compatibility
  async start() {
    console.log("🎨 UserInterface started");
    return Promise.resolve();
  }

  // Stop method for module compatibility
  async stop() {
    console.log("🎨 UserInterface stopped");
    return Promise.resolve();
  }
}

window.UserInterface = UserInterface; 