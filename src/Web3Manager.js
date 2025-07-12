// ===================================================================================
// ==                                                                             ==
// ==                           SOLLYVERSE WEB3 MANAGER                          ==
// ==                                                                             ==
// ==      Bevat alle Web3 functionaliteit:                                     ==
// ==      - MetaMask integratie                                                ==
// ==      - Wallet connectie en management                                     ==
// ==      - Network detection en switching                                     ==
// ==      - Smart contract interacties                                         ==
// ==      - Transaction handling                                               ==
// ===================================================================================

export class Web3Manager {
  constructor() {
    this.web3 = null;
    this.accounts = [];
    this.currentAccount = null;
    this.networkId = null;
    this.networkName = null;
    this.isConnected = false;
    this.contracts = {};
    this.pendingTransactions = [];
    
    // Supported networks
    this.supportedNetworks = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Mumbai Testnet',
      31337: 'Hardhat Local'
    };
    
    // Contract addresses (to be updated after deployment)
    this.contractAddresses = {
      1: '', // Mainnet - to be deployed
      11155111: '', // Sepolia - to be deployed
      137: '', // Polygon - to be deployed
      80001: '', // Mumbai - to be deployed
      31337: '' // Local - to be deployed
    };
    
    this.eventListeners = [];
    
    console.log('🌐 Web3Manager initialized');
  }

  // Initialize Web3 and check for MetaMask
  async initialize() {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        console.log('🦊 MetaMask detected');
        
        // Create Web3 instance
        this.web3 = new Web3(window.ethereum);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          this.handleAccountsChanged(accounts);
        });
        
        // Listen for network changes
        window.ethereum.on('chainChanged', (chainId) => {
          this.handleChainChanged(chainId);
        });
        
        // Try to connect automatically
        await this.connectWallet();
        
        return true;
      } else {
        console.warn('⚠️ MetaMask not detected');
        this.showMetaMaskInstallPrompt();
        return false;
      }
    } catch (error) {
      console.error('❌ Error initializing Web3:', error);
      return false;
    }
  }

  // Connect to MetaMask wallet
  async connectWallet() {
    try {
      if (!this.web3) {
        throw new Error('Web3 not initialized');
      }

      console.log('🔗 Connecting to MetaMask...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      await this.handleAccountsChanged(accounts);
      
      // Get network info
      await this.updateNetworkInfo();
      
      console.log('✅ Wallet connected successfully');
      this.isConnected = true;
      
      // Trigger connected event
      this.triggerEvent('walletConnected', {
        account: this.currentAccount,
        network: this.networkName,
        networkId: this.networkId
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      this.isConnected = false;
      
      // Trigger error event
      this.triggerEvent('walletError', {
        error: error.message
      });
      
      return false;
    }
  }

  // Disconnect wallet
  disconnectWallet() {
    this.accounts = [];
    this.currentAccount = null;
    this.isConnected = false;
    this.contracts = {};
    
    console.log('🔌 Wallet disconnected');
    
    // Trigger disconnected event
    this.triggerEvent('walletDisconnected');
  }

  // Handle account changes
  async handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      console.log('🔌 No accounts found');
      this.disconnectWallet();
    } else if (accounts[0] !== this.currentAccount) {
      console.log('👤 Account changed:', accounts[0]);
      this.accounts = accounts;
      this.currentAccount = accounts[0];
      
      // Trigger account changed event
      this.triggerEvent('accountChanged', {
        account: this.currentAccount
      });
    }
  }

  // Handle network changes
  async handleChainChanged(chainId) {
    console.log('🌐 Network changed:', chainId);
    
    // Reload page for network changes (MetaMask recommendation)
    window.location.reload();
  }

  // Update network information
  async updateNetworkInfo() {
    try {
      this.networkId = await this.web3.eth.getChainId();
      this.networkName = this.supportedNetworks[this.networkId] || 'Unknown Network';
      
      console.log('🌐 Connected to network:', this.networkName, `(ID: ${this.networkId})`);
      
      // Check if network is supported
      if (!this.supportedNetworks[this.networkId]) {
        console.warn('⚠️ Unsupported network detected');
        this.triggerEvent('unsupportedNetwork', {
          networkId: this.networkId,
          networkName: this.networkName
        });
      }
    } catch (error) {
      console.error('❌ Error getting network info:', error);
    }
  }

  // Switch network
  async switchNetwork(networkId) {
    try {
      if (!this.supportedNetworks[networkId]) {
        throw new Error('Unsupported network');
      }

      console.log('🔄 Switching to network:', this.supportedNetworks[networkId]);
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkId.toString(16)}` }]
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error switching network:', error);
      
      // If network doesn't exist, add it
      if (error.code === 4902) {
        return await this.addNetwork(networkId);
      }
      
      return false;
    }
  }

  // Add network to MetaMask
  async addNetwork(networkId) {
    try {
      const networkConfig = this.getNetworkConfig(networkId);
      
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig]
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error adding network:', error);
      return false;
    }
  }

  // Get network configuration
  getNetworkConfig(networkId) {
    const configs = {
      11155111: { // Sepolia
        chainId: '0xaa36a7',
        chainName: 'Sepolia Testnet',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io/']
      },
      80001: { // Mumbai
        chainId: '0x13881',
        chainName: 'Mumbai Testnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/']
      }
    };
    
    return configs[networkId];
  }

  // Get current account balance
  async getBalance(account = null) {
    try {
      const address = account || this.currentAccount;
      if (!address) return '0';
      
      const balance = await this.web3.eth.getBalance(address);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('❌ Error getting balance:', error);
      return '0';
    }
  }

  // Send transaction
  async sendTransaction(transaction) {
    try {
      console.log('📤 Sending transaction:', transaction);
      
      const tx = await this.web3.eth.sendTransaction({
        from: this.currentAccount,
        ...transaction
      });
      
      console.log('✅ Transaction successful:', tx.transactionHash);
      
      // Add to pending transactions
      this.pendingTransactions.push({
        hash: tx.transactionHash,
        from: this.currentAccount,
        to: transaction.to,
        value: transaction.value || '0',
        timestamp: Date.now()
      });
      
      // Trigger transaction event
      this.triggerEvent('transactionSent', {
        hash: tx.transactionHash,
        receipt: tx
      });
      
      return tx;
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      
      // Trigger error event
      this.triggerEvent('transactionError', {
        error: error.message
      });
      
      throw error;
    }
  }

  // Get gas estimate
  async estimateGas(transaction) {
    try {
      const gasEstimate = await this.web3.eth.estimateGas({
        from: this.currentAccount,
        ...transaction
      });
      
      return gasEstimate;
    } catch (error) {
      console.error('❌ Error estimating gas:', error);
      return null;
    }
  }

  // Get gas price
  async getGasPrice() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      return this.web3.utils.fromWei(gasPrice, 'gwei');
    } catch (error) {
      console.error('❌ Error getting gas price:', error);
      return null;
    }
  }

  // Load smart contract
  async loadContract(contractName, address = null) {
    try {
      const contractAddress = address || this.contractAddresses[this.networkId];
      
      if (!contractAddress) {
        throw new Error(`No contract address for ${contractName} on network ${this.networkId}`);
      }
      
      // Load contract ABI (to be implemented)
      const abi = await this.loadContractABI(contractName);
      
      // Create contract instance
      this.contracts[contractName] = new this.web3.eth.Contract(abi, contractAddress);
      
      console.log(`📜 Loaded contract: ${contractName} at ${contractAddress}`);
      
      return this.contracts[contractName];
    } catch (error) {
      console.error(`❌ Error loading contract ${contractName}:`, error);
      return null;
    }
  }

  // Load contract ABI (placeholder)
  async loadContractABI(contractName) {
    // This will be implemented when we have actual contracts
    // For now, return empty array
    return [];
  }

  // Show MetaMask install prompt
  showMetaMaskInstallPrompt() {
    const message = `
      <div style="text-align: center; padding: 20px;">
        <h3>🦊 MetaMask Required</h3>
        <p>Om de SollyCoin dApp te gebruiken heb je MetaMask nodig.</p>
        <a href="https://metamask.io/download/" target="_blank" 
           style="background: #f6851b; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          Download MetaMask
        </a>
      </div>
    `;
    
    if (typeof showUniverseModal === 'function') {
      showUniverseModal(message, 'MetaMask Installatie');
    } else {
      alert('MetaMask is vereist voor deze dApp. Download het op https://metamask.io/download/');
    }
  }

  // Event system
  addEventListener(event, callback) {
    this.eventListeners.push({ event, callback });
  }

  removeEventListener(event, callback) {
    this.eventListeners = this.eventListeners.filter(
      listener => !(listener.event === event && listener.callback === callback)
    );
  }

  triggerEvent(event, data = {}) {
    this.eventListeners.forEach(listener => {
      if (listener.event === event) {
        listener.callback(data);
      }
    });
  }

  // Get current status
  getStatus() {
    return {
      isConnected: this.isConnected,
      currentAccount: this.currentAccount,
      networkId: this.networkId,
      networkName: this.networkName,
      accounts: this.accounts,
      pendingTransactions: this.pendingTransactions.length
    };
  }

  // Helper methods for UI
  getCurrentAccount() {
    return this.currentAccount;
  }

  getCurrentNetwork() {
    return this.networkName;
  }

  // Cleanup
  cleanup() {
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners();
    }
    
    this.eventListeners = [];
    this.contracts = {};
    this.pendingTransactions = [];
  }

    /**
     * Initialiseer contract manager met contract addresses
     */
    async initializeContracts() {
        try {
            console.log("📋 Initializing smart contracts...");
            
            // Contract addresses (update na deployment)
            const contractAddresses = {
                SollyCoin: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Localhost deployment
                SollyNFT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",  // Localhost deployment
                GameFactory: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" // Localhost deployment
            };
            
            // Initialize contract manager if available
            if (this.contractManager) {
                await this.contractManager.initialize(contractAddresses);
            } else {
                console.log("📋 ContractManager not available, skipping contract initialization");
            }
            
        } catch (error) {
            console.error("❌ Contract initialization failed:", error);
            // Continue zonder contracts voor development
        }
    }

    // Initialize method for module compatibility
    async initialize() {
      console.log("🌐 Web3Manager initialized");
      return Promise.resolve();
    }

    // Set contract manager reference
    setContractManager(contractManager) {
      this.contractManager = contractManager;
      console.log("📋 ContractManager reference set");
    }
}

// Export voor gebruik in andere modules
window.Web3Manager = Web3Manager; 