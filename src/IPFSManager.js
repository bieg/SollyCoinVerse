// ===================================================================================
// ==                           IPFS MANAGER MODULE                               ==
// ==                                                                             ==
// ==      Bevat alle IPFS functionaliteit:                                      ==
// ==      - Decentralized storage voor assets                                   ==
// ==      - Metadata upload en retrieval                                        ==
// ==      - Content addressing en pinning                                       ==
// ===================================================================================

class IPFSManager {
  constructor() {
    this.ipfs = null;
    this.isConnected = false;
    this.gatewayUrl = 'https://ipfs.io/ipfs/';
    this.DEBUG = window.DEBUG || false;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[IPFSManager]', ...args);
    }
  }

  // Initialize IPFS connection
  async initialize() {
    try {
      this.debugLog('🔗 Initializing IPFS connection...');
      
      // Check if IPFS is available
      if (typeof window.ipfs !== 'undefined') {
        this.ipfs = window.ipfs;
        this.isConnected = true;
        this.debugLog('✅ IPFS connection established');
        return true;
      }
      
      // Fallback: use HTTP gateway
      this.debugLog('⚠️ IPFS not available, using HTTP gateway');
      this.isConnected = false;
      return false;
    } catch (error) {
      this.debugLog('❌ IPFS initialization failed:', error);
      return false;
    }
  }

  // Upload data to IPFS
  async uploadData(data, options = {}) {
    try {
      this.debugLog('📤 Uploading data to IPFS...');
      
      if (!this.isConnected) {
        throw new Error('IPFS not connected');
      }
      
      const result = await this.ipfs.add(JSON.stringify(data), options);
      this.debugLog('✅ Data uploaded, CID:', result.cid);
      
      return {
        cid: result.cid.toString(),
        size: result.size,
        url: `${this.gatewayUrl}${result.cid}`
      };
    } catch (error) {
      this.debugLog('❌ IPFS upload failed:', error);
      throw error;
    }
  }

  // Download data from IPFS
  async downloadData(cid) {
    try {
      this.debugLog('📥 Downloading data from IPFS:', cid);
      
      if (!this.isConnected) {
        // Use HTTP gateway as fallback
        const response = await fetch(`${this.gatewayUrl}${cid}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        this.debugLog('✅ Data downloaded via gateway');
        return data;
      }
      
      const chunks = [];
      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
      }
      
      const data = JSON.parse(Buffer.concat(chunks).toString());
      this.debugLog('✅ Data downloaded from IPFS');
      
      return data;
    } catch (error) {
      this.debugLog('❌ IPFS download failed:', error);
      throw error;
    }
  }

  // Upload file to IPFS
  async uploadFile(file, options = {}) {
    try {
      this.debugLog('📁 Uploading file to IPFS:', file.name);
      
      if (!this.isConnected) {
        throw new Error('IPFS not connected');
      }
      
      const result = await this.ipfs.add(file, options);
      this.debugLog('✅ File uploaded, CID:', result.cid);
      
      return {
        cid: result.cid.toString(),
        size: result.size,
        name: file.name,
        url: `${this.gatewayUrl}${result.cid}`
      };
    } catch (error) {
      this.debugLog('❌ IPFS file upload failed:', error);
      throw error;
    }
  }

  // Pin content to IPFS
  async pinContent(cid) {
    try {
      this.debugLog('📌 Pinning content:', cid);
      
      if (!this.isConnected) {
        throw new Error('IPFS not connected');
      }
      
      await this.ipfs.pin.add(cid);
      this.debugLog('✅ Content pinned successfully');
      
      return true;
    } catch (error) {
      this.debugLog('❌ IPFS pin failed:', error);
      throw error;
    }
  }

  // Unpin content from IPFS
  async unpinContent(cid) {
    try {
      this.debugLog('📌 Unpinning content:', cid);
      
      if (!this.isConnected) {
        throw new Error('IPFS not connected');
      }
      
      await this.ipfs.pin.rm(cid);
      this.debugLog('✅ Content unpinned successfully');
      
      return true;
    } catch (error) {
      this.debugLog('❌ IPFS unpin failed:', error);
      throw error;
    }
  }

  // Get pinned content list
  async getPinnedContent() {
    try {
      this.debugLog('📋 Getting pinned content...');
      
      if (!this.isConnected) {
        throw new Error('IPFS not connected');
      }
      
      const pins = [];
      for await (const pin of this.ipfs.pin.ls()) {
        pins.push({
          cid: pin.cid.toString(),
          type: pin.type
        });
      }
      
      this.debugLog('✅ Pinned content retrieved:', pins.length, 'items');
      return pins;
    } catch (error) {
      this.debugLog('❌ Failed to get pinned content:', error);
      throw error;
    }
  }

  // Upload SollyCoin metadata
  async uploadSollyCoinMetadata(metadata) {
    try {
      this.debugLog('🪙 Uploading SollyCoin metadata...');
      
      const result = await this.uploadData(metadata, {
        pin: true,
        metadata: {
          name: 'SollyCoin Metadata',
          description: 'SollyCoin game progress and configuration'
        }
      });
      
      this.debugLog('✅ SollyCoin metadata uploaded:', result.cid);
      return result;
    } catch (error) {
      this.debugLog('❌ SollyCoin metadata upload failed:', error);
      throw error;
    }
  }

  // Download SollyCoin metadata
  async downloadSollyCoinMetadata(cid) {
    try {
      this.debugLog('🪙 Downloading SollyCoin metadata:', cid);
      
      const metadata = await this.downloadData(cid);
      this.debugLog('✅ SollyCoin metadata downloaded');
      
      return metadata;
    } catch (error) {
      this.debugLog('❌ SollyCoin metadata download failed:', error);
      throw error;
    }
  }

  // Upload game assets (3D models, textures, etc.)
  async uploadGameAsset(file, assetType) {
    try {
      this.debugLog(`🎮 Uploading game asset (${assetType}):`, file.name);
      
      const result = await this.uploadFile(file, {
        pin: true,
        metadata: {
          name: file.name,
          type: assetType,
          description: `SollyCoin game asset: ${assetType}`
        }
      });
      
      this.debugLog('✅ Game asset uploaded:', result.cid);
      return result;
    } catch (error) {
      this.debugLog('❌ Game asset upload failed:', error);
      throw error;
    }
  }

  // Get IPFS status
  getStatus() {
    return {
      isConnected: this.isConnected,
      gatewayUrl: this.gatewayUrl,
      hasIPFS: typeof window.ipfs !== 'undefined'
    };
  }

  // Cleanup resources
  cleanup() {
    this.debugLog('🧹 Cleaning up IPFS resources...');
    this.ipfs = null;
    this.isConnected = false;
  }
}

// Maak IPFSManager globaal beschikbaar
window.IPFSManager = IPFSManager;

// Export voor gebruik in andere modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IPFSManager;
} 