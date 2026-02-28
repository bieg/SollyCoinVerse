// User Interface voor Solly World - Coin-based
class UserInterface {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.startedWithCoin = false;
    this.gameStarted = false;

    // Luister naar kaboom updates via EventBus
    this.eventBus = window.eventBus || null;
    if (this.eventBus) {
      this.eventBus.on('kaboomUpdated', () => this.updateKaboomUI());
    }
  }

  // Set if user started with coin (called from main game)
  setStartedWithCoin(startedWithCoin) {
    this.startedWithCoin = startedWithCoin;
  }

  // Set if game has started
  setGameStarted(started) {
    this.gameStarted = started;
    if (started) {
      this.updateKaboomUI();
    }
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

  showMessage(message, type) {
    document.querySelectorAll('.coin-message').forEach((msg) => msg.remove());

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
  refresh() {}

  // Initialize method for module compatibility
  async initialize() {
    console.log('🎨 UserInterface initialized');
    return Promise.resolve();
  }

  // Start method for module compatibility
  async start() {
    console.log('🎨 UserInterface started');
    return Promise.resolve();
  }

  // Stop method for module compatibility
  async stop() {
    console.log('🎨 UserInterface stopped');
    return Promise.resolve();
  }
}

window.UserInterface = UserInterface;
