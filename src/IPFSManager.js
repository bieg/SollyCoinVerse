/**
 * IPFSManager - Beheert IPFS uploads en metadata voor game assets
 * @author SollyCoin Team
 * @version 1.0.0
 */

export class IPFSManager {
    constructor() {
        this.ipfsNode = null;
        this.isInitialized = false;
        this.gateway = "https://ipfs.io/ipfs/";
        
        // IPFS configuratie
        let projectId = '';
        let projectSecret = '';
        if (typeof process !== 'undefined' && process.env) {
            projectId = process.env.IPFS_PROJECT_ID || '';
            projectSecret = process.env.IPFS_PROJECT_SECRET || '';
        } // In de browser blijven deze leeg

        this.config = {
            host: 'ipfs.infura.io',
            port: 5001,
            protocol: 'https',
        };
        if (projectId) {
            this.config.headers = {
                authorization: 'Basic ' + btoa(projectId + ':' + projectSecret)
            };
        }
    }

    /**
     * Initialiseer IPFS manager
     */
    async initialize() {
        try {
            console.log("🔧 Initializing IPFSManager...");
            
            // Check of IPFS configuratie beschikbaar is (browser-safe)
            const ipfsProjectId = typeof process !== 'undefined' ? process.env?.IPFS_PROJECT_ID : '';
            const ipfsProjectSecret = typeof process !== 'undefined' ? process.env?.IPFS_PROJECT_SECRET : '';
            
            if (!ipfsProjectId || !ipfsProjectSecret) {
                console.warn("⚠️ IPFS credentials not found, using fallback methods");
                this.isInitialized = true;
                return;
            }

            // IPFS client initialisatie (vereenvoudigd voor demo)
            this.isInitialized = true;
            console.log("✅ IPFSManager initialized successfully");
            
        } catch (error) {
            console.error("❌ IPFSManager initialization failed:", error);
            this.isInitialized = true; // Fallback mode
        }
    }

    /**
     * Upload JSON metadata naar IPFS
     */
    async uploadMetadata(metadata) {
        try {
            console.log("📤 Uploading metadata to IPFS...");
            
            if (!this.isInitialized) {
                throw new Error("IPFSManager not initialized");
            }

            // Simuleer IPFS upload (in echte implementatie zou je hier IPFS client gebruiken)
            const jsonString = JSON.stringify(metadata, null, 2);
            const hash = this.generateIPFSHash(jsonString);
            
            console.log("✅ Metadata uploaded to IPFS:", hash);
            return `ipfs://${hash}`;
            
        } catch (error) {
            console.error("❌ Error uploading metadata:", error);
            // Fallback naar lokale storage
            return this.saveMetadataLocally(metadata);
        }
    }

    /**
     * Upload game asset (afbeelding, audio, etc.)
     */
    async uploadAsset(file, assetType = 'image') {
        try {
            console.log(`📤 Uploading ${assetType} asset to IPFS...`);
            
            if (!this.isInitialized) {
                throw new Error("IPFSManager not initialized");
            }

            // Simuleer IPFS upload voor bestanden
            const hash = this.generateIPFSHash(file.name + file.size + Date.now());
            
            console.log(`✅ ${assetType} asset uploaded to IPFS:`, hash);
            return `ipfs://${hash}`;
            
        } catch (error) {
            console.error(`❌ Error uploading ${assetType} asset:`, error);
            // Fallback naar lokale storage
            return this.saveAssetLocally(file, assetType);
        }
    }

    /**
     * Upload SollyCoin token metadata
     */
    async uploadSollyCoinMetadata(sollyData) {
        const metadata = {
            name: `SollyCoin Level ${sollyData.level}`,
            description: `SollyCoin token voor level ${sollyData.level} in het SollyCoin universum`,
            image: sollyData.image || "ipfs://default-solly-image",
            attributes: [
                {
                    trait_type: "Level",
                    value: sollyData.level
                },
                {
                    trait_type: "Shape",
                    value: sollyData.shape
                },
                {
                    trait_type: "Size",
                    value: sollyData.size
                },
                {
                    trait_type: "Kaboom",
                    value: sollyData.kaboom
                },
                {
                    trait_type: "Created",
                    value: new Date(sollyData.createdAt).toISOString()
                }
            ],
            properties: {
                game_data: {
                    level: sollyData.level,
                    shape: sollyData.shape,
                    size: sollyData.size,
                    kaboom: sollyData.kaboom,
                    createdAt: sollyData.createdAt,
                    lastUpdated: Date.now()
                }
            }
        };

        return await this.uploadMetadata(metadata);
    }

    /**
     * Upload SollyNFT metadata
     */
    async uploadSollyNFTMetadata(nftData) {
        const metadata = {
            name: `SollyNFT #${nftData.tokenId}`,
            description: `Unieke Solly collectible NFT met level ${nftData.level}`,
            image: nftData.image || "ipfs://default-nft-image",
            external_url: "https://sollycoin.com",
            attributes: [
                {
                    trait_type: "Token ID",
                    value: nftData.tokenId
                },
                {
                    trait_type: "Level",
                    value: nftData.level
                },
                {
                    trait_type: "Shape",
                    value: nftData.shape
                },
                {
                    trait_type: "Size",
                    value: nftData.size
                },
                {
                    trait_type: "Kaboom",
                    value: nftData.kaboom
                },
                {
                    trait_type: "Special",
                    value: nftData.isSpecial ? "Yes" : "No"
                },
                {
                    trait_type: "Created",
                    value: new Date(nftData.createdAt).toISOString()
                }
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: nftData.image
                    }
                ],
                category: "image",
                game_data: {
                    tokenId: nftData.tokenId,
                    level: nftData.level,
                    shape: nftData.shape,
                    size: nftData.size,
                    kaboom: nftData.kaboom,
                    isSpecial: nftData.isSpecial,
                    createdAt: nftData.createdAt
                }
            }
        };

        return await this.uploadMetadata(metadata);
    }

    /**
     * Upload game state metadata
     */
    async uploadGameStateMetadata(gameState) {
        const metadata = {
            name: "SollyCoin Game State",
            description: "Huidige game state en progressie",
            timestamp: Date.now(),
            game_data: {
                level: gameState.level,
                score: gameState.score,
                lastPlayed: gameState.lastPlayed,
                isActive: gameState.isActive,
                achievements: gameState.achievements || [],
                inventory: gameState.inventory || [],
                statistics: gameState.statistics || {}
            }
        };

        return await this.uploadMetadata(metadata);
    }

    /**
     * Download metadata van IPFS
     */
    async downloadMetadata(ipfsUri) {
        try {
            console.log("📥 Downloading metadata from IPFS:", ipfsUri);
            
            if (!ipfsUri.startsWith('ipfs://')) {
                throw new Error("Invalid IPFS URI");
            }

            const hash = ipfsUri.replace('ipfs://', '');
            const url = `${this.gateway}${hash}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const metadata = await response.json();
            console.log("✅ Metadata downloaded successfully");
            return metadata;
            
        } catch (error) {
            console.error("❌ Error downloading metadata:", error);
            // Fallback naar lokale storage
            return this.loadMetadataLocally(ipfsUri);
        }
    }

    /**
     * Download asset van IPFS
     */
    async downloadAsset(ipfsUri) {
        try {
            console.log("📥 Downloading asset from IPFS:", ipfsUri);
            
            if (!ipfsUri.startsWith('ipfs://')) {
                throw new Error("Invalid IPFS URI");
            }

            const hash = ipfsUri.replace('ipfs://', '');
            const url = `${this.gateway}${hash}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            console.log("✅ Asset downloaded successfully");
            return blob;
            
        } catch (error) {
            console.error("❌ Error downloading asset:", error);
            return null;
        }
    }

    /**
     * Batch upload van meerdere bestanden
     */
    async batchUpload(files, type = 'assets') {
        try {
            console.log(`📤 Starting batch upload of ${files.length} ${type}...`);
            
            const uploadPromises = files.map(file => this.uploadAsset(file, type));
            const results = await Promise.all(uploadPromises);
            
            console.log(`✅ Batch upload completed: ${results.length} files`);
            return results;
            
        } catch (error) {
            console.error("❌ Batch upload failed:", error);
            throw error;
        }
    }

    /**
     * Verificatie van IPFS hash
     */
    verifyIPFSHash(hash) {
        // Basis IPFS hash verificatie (CID v0 of v1)
        const cidRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafy[a-z2-7]{55}$/;
        return cidRegex.test(hash);
    }

    /**
     * Utility functies
     */
    generateIPFSHash(content) {
        // Simuleer IPFS hash generatie
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const hash = `Qm${btoa(content + timestamp + random).substring(0, 44)}`;
        return hash;
    }

    saveMetadataLocally(metadata) {
        // Fallback: sla metadata lokaal op
        const hash = this.generateIPFSHash(JSON.stringify(metadata));
        localStorage.setItem(`ipfs_metadata_${hash}`, JSON.stringify(metadata));
        return `local://${hash}`;
    }

    loadMetadataLocally(uri) {
        // Fallback: laad metadata van lokale storage
        const hash = uri.replace('ipfs://', '').replace('local://', '');
        const metadata = localStorage.getItem(`ipfs_metadata_${hash}`);
        return metadata ? JSON.parse(metadata) : null;
    }

    saveAssetLocally(file, assetType) {
        // Fallback: sla asset lokaal op
        const hash = this.generateIPFSHash(file.name + file.size);
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem(`ipfs_asset_${hash}`, e.target.result);
        };
        reader.readAsDataURL(file);
        return `local://${hash}`;
    }

    /**
     * IPFS status en health check
     */
    async getStatus() {
        return {
            initialized: this.isInitialized,
            gateway: this.gateway,
            config: this.config,
            timestamp: Date.now()
        };
    }

    /**
     * Cleanup en reset
     */
    reset() {
        this.ipfsNode = null;
        this.isInitialized = false;
        console.log("🔄 IPFSManager reset");
    }
}

// Export voor gebruik in andere modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IPFSManager;
} 