// ===================================================================================
// ==                           WEB3 MANAGER MODULE                              ==
// ==                                                                             ==
// ==      Bevat alle Web3 functionaliteit:                                      ==
// ==      - Wallet connectie en management                                      ==
// ==      - Network detection en switching                                      ==
// ==      - Account management                                                   ==
// ==      - Transaction handling                                                ==
// ===================================================================================
/* global Web3 */

class Web3Manager {
  constructor() {
    this.web3 = null;
    this.provider = null;
    this.isConnected = false;
    this.currentAccount = null;
    this.currentNetwork = null;
    this.eventListeners = {};
    this.DEBUG = window.DEBUG || false;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[Web3Manager]', ...args);
    }
  }

  // Initialize Web3 connection
  async initialize() {
    try {
      this.debugLog('🔗 Initializing Web3Manager...');

      // Check if MetaMask is available
      if (typeof window.ethereum !== 'undefined') {
        this.provider = window.ethereum;
        this.web3 = new Web3(this.provider);
        this.isConnected = true;

        this.debugLog('✅ Web3 initialized with MetaMask');

        // Setup event listeners
        this.setupEventListeners();

        return true;
      } else {
        this.debugLog('⚠️ MetaMask not found, Web3 not available');
        return false;
      }
    } catch (error) {
      this.debugLog('❌ Web3Manager initialization failed:', error);
      return false;
    }
  }

  // Setup event listeners for wallet changes
  setupEventListeners() {
    if (!this.provider) return;

    // Account change event
    this.provider.on('accountsChanged', (accounts) => {
      this.debugLog('👤 Account changed:', accounts);
      this.currentAccount = accounts[0] || null;
      this.emit('accountChanged', this.currentAccount);
    });

    // Network change event
    this.provider.on('chainChanged', (chainId) => {
      this.debugLog('🌐 Network changed:', chainId);
      this.currentNetwork = this.getNetworkName(chainId);
      this.emit('networkChanged', this.currentNetwork);
    });

    // Connect event
    this.provider.on('connect', (connectInfo) => {
      this.debugLog('🔗 Wallet connected:', connectInfo);
      this.isConnected = true;
      this.emit('connected', connectInfo);
    });

    // Disconnect event
    this.provider.on('disconnect', (error) => {
      this.debugLog('🔌 Wallet disconnected:', error);
      this.isConnected = false;
      this.currentAccount = null;
      this.emit('disconnected', error);
    });
  }

  // Connect wallet
  async connectWallet() {
    try {
      this.debugLog('🔗 Connecting wallet...');

      if (!this.provider) {
        throw new Error('No Web3 provider available');
      }

      const accounts = await this.provider.request({
        method: 'eth_requestAccounts',
      });

      this.currentAccount = accounts[0];
      this.isConnected = true;

      this.debugLog('✅ Wallet connected:', this.currentAccount);
      this.emit('walletConnected', this.currentAccount);

      return this.currentAccount;
    } catch (error) {
      this.debugLog('❌ Wallet connection failed:', error);
      throw error;
    }
  }

  // Disconnect wallet
  async disconnectWallet() {
    try {
      this.debugLog('🔌 Disconnecting wallet...');

      this.currentAccount = null;
      this.isConnected = false;

      this.debugLog('✅ Wallet disconnected');
      this.emit('walletDisconnected');

      return true;
    } catch (error) {
      this.debugLog('❌ Wallet disconnection failed:', error);
      throw error;
    }
  }

  // Get current account
  getCurrentAccount() {
    return this.currentAccount;
  }

  // Get all accounts
  async getAccounts() {
    try {
      if (!this.web3) {
        throw new Error('Web3 not initialized');
      }

      const accounts = await this.web3.eth.getAccounts();
      this.debugLog('👥 Accounts retrieved:', accounts);

      return accounts;
    } catch (error) {
      this.debugLog('❌ Failed to get accounts:', error);
      throw error;
    }
  }

  // Get current network
  async getCurrentNetwork() {
    try {
      if (!this.web3) {
        throw new Error('Web3 not initialized');
      }

      const chainId = await this.web3.eth.getChainId();
      const networkName = this.getNetworkName(chainId);

      this.currentNetwork = networkName;
      this.debugLog('🌐 Current network:', networkName, '(Chain ID:', chainId, ')');

      return {
        chainId: chainId,
        name: networkName,
      };
    } catch (error) {
      this.debugLog('❌ Failed to get current network:', error);
      throw error;
    }
  }

  // Switch network
  async switchNetwork(chainId) {
    try {
      this.debugLog('🔄 Switching to network:', chainId);

      if (!this.provider) {
        throw new Error('No Web3 provider available');
      }

      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainId }],
      });

      this.debugLog('✅ Network switched successfully');
      return true;
    } catch (error) {
      this.debugLog('❌ Network switch failed:', error);
      throw error;
    }
  }

  // Add network to MetaMask
  async addNetwork(networkConfig) {
    try {
      this.debugLog('➕ Adding network:', networkConfig.name);

      if (!this.provider) {
        throw new Error('No Web3 provider available');
      }

      await this.provider.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });

      this.debugLog('✅ Network added successfully');
      return true;
    } catch (error) {
      this.debugLog('❌ Failed to add network:', error);
      throw error;
    }
  }

  // Get network name from chain ID
  getNetworkName(chainId) {
    const networks = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten Testnet',
      4: 'Rinkeby Testnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      42: 'Kovan Testnet',
      56: 'Binance Smart Chain',
      97: 'Binance Smart Chain Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai Testnet',
      1337: 'Localhost',
      31337: 'Hardhat Network',
    };

    return networks[chainId] || `Unknown Network (${chainId})`;
  }

  // Sepolia testnet configuration
  getSepoliaConfig() {
    return {
      chainId: '0xaa36a7', // 11155111 in hex
      chainName: 'Sepolia Testnet',
      nativeCurrency: {
        name: 'Sepolia ETH',
        symbol: 'SEP',
        decimals: 18,
      },
      rpcUrls: ['https://sepolia.infura.io/v3/', 'https://rpc.sepolia.org'],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
    };
  }

  // Switch to Sepolia testnet
  async switchToSepolia() {
    try {
      this.debugLog('🔄 Switching to Sepolia testnet...');

      const sepoliaChainId = '0xaa36a7'; // 11155111 in hex

      try {
        // Try to switch to Sepolia
        await this.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: sepoliaChainId }],
        });
        this.debugLog('✅ Switched to Sepolia');
        return true;
      } catch (switchError) {
        // If Sepolia is not added, add it
        if (switchError.code === 4902) {
          this.debugLog('➕ Sepolia not found, adding network...');
          await this.addNetwork(this.getSepoliaConfig());
          this.debugLog('✅ Sepolia added and switched');
          return true;
        }
        throw switchError;
      }
    } catch (error) {
      this.debugLog('❌ Failed to switch to Sepolia:', error);
      throw error;
    }
  }

  // Check if on Sepolia
  async isOnSepolia() {
    try {
      const chainId = await this.web3.eth.getChainId();
      return chainId === 11155111;
    } catch (error) {
      return false;
    }
  }

  // Get account balance
  async getBalance(account = null) {
    try {
      const targetAccount = account || this.currentAccount;
      if (!targetAccount) {
        throw new Error('No account specified');
      }

      const balance = await this.web3.eth.getBalance(targetAccount);
      const ethBalance = this.web3.utils.fromWei(balance, 'ether');

      this.debugLog('💰 Balance for', targetAccount, ':', ethBalance, 'ETH');

      return ethBalance;
    } catch (error) {
      this.debugLog('❌ Failed to get balance:', error);
      throw error;
    }
  }

  // Send transaction
  async sendTransaction(transaction) {
    try {
      this.debugLog('📤 Sending transaction:', transaction);

      if (!this.currentAccount) {
        throw new Error('No account connected');
      }

      const result = await this.web3.eth.sendTransaction({
        from: this.currentAccount,
        ...transaction,
      });

      this.debugLog('✅ Transaction sent successfully:', result.transactionHash);
      return result;
    } catch (error) {
      this.debugLog('❌ Transaction failed:', error);
      throw error;
    }
  }

  // Sign message
  async signMessage(message) {
    try {
      this.debugLog('✍️ Signing message:', message);

      if (!this.currentAccount) {
        throw new Error('No account connected');
      }

      const signature = await this.web3.eth.personal.sign(message, this.currentAccount);

      this.debugLog('✅ Message signed successfully:', signature);
      return signature;
    } catch (error) {
      this.debugLog('❌ Message signing failed:', error);
      throw error;
    }
  }

  // Get gas price
  async getGasPrice() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      const gasPriceGwei = this.web3.utils.fromWei(gasPrice, 'gwei');

      this.debugLog('⛽ Gas price:', gasPriceGwei, 'Gwei');

      return {
        wei: gasPrice,
        gwei: gasPriceGwei,
      };
    } catch (error) {
      this.debugLog('❌ Failed to get gas price:', error);
      throw error;
    }
  }

  // Estimate gas for transaction
  async estimateGas(transaction) {
    try {
      this.debugLog('⛽ Estimating gas for transaction:', transaction);

      const gasEstimate = await this.web3.eth.estimateGas(transaction);

      this.debugLog('✅ Gas estimate:', gasEstimate);
      return gasEstimate;
    } catch (error) {
      this.debugLog('❌ Failed to estimate gas:', error);
      throw error;
    }
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(callback);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          this.debugLog('❌ Event callback error:', error);
        }
      });
    }
  }

  // Get Web3 instance
  getWeb3() {
    return this.web3;
  }

  // Get provider
  getProvider() {
    return this.provider;
  }

  // Check if connected
  isWalletConnected() {
    return this.isConnected && this.currentAccount !== null;
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      currentAccount: this.currentAccount,
      currentNetwork: this.currentNetwork,
      hasProvider: !!this.provider,
      hasWeb3: !!this.web3,
    };
  }

  // Cleanup resources
  cleanup() {
    this.debugLog('🧹 Cleaning up Web3Manager resources...');
    this.web3 = null;
    this.provider = null;
    this.isConnected = false;
    this.currentAccount = null;
    this.currentNetwork = null;
    this.eventListeners = {};
  }
}

// Maak Web3Manager globaal beschikbaar
window.Web3Manager = Web3Manager;

// Export voor gebruik in andere modules
/* eslint-disable no-undef */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Web3Manager;
}
/* eslint-enable no-undef */
