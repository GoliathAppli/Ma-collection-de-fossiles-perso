class SafeStorage {
  private isSupported: boolean;
  private memoryStorage: Record<string, string> = {};

  constructor(private type: "localStorage" | "sessionStorage") {
    try {
      const storage = window[type];
      const testKey = "__storage_test__";
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      this.isSupported = true;
    } catch (e) {
      this.isSupported = false;
    }
  }

  getItem(key: string): string | null {
    if (this.isSupported) {
      try {
        return window[this.type].getItem(key);
      } catch (e) {
        return this.memoryStorage[key] || null;
      }
    }
    return this.memoryStorage[key] || null;
  }

  setItem(key: string, value: string): void {
    if (this.isSupported) {
      try {
        window[this.type].setItem(key, value);
        return;
      } catch (e) {
        console.warn(`Failed to set item in ${this.type}:`, e);
      }
    }
    this.memoryStorage[key] = value;
  }

  removeItem(key: string): void {
    if (this.isSupported) {
      try {
        window[this.type].removeItem(key);
        return;
      } catch (e) {
        console.warn(`Failed to remove item from ${this.type}:`, e);
      }
    }
    delete this.memoryStorage[key];
  }
}

export const safeLocalStorage = new SafeStorage("localStorage");
export const safeSessionStorage = new SafeStorage("sessionStorage");
