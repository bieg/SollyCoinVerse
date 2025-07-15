// ===================================================================================
// ==                        CONTRACT MANAGER MODULE                             ==
// ==                                                                             ==
// ==      Bevat alle smart contract interacties:                                ==
// ==      - SollyCoin token contract                                            ==
// ==      - SollyNFT contract                                                   ==
// ==      - GameFactory contract                                                ==
// ==      - Transaction management                                               ==
// ===================================================================================

class ContractManager {
  constructor() {
    this.web3 = null;
    this.contracts = {};
    this.isConnected = false;
    this.currentAccount = null;
    this.DEBUG = window.DEBUG || false;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[ContractManager]', ...args);
    }
  }

  // Initialize contract manager
  async initialize(web3Instance) {
    try {
      this.debugLog('🔗 Initializing ContractManager...');
      
      this.web3 = web3Instance;
      this.isConnected = true;
      
      // Load contract ABIs and addresses
      await this.loadContracts();
      
      this.debugLog('✅ ContractManager initialized successfully');
      return true;
    } catch (error) {
      this.debugLog('❌ ContractManager initialization failed:', error);
      return false;
    }
  }

  // Load contract instances
  async loadContracts() {
    try {
      this.debugLog('📋 Loading contract instances...');
      
      // SollyCoin contract
      if (window.SOLLY_COIN_ABI && window.SOLLY_COIN_ADDRESS) {
        this.contracts.sollyCoin = new this.web3.eth.Contract(
          window.SOLLY_COIN_ABI,
          window.SOLLY_COIN_ADDRESS
        );
        this.debugLog('✅ SollyCoin contract loaded');
      }
      
      // SollyNFT contract
      if (window.SOLLY_NFT_ABI && window.SOLLY_NFT_ADDRESS) {
        this.contracts.sollyNFT = new this.web3.eth.Contract(
          window.SOLLY_NFT_ABI,
          window.SOLLY_NFT_ADDRESS
        );
        this.debugLog('✅ SollyNFT contract loaded');
      }
      
      // GameFactory contract
      if (window.GAME_FACTORY_ABI && window.GAME_FACTORY_ADDRESS) {
        this.contracts.gameFactory = new this.web3.eth.Contract(
          window.GAME_FACTORY_ABI,
          window.GAME_FACTORY_ADDRESS
        );
        this.debugLog('✅ GameFactory contract loaded');
      }
      
    } catch (error) {
      this.debugLog('❌ Failed to load contracts:', error);
      throw error;
    }
  }

  // Set current account
  setAccount(account) {
    this.currentAccount = account;
    this.debugLog('👤 Account set:', account);
  }

  // Get SollyCoin balance
  async getSollyCoinBalance(account = null) {
    try {
      const targetAccount = account || this.currentAccount;
      if (!targetAccount) {
        throw new Error('No account specified');
      }
      
      const balance = await this.contracts.sollyCoin.methods.balanceOf(targetAccount).call();
      this.debugLog('💰 SollyCoin balance:', balance);
      
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      this.debugLog('❌ Failed to get SollyCoin balance:', error);
      throw error;
    }
  }

  // Mint SollyCoin
  async mintSollyCoin(amount, to = null) {
    try {
      const targetAccount = to || this.currentAccount;
      if (!targetAccount) {
        throw new Error('No account specified');
      }
      
      const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
      
      this.debugLog('🪙 Minting SollyCoin:', amount, 'to:', targetAccount);
      
      const result = await this.contracts.sollyCoin.methods.mint(targetAccount, weiAmount).send({
        from: this.currentAccount,
        gas: 200000
      });
      
      this.debugLog('✅ SollyCoin minted successfully:', result.transactionHash);
      return result;
    } catch (error) {
      this.debugLog('❌ Failed to mint SollyCoin:', error);
      throw error;
    }
  }

  // Transfer SollyCoin
  async transferSollyCoin(to, amount) {
    try {
      if (!this.currentAccount) {
        throw new Error('No account specified');
      }
      
      const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
      
      this.debugLog('🔄 Transferring SollyCoin:', amount, 'to:', to);
      
      const result = await this.contracts.sollyCoin.methods.transfer(to, weiAmount).send({
        from: this.currentAccount,
        gas: 100000
      });
      
      this.debugLog('✅ SollyCoin transferred successfully:', result.transactionHash);
      return result;
    } catch (error) {
      this.debugLog('❌ Failed to transfer SollyCoin:', error);
      throw error;
    }
  }

  // Mint SollyNFT
  async mintSollyNFT(metadata) {
    try {
      if (!this.currentAccount) {
        throw new Error('No account specified');
      }
      
      this.debugLog('🎨 Minting SollyNFT with metadata:', metadata);
      
      const result = await this.contracts.sollyNFT.methods.mint(
        this.currentAccount,
        metadata.tokenURI
      ).send({
        from: this.currentAccount,
        gas: 300000
      });
      
      this.debugLog('✅ SollyNFT minted successfully:', result.transactionHash);
      return result;
    } catch (error) {
      this.debugLog('❌ Failed to mint SollyNFT:', error);
      throw error;
    }
  }

  // Get SollyNFT token data
  async getSollyNFTData(tokenId) {
    try {
      this.debugLog('📋 Getting SollyNFT data for token:', tokenId);
      
      const tokenURI = await this.contracts.sollyNFT.methods.tokenURI(tokenId).call();
      const owner = await this.contracts.sollyNFT.methods.ownerOf(tokenId).call();
      
      const data = {
        tokenId: tokenId,
        tokenURI: tokenURI,
        owner: owner
      };
      
      this.debugLog('✅ SollyNFT data retrieved:', data);
      return data;
    } catch (error) {
      this.debugLog('❌ Failed to get SollyNFT data:', error);
      throw error;
    }
  }

  // Create new game instance
  async createGame(gameConfig) {
    try {
      if (!this.currentAccount) {
        throw new Error('No account specified');
      }
      
      this.debugLog('🎮 Creating new game with config:', gameConfig);
      
      const result = await this.contracts.gameFactory.methods.createGame(
        gameConfig.level,
        gameConfig.shape,
        gameConfig.size
      ).send({
        from: this.currentAccount,
        gas: 500000
      });
      
      this.debugLog('✅ Game created successfully:', result.transactionHash);
      return result;
    } catch (error) {
      this.debugLog('❌ Failed to create game:', error);
      throw error;
    }
  }

  // Get game data
  async getGameData(gameId) {
    try {
      this.debugLog('📋 Getting game data for game:', gameId);
      
      const gameData = await this.contracts.gameFactory.methods.getGame(gameId).call();
      
      this.debugLog('✅ Game data retrieved:', gameData);
      return gameData;
    } catch (error) {
      this.debugLog('❌ Failed to get game data:', error);
      throw error;
    }
  }

  // Update game progress
  async updateGameProgress(gameId, progress) {
    try {
      if (!this.currentAccount) {
        throw new Error('No account specified');
      }
      
      this.debugLog('🔄 Updating game progress for game:', gameId, 'progress:', progress);
      
      const result = await this.contracts.gameFactory.methods.updateProgress(
        gameId,
        progress.kaboom,
        progress.score,
        progress.level
      ).send({
        from: this.currentAccount,
        gas: 200000
      });
      
      this.debugLog('✅ Game progress updated successfully:', result.transactionHash);
      return result;
    } catch (error) {
      this.debugLog('❌ Failed to update game progress:', error);
      throw error;
    }
  }

  // Get transaction status
  async getTransactionStatus(txHash) {
    try {
      this.debugLog('📊 Getting transaction status for:', txHash);
      
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      
      if (receipt) {
        const status = receipt.status ? 'success' : 'failed';
        this.debugLog('✅ Transaction status:', status);
        return {
          hash: txHash,
          status: status,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed
        };
      } else {
        this.debugLog('⏳ Transaction pending...');
        return {
          hash: txHash,
          status: 'pending'
        };
      }
    } catch (error) {
      this.debugLog('❌ Failed to get transaction status:', error);
      throw error;
    }
  }

  // Estimate gas for transaction
  async estimateGas(method, params = []) {
    try {
      this.debugLog('⛽ Estimating gas for method:', method);
      
      const gasEstimate = await method.estimateGas({
        from: this.currentAccount,
        ...params
      });
      
      this.debugLog('✅ Gas estimate:', gasEstimate);
      return gasEstimate;
    } catch (error) {
      this.debugLog('❌ Failed to estimate gas:', error);
      throw error;
    }
  }

  // Get contract status
  getStatus() {
    return {
      isConnected: this.isConnected,
      currentAccount: this.currentAccount,
      contracts: Object.keys(this.contracts),
      web3: !!this.web3
    };
  }

  // Cleanup resources
  cleanup() {
    this.debugLog('🧹 Cleaning up ContractManager resources...');
    this.web3 = null;
    this.contracts = {};
    this.isConnected = false;
    this.currentAccount = null;
  }
}

// Maak ContractManager globaal beschikbaar
window.ContractManager = ContractManager;

// Export voor gebruik in andere modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContractManager;
} 