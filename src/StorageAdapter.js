// src/StorageAdapter.js
// Algemene storage interface + IndexedDB en Memory implementatie

class StorageAdapter {
  // eslint-disable-next-line class-methods-use-this
  async getItem(_key) { throw new Error('getItem not implemented'); }
  // eslint-disable-next-line class-methods-use-this
  async setItem(_key, _value) { throw new Error('setItem not implemented'); }
  // eslint-disable-next-line class-methods-use-this
  async removeItem(_key) { throw new Error('removeItem not implemented'); }
  // eslint-disable-next-line class-methods-use-this
  async clear() { throw new Error('clear not implemented'); }
}

class IndexedDBAdapter extends StorageAdapter {
  constructor(dbName = 'sollyverse', storeName = 'kv') {
    super();
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = this.open();
  }

  open() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB open error'));
    });
  }

  async _withStore(mode) {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, mode);
    const store = tx.objectStore(this.storeName);
    return { tx, store };
  }

  async getItem(key) {
    const { store } = await this._withStore('readonly');
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => {
        try {
          resolve(req.result ? JSON.parse(req.result) : null);
        } catch (err) {
          reject(err);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async setItem(key, value) {
    const { store } = await this._withStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(JSON.stringify(value), key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async removeItem(key) {
    const { store } = await this._withStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async clear() {
    const { store } = await this._withStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }
}

class MemoryAdapter extends StorageAdapter {
  constructor() {
    super();
    this.store = new Map();
  }

  async getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }

  async setItem(key, value) { this.store.set(key, value); return true; }

  async removeItem(key) { this.store.delete(key); return true; }

  async clear() { this.store.clear(); return true; }
}

// Globale beschikbaarheid
if (typeof window !== 'undefined') {
  window.StorageAdapter = StorageAdapter;
  window.IndexedDBAdapter = IndexedDBAdapter;
  window.MemoryAdapter = MemoryAdapter;
  // Maak standaardinstance
  try {
    window.storageAdapter = new IndexedDBAdapter();
    console.log('💾 IndexedDBAdapter ingesteld als storageAdapter');
  } catch (err) {
    console.warn('⚠️ IndexedDB mislukt, fallback naar MemoryAdapter:', err.message);
    window.storageAdapter = new MemoryAdapter();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageAdapter, IndexedDBAdapter, MemoryAdapter };
}

