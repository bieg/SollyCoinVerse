/**
 * ContractManager - Beheert alle smart contract interacties
 * @author SollyCoin Team
 * @version 1.0.0
 */

export class ContractManager {
    constructor(web3Manager) {
        this.web3Manager = web3Manager;
        this.contracts = {};
        this.contractAddresses = {};
        this.isInitialized = false;
        
        // Contract ABIs (vereenvoudigd voor demo)
        this.abis = {
            SollyCoin: [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function balanceOf(address) view returns (uint256)",
                "function updateGameProgress(uint256, uint256)",
                "function mintSolly(uint256, string)",
                "function claimLevelReward(uint256)",
                "function getGameState(address) view returns (uint256, uint256, uint256, bool)",
                "event GameProgressUpdated(address indexed, uint256, uint256)",
                "event SollyMinted(address indexed, uint256, uint256)",
                "event GameRewardClaimed(address indexed, uint256, string)"
            ],
            SollyNFT: [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function ownerOf(uint256) view returns (address)",
                "function tokenURI(uint256) view returns (string)",
                "function mintSollyNFT(address, string, uint256, string, uint256, uint256, bool) payable returns (uint256)",
                "function updateSollyMetadata(uint256, string, uint256, string, uint256, uint256)",
                "function getSollyMetadata(uint256) view returns (uint256, string, uint256, uint256, uint256, bool)",
                "function totalSupply() view returns (uint256)",
                "event SollyNFTMinted(address indexed, uint256 indexed, string)",
                "event SollyNFTUpdated(uint256 indexed, string)"
            ],
            GameFactory: [
                "function createGame(uint256, uint256) payable returns (uint256)",
                "function joinGame(uint256) payable",
                "function submitScore(uint256, uint256)",
                "function completeGame(uint256)",
                "function cancelGame(uint256)",
                "function getGame(uint256) view returns (uint256, address, uint256, uint256, uint256, uint256, uint256, uint256, uint8, address[])",
                "function getPlayerScore(uint256, address) view returns (uint256)",
                "function getPlayerGames(address) view returns (uint256[])",
                "event GameInstanceCreated(uint256 indexed, address indexed, uint256)",
                "event PlayerJoinedGame(uint256 indexed, address indexed)",
                "event GameCompleted(uint256 indexed, address indexed, uint256)",
                "event GameCancelled(uint256 indexed, address indexed)"
            ]
        };
    }

    /**
     * Initialiseer contract manager met contract addresses
     */
    async initialize(contractAddresses = {}) {
        try {
            console.log("🔧 Initializing ContractManager...");
            
            // Default addresses voor development
            this.contractAddresses = {
                SollyCoin: contractAddresses.SollyCoin || "0x0000000000000000000000000000000000000000",
                SollyNFT: contractAddresses.SollyNFT || "0x0000000000000000000000000000000000000000",
                GameFactory: contractAddresses.GameFactory || "0x0000000000000000000000000000000000000000"
            };

            // Maak contract instances
            await this.createContractInstances();
            
            this.isInitialized = true;
            console.log("✅ ContractManager initialized successfully");
            
            // Emit event
            this.web3Manager.emit('contractsInitialized', this.contractAddresses);
            
        } catch (error) {
            console.error("❌ ContractManager initialization failed:", error);
            throw error;
        }
    }

    /**
     * Maak contract instances aan
     */
    async createContractInstances() {
        const web3 = this.web3Manager.getWeb3();
        
        for (const [contractName, address] of Object.entries(this.contractAddresses)) {
            if (address !== "0x0000000000000000000000000000000000000000") {
                try {
                    this.contracts[contractName] = new web3.eth.Contract(
                        this.abis[contractName],
                        address
                    );
                    console.log(`📋 Created ${contractName} instance at ${address}`);
                } catch (error) {
                    console.error(`❌ Failed to create ${contractName} instance:`, error);
                }
            }
        }
    }

    /**
     * SollyCoin contract functies
     */
    async getSollyCoinBalance(address) {
        if (!this.contracts.SollyCoin) return "0";
        
        try {
            const balance = await this.contracts.SollyCoin.methods.balanceOf(address).call();
            return this.web3Manager.getWeb3().utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error("❌ Error getting SollyCoin balance:", error);
            return "0";
        }
    }

    async updateGameProgress(level, score) {
        if (!this.contracts.SollyCoin) throw new Error("SollyCoin contract not available");
        
        try {
            const accounts = await this.web3Manager.getAccounts();
            const result = await this.contracts.SollyCoin.methods
                .updateGameProgress(level, score)
                .send({ from: accounts[0] });
            
            console.log("✅ Game progress updated:", result);
            return result;
        } catch (error) {
            console.error("❌ Error updating game progress:", error);
            throw error;
        }
    }

    async mintSolly(level, metadata) {
        if (!this.contracts.SollyCoin) throw new Error("SollyCoin contract not available");
        
        try {
            const accounts = await this.web3Manager.getAccounts();
            const result = await this.contracts.SollyCoin.methods
                .mintSolly(level, metadata)
                .send({ from: accounts[0] });
            
            console.log("✅ Solly minted:", result);
            return result;
        } catch (error) {
            console.error("❌ Error minting Solly:", error);
            throw error;
        }
    }

    async claimLevelReward(level) {
        if (!this.contracts.SollyCoin) throw new Error("SollyCoin contract not available");
        
        try {
            const accounts = await this.web3Manager.getAccounts();
            const result = await this.contracts.SollyCoin.methods
                .claimLevelReward(level)
                .send({ from: accounts[0] });
            
            console.log("✅ Level reward claimed:", result);
            return result;
        } catch (error) {
            console.error("❌ Error claiming level reward:", error);
            throw error;
        }
    }

    async getGameState(address) {
        if (!this.contracts.SollyCoin) return null;
        
        try {
            const gameState = await this.contracts.SollyCoin.methods.getGameState(address).call();
            return {
                level: parseInt(gameState[0]),
                score: parseInt(gameState[1]),
                lastPlayed: parseInt(gameState[2]),
                isActive: gameState[3]
            };
        } catch (error) {
            console.error("❌ Error getting game state:", error);
            return null;
        }
    }

    /**
     * SollyNFT contract functies
     */
    async mintSollyNFT(tokenURI, level, shape, size, kaboom, isSpecial) {
        if (!this.contracts.SollyNFT) throw new Error("SollyNFT contract not available");
        
        try {
            const accounts = await this.web3Manager.getAccounts();
            const mintPrice = this.web3Manager.getWeb3().utils.toWei("0.01", "ether");
            
            const result = await this.contracts.SollyNFT.methods
                .mintSollyNFT(accounts[0], tokenURI, level, shape, size, kaboom, isSpecial)
                .send({ 
                    from: accounts[0],
                    value: mintPrice
                });
            
            console.log("✅ SollyNFT minted:", result);
            return result;
        } catch (error) {
            console.error("❌ Error minting SollyNFT:", error);
            throw error;
        }
    }

    async getSollyNFTMetadata(tokenId) {
        if (!this.contracts.SollyNFT) return null;
        
        try {
            const metadata = await this.contracts.SollyNFT.methods.getSollyMetadata(tokenId).call();
            return {
                level: parseInt(metadata[0]),
                shape: metadata[1],
                size: parseInt(metadata[2]),
                kaboom: parseInt(metadata[3]),
                createdAt: parseInt(metadata[4]),
                isSpecial: metadata[5]
            };
        } catch (error) {
            console.error("❌ Error getting NFT metadata:", error);
            return null;
        }
    }

    async updateSollyNFTMetadata(tokenId, tokenURI, level, shape, size, kaboom) {
        if (!this.contracts.SollyNFT) throw new Error("SollyNFT contract not available");
        
        try {
            const accounts = await this.web3Manager.getAccounts();
            const result = await this.contracts.SollyNFT.methods
                .updateSollyMetadata(tokenId, tokenURI, level, shape, size, kaboom)
                .send({ from: accounts[0] });
            
            console.log("✅ SollyNFT metadata updated:", result);
            return result;
        } catch (error) {
            console.error("❌ Error updating NFT metadata:", error);
            throw error;
        }
    }

    /**
     * GameFactory contract functies
     */
    async createGame(entryFee, maxPlayers) {
        if (!this.contracts.GameFactory) throw new Error("GameFactory contract not available");
        
        try {
            const accounts = await this.web3Manager.getAccounts();
            const entryFeeWei = this.web3Manager.getWeb3().utils.toWei(entryFee.toString(), "ether");
            
            const result = await this.contracts.GameFactory.methods
                .createGame(entryFeeWei, maxPlayers)
                .send({ 
                    from: accounts[0],
                    value: entryFeeWei
                });
            
            console.log("✅ Game created:", result);
            return result;
        } catch (error) {
            console.error("❌ Error creating game:", error);
            throw error;
        }
    }

    async joinGame(gameId, entryFee) {
        if (!this.contracts.GameFactory) throw new Error("GameFactory contract not available");
        
        try {
            const accounts = await this.web3Manager.getAccounts();
            const entryFeeWei = this.web3Manager.getWeb3().utils.toWei(entryFee.toString(), "ether");
            
            const result = await this.contracts.GameFactory.methods
                .joinGame(gameId)
                .send({ 
                    from: accounts[0],
                    value: entryFeeWei
                });
            
            console.log("✅ Joined game:", result);
            return result;
        } catch (error) {
            console.error("❌ Error joining game:", error);
            throw error;
        }
    }

    async submitScore(gameId, score) {
        if (!this.contracts.GameFactory) throw new Error("GameFactory contract not available");
        
        try {
            const accounts = await this.web3Manager.getAccounts();
            const result = await this.contracts.GameFactory.methods
                .submitScore(gameId, score)
                .send({ from: accounts[0] });
            
            console.log("✅ Score submitted:", result);
            return result;
        } catch (error) {
            console.error("❌ Error submitting score:", error);
            throw error;
        }
    }

    async getGame(gameId) {
        if (!this.contracts.GameFactory) return null;
        
        try {
            const game = await this.contracts.GameFactory.methods.getGame(gameId).call();
            return {
                gameId: parseInt(game[0]),
                creator: game[1],
                entryFee: this.web3Manager.getWeb3().utils.fromWei(game[2], "ether"),
                maxPlayers: parseInt(game[3]),
                currentPlayers: parseInt(game[4]),
                totalPrizePool: this.web3Manager.getWeb3().utils.fromWei(game[5], "ether"),
                startTime: parseInt(game[6]),
                endTime: parseInt(game[7]),
                status: parseInt(game[8]),
                players: game[9]
            };
        } catch (error) {
            console.error("❌ Error getting game:", error);
            return null;
        }
    }

    async getPlayerGames(address) {
        if (!this.contracts.GameFactory) return [];
        
        try {
            const games = await this.contracts.GameFactory.methods.getPlayerGames(address).call();
            return games.map(gameId => parseInt(gameId));
        } catch (error) {
            console.error("❌ Error getting player games:", error);
            return [];
        }
    }

    /**
     * Utility functies
     */
    getContractAddresses() {
        return this.contractAddresses;
    }

    isContractAvailable(contractName) {
        return this.contracts[contractName] !== undefined;
    }

    /**
     * Event listeners voor contract events
     */
    setupEventListeners() {
        if (!this.isInitialized) return;

        // SollyCoin events
        if (this.contracts.SollyCoin) {
            this.contracts.SollyCoin.events.GameProgressUpdated({})
                .on('data', (event) => {
                    console.log("🎮 Game progress updated:", event.returnValues);
                    this.web3Manager.emit('gameProgressUpdated', event.returnValues);
                });

            this.contracts.SollyCoin.events.SollyMinted({})
                .on('data', (event) => {
                    console.log("🪙 Solly minted:", event.returnValues);
                    this.web3Manager.emit('sollyMinted', event.returnValues);
                });
        }

        // SollyNFT events
        if (this.contracts.SollyNFT) {
            this.contracts.SollyNFT.events.SollyNFTMinted({})
                .on('data', (event) => {
                    console.log("🎨 SollyNFT minted:", event.returnValues);
                    this.web3Manager.emit('sollyNFTMinted', event.returnValues);
                });
        }

        // GameFactory events
        if (this.contracts.GameFactory) {
            this.contracts.GameFactory.events.GameInstanceCreated({})
                .on('data', (event) => {
                    console.log("🎮 Game created:", event.returnValues);
                    this.web3Manager.emit('gameCreated', event.returnValues);
                });

            this.contracts.GameFactory.events.GameCompleted({})
                .on('data', (event) => {
                    console.log("🏆 Game completed:", event.returnValues);
                    this.web3Manager.emit('gameCompleted', event.returnValues);
                });
        }
    }

    // Initialize method for module compatibility
    async initialize() {
        console.log("📋 ContractManager initialized");
        return Promise.resolve();
    }
}

// Export voor gebruik in andere modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContractManager;
} 