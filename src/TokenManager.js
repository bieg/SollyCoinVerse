// ==                    HYBRIDE TOKEN VERHANDELING SYSTEEM                    ==
// ==      1. ERC-20 tokens voor kleine scores                                ==
// ==      2. ERC-721 NFTs voor grote milestones                              ==
// ==      3. Polygon network voor lage kosten                                ==
// ==      4. Wallet integratie en DEX trading                                ==
// ==============================================================================

class TokenManager {
    constructor() {
        // Token configuratie
        this.network = 'polygon'; // Polygon voor lage kosten
        this.contractAddresses = {
            scoreToken: null, // ERC-20 contract address
            scoreNFT: null,   // ERC-721 contract address
            gameFactory: null // Game factory contract
        };
        
        // Score thresholds
        this.scoreThresholds = {
            small: 10,    // < 10 = ERC-20 tokens
            medium: 50,   // 10-50 = ERC-20 tokens
            large: 100,   // > 100 = ERC-721 NFT
            milestone: 1000 // Speciale milestone NFT
        };
        
        // Wallet state
        this.walletConnected = false;
        this.walletAddress = null;
        this.web3 = null;
        
        // Token contracts
        this.scoreTokenContract = null;
        this.scoreNFTContract = null;
        
        // UI elements
        this.tokenUI = null;
        this.tradingUI = null;
        
        this.demoMode = false;
        // Start standaard in demo mode
        this.enableDemoMode();
        this.createTokenUI();
        this.createTradingUI();
        this.setupEventListeners();
        console.log('🚀 TokenManager geïnitialiseerd');
    }
    
    // === INITIALIZATION ===
    
    async initialize() {
        await this.setupWeb3();
        await this.loadContracts();
        this.createTokenUI();
        this.createTradingUI();
        this.setupEventListeners();
    }
    
    async setupWeb3() {
        // Check voor MetaMask of andere wallet
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Request account access pas bij connectWallet, niet hier
                // this code is now only used after connectWallet
                return true;
            } catch (error) {
                console.error('❌ Wallet connection failed:', error);
            }
        } else {
            console.log('⚠️ No wallet detected, using demo mode');
            this.enableDemoMode();
        }
    }
    
    async loadContracts() {
        // Contract ABIs (vereenvoudigd voor demo)
        const scoreTokenABI = [
            {
                "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
                "name": "mint",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
                "name": "transfer",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ];
        
        const scoreNFTABI = [
            {
                "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                "name": "mint",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                "name": "tokenURI",
                "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                "stateMutability": "view",
                "type": "function"
            }
        ];
        
        // Demo contract addresses (in productie zouden dit echte deployed contracts zijn)
        this.contractAddresses = {
            scoreToken: '0x1234567890123456789012345678901234567890',
            scoreNFT: '0x0987654321098765432109876543210987654321',
            gameFactory: '0x1111111111111111111111111111111111111111'
        };
        
        if (this.web3) {
            try {
                this.scoreTokenContract = new this.web3.eth.Contract(
                    scoreTokenABI, 
                    this.contractAddresses.scoreToken
                );
                
                this.scoreNFTContract = new this.web3.eth.Contract(
                    scoreNFTABI, 
                    this.contractAddresses.scoreNFT
                );
                
                console.log('✅ Smart contracts loaded');
            } catch (error) {
                console.error('❌ Contract loading failed:', error);
            }
        }
    }
    
    // === UI CREATION ===
    
    createTokenUI() {
        // Check of UI al bestaat
        if (document.querySelector('.token-manager')) {
            console.log('✅ Token UI bestaat al');
            return;
        }
        
        const tokenContainer = document.createElement('div');
        tokenContainer.className = 'token-manager';
        tokenContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #8A2BE2;
            border-radius: 15px;
            padding: 20px;
            z-index: 10000;
            font-family: 'Arial', sans-serif;
            min-width: 300px;
            box-shadow: 0 4px 20px rgba(138, 43, 226, 0.3);
        `;
        
        // Header
        const header = document.createElement('h3');
        header.textContent = '🎯 Score Tokens';
        header.style.cssText = `
            margin: 0 0 15px 0;
            color: #8A2BE2;
            font-size: 18px;
            text-align: center;
        `;
        
        // Wallet status
        const walletStatus = document.createElement('div');
        walletStatus.className = 'wallet-status';
        walletStatus.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>Wallet:</strong> 
                <span class="wallet-address">${this.walletConnected ? this.walletAddress?.slice(0, 6) + '...' + this.walletAddress?.slice(-4) : 'Niet verbonden'}</span>
            </div>
        `;
        
        // Token balances
        const tokenBalances = document.createElement('div');
        tokenBalances.className = 'token-balances';
        tokenBalances.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>Score Tokens:</strong> 
                <span class="score-token-balance">0</span>
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Score NFTs:</strong> 
                <span class="score-nft-balance">0</span>
            </div>
        `;
        
        // Action buttons
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        actionButtons.innerHTML = `
            <button class="connect-wallet-btn" style="
                background: #8A2BE2;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                margin: 5px;
                cursor: pointer;
                font-size: 12px;
            ">Connect Wallet</button>
            <button class="mint-token-btn" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                margin: 5px;
                cursor: pointer;
                font-size: 12px;
            ">Mint Score Token</button>
            <button class="trade-token-btn" style="
                background: #FF9800;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                margin: 5px;
                cursor: pointer;
                font-size: 12px;
            ">Trade Tokens</button>
        `;
        
        tokenContainer.appendChild(header);
        tokenContainer.appendChild(walletStatus);
        tokenContainer.appendChild(tokenBalances);
        tokenContainer.appendChild(actionButtons);
        document.body.appendChild(tokenContainer);
        
        this.tokenUI = tokenContainer;
        console.log('✅ Token UI aangemaakt');
    }
    
    createTradingUI() {
        // Check of UI al bestaat
        if (document.querySelector('.trading-panel')) {
            console.log('✅ Trading UI bestaat al');
            return;
        }
        
        const tradingContainer = document.createElement('div');
        tradingContainer.className = 'trading-panel';
        tradingContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 3px solid #FFD700;
            border-radius: 15px;
            padding: 30px;
            z-index: 10001;
            font-family: 'Arial', sans-serif;
            min-width: 400px;
            display: none;
            box-shadow: 0 8px 32px rgba(255, 215, 0, 0.4);
        `;
        
        // Header
        const header = document.createElement('h2');
        header.textContent = '💰 Token Trading';
        header.style.cssText = `
            margin: 0 0 20px 0;
            color: #FFD700;
            font-size: 24px;
            text-align: center;
        `;
        
        // Trading form
        const tradingForm = document.createElement('div');
        tradingForm.innerHTML = `
            <div style="margin-bottom: 15px;">
                <label style="color: white; display: block; margin-bottom: 5px;">Token Type:</label>
                <select class="token-type-select" style="
                    width: 100%;
                    padding: 8px;
                    border-radius: 5px;
                    border: 1px solid #FFD700;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                ">
                    <option value="score">Score Tokens (ERC-20)</option>
                    <option value="nft">Score NFTs (ERC-721)</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="color: white; display: block; margin-bottom: 5px;">Amount:</label>
                <input type="number" class="token-amount-input" placeholder="Enter amount" style="
                    width: 100%;
                    padding: 8px;
                    border-radius: 5px;
                    border: 1px solid #FFD700;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                ">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="color: white; display: block; margin-bottom: 5px;">Recipient Address:</label>
                <input type="text" class="recipient-address-input" placeholder="0x..." style="
                    width: 100%;
                    padding: 8px;
                    border-radius: 5px;
                    border: 1px solid #FFD700;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                ">
            </div>
            <div style="text-align: center;">
                <button class="execute-trade-btn" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 5px;
                ">Execute Trade</button>
                <button class="close-trading-btn" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 5px;
                ">Close</button>
            </div>
        `;
        
        tradingContainer.appendChild(header);
        tradingContainer.appendChild(tradingForm);
        document.body.appendChild(tradingContainer);
        
        this.tradingUI = tradingContainer;
        console.log('✅ Trading UI aangemaakt');
    }
    
    // === EVENT LISTENERS ===
    
    setupEventListeners() {
        // Connect wallet button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('connect-wallet-btn')) {
                this.connectWallet();
            }
            if (e.target.classList.contains('mint-token-btn')) {
                this.mintScoreToken();
            }
            if (e.target.classList.contains('trade-token-btn')) {
                this.showTradingPanel();
            }
            if (e.target.classList.contains('execute-trade-btn')) {
                this.executeTrade();
            }
            if (e.target.classList.contains('close-trading-btn')) {
                this.hideTradingPanel();
            }
        });
    }
    
    // === WALLET OPERATIONS ===
    
    async connectWallet() {
        if (!window.ethereum) {
            alert('Geen wallet gevonden. Installeer MetaMask!');
            return;
        }
        
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            this.walletAddress = accounts[0];
            this.walletConnected = true;
            this.web3 = new Web3(window.ethereum);
            this.demoMode = false;
            
            await this.loadContracts();
            this.updateUI();
            
            console.log('✅ Wallet connected:', this.walletAddress);
        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            alert('Wallet verbinding mislukt!');
        }
    }
    
    // === TOKEN OPERATIONS ===
    
    async mintScoreToken() {
        if (!this.walletConnected) {
            alert('Verbind eerst je wallet!');
            return;
        }
        
        // Haal huidige score op
        const currentScore = this.getCurrentScore();
        if (currentScore === 0) {
            alert('Je hebt nog geen score om te tokenizen!');
            return;
        }
        
        try {
            if (currentScore >= this.scoreThresholds.large) {
                // Mint NFT voor grote scores
                await this.mintScoreNFT(currentScore);
            } else {
                // Mint ERC-20 tokens voor kleine scores
                await this.mintScoreTokens(currentScore);
            }
            
            console.log('✅ Score tokenized successfully');
        } catch (error) {
            console.error('❌ Token minting failed:', error);
            alert('Token minting mislukt!');
        }
    }
    
    async mintScoreTokens(score) {
        if (!this.scoreTokenContract || !this.walletAddress) {
            throw new Error('Contract or wallet not available');
        }
        
        const tokenAmount = score * 100; // 1 score = 100 tokens
        
        const result = await this.scoreTokenContract.methods.mint(
            this.walletAddress,
            tokenAmount
        ).send({
            from: this.walletAddress,
            gas: 200000
        });
        
        console.log('✅ Score tokens minted:', tokenAmount);
        this.updateUI();
        
        return result;
    }
    
    async mintScoreNFT(score) {
        if (!this.scoreNFTContract || !this.walletAddress) {
            throw new Error('Contract or wallet not available');
        }
        
        const tokenId = Date.now(); // Unieke token ID
        
        const result = await this.scoreNFTContract.methods.mint(
            this.walletAddress,
            tokenId
        ).send({
            from: this.walletAddress,
            gas: 300000
        });
        
        console.log('✅ Score NFT minted:', tokenId);
        this.updateUI();
        
        return result;
    }
    
    async executeTrade() {
        if (!this.walletConnected) {
            alert('Verbind eerst je wallet!');
            return;
        }
        
        const tokenType = document.querySelector('.token-type-select').value;
        const amount = document.querySelector('.token-amount-input').value;
        const recipient = document.querySelector('.recipient-address-input').value;
        
        if (!amount || !recipient) {
            alert('Vul alle velden in!');
            return;
        }
        
        try {
            if (tokenType === 'score') {
                await this.transferScoreTokens(recipient, amount);
            } else {
                await this.transferScoreNFT(recipient, amount);
            }
            
            this.hideTradingPanel();
            console.log('✅ Trade executed successfully');
        } catch (error) {
            console.error('❌ Trade failed:', error);
            alert('Trade mislukt!');
        }
    }
    
    async transferScoreTokens(to, amount) {
        if (!this.scoreTokenContract || !this.walletAddress) {
            throw new Error('Contract or wallet not available');
        }
        
        const result = await this.scoreTokenContract.methods.transfer(
            to,
            amount
        ).send({
            from: this.walletAddress,
            gas: 100000
        });
        
        console.log('✅ Score tokens transferred:', amount);
        this.updateUI();
        
        return result;
    }
    
    async transferScoreNFT(to, tokenId) {
        if (!this.scoreNFTContract || !this.walletAddress) {
            throw new Error('Contract or wallet not available');
        }
        
        const result = await this.scoreNFTContract.methods.transferFrom(
            this.walletAddress,
            to,
            tokenId
        ).send({
            from: this.walletAddress,
            gas: 150000
        });
        
        console.log('✅ Score NFT transferred:', tokenId);
        this.updateUI();
        
        return result;
    }
    
    // === UI OPERATIONS ===
    
    showTradingPanel() {
        if (this.tradingUI) {
            this.tradingUI.style.display = 'block';
        }
    }
    
    hideTradingPanel() {
        if (this.tradingUI) {
            this.tradingUI.style.display = 'none';
        }
    }
    
    updateUI() {
        // Update wallet status
        const walletAddress = document.querySelector('.wallet-address');
        if (walletAddress) {
            walletAddress.textContent = this.walletConnected ? 
                this.walletAddress?.slice(0, 6) + '...' + this.walletAddress?.slice(-4) : 
                'Niet verbonden';
        }
        
        // Update token balances (demo values)
        const scoreTokenBalance = document.querySelector('.score-token-balance');
        const scoreNFTBalance = document.querySelector('.score-nft-balance');
        
        if (scoreTokenBalance) {
            scoreTokenBalance.textContent = this.getCurrentScore() * 100;
        }
        if (scoreNFTBalance) {
            scoreNFTBalance.textContent = this.getCurrentScore() >= this.scoreThresholds.large ? 1 : 0;
        }
    }
    
    // === UTILITY METHODS ===
    
    getCurrentScore() {
        // Haal score op van GameManager of botsing system
        if (window.gameManager && typeof window.gameManager.getKaboomCount === 'function') {
            return window.gameManager.getKaboomCount();
        }
        return 0;
    }
    
    // === PUBLIC METHODS ===
    
    getTokenStats() {
        return {
            walletConnected: this.walletConnected,
            walletAddress: this.walletAddress,
            currentScore: this.getCurrentScore(),
            scoreTokens: this.getCurrentScore() * 100,
            scoreNFTs: this.getCurrentScore() >= this.scoreThresholds.large ? 1 : 0
        };
    }
    
    // Test functie voor debugging
    testTokenMinting() {
        console.log('🧪 Test token minting...');
        this.mintScoreToken();
    }
    
    // Demo mode voor testing zonder wallet
    enableDemoMode() {
        console.log('🎮 Demo mode enabled');
        this.walletConnected = false;
        this.walletAddress = null;
        this.demoMode = true;
        this.updateUI();
    }
}

// Maak globaal beschikbaar
window.TokenManager = TokenManager;

// Test functies
window.testTokenManager = function() {
    if (window.tokenManager) {
        window.tokenManager.testTokenMinting();
    } else {
        console.log('❌ TokenManager niet gevonden');
    }
};

window.enableDemoMode = function() {
    if (window.tokenManager) {
        window.tokenManager.enableDemoMode();
    } else {
        console.log('❌ TokenManager niet gevonden');
    }
};

window.showTradingPanel = function() {
    if (window.tokenManager) {
        window.tokenManager.showTradingPanel();
    } else {
        console.log('❌ TokenManager niet gevonden');
    }
};

// Check token system status
window.checkTokenStatus = function() {
    console.log('🔍 Check token system status...');
    
    // Check TokenManager
    console.log('TokenManager:', window.tokenManager ? '✅' : '❌');
    
    // Check wallet connection
    if (window.tokenManager) {
        const stats = window.tokenManager.getTokenStats();
        console.log('Wallet Connected:', stats.walletConnected ? '✅' : '❌');
        console.log('Current Score:', stats.currentScore);
        console.log('Score Tokens:', stats.scoreTokens);
        console.log('Score NFTs:', stats.scoreNFTs);
    }
    
    // Check UI elements
    const tokenUI = document.querySelector('.token-manager');
    const tradingUI = document.querySelector('.trading-panel');
    console.log('Token UI:', tokenUI ? '✅' : '❌');
    console.log('Trading UI:', tradingUI ? '✅' : '❌');
}; 