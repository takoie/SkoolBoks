import { load } from "@tauri-apps/plugin-store";
import { encryptPayload, decryptPayload } from "../lib/encryption";

let storePromise = null;
function getStore() {
  if (!storePromise) storePromise = load("skoolbox-data.json", { autoSave: true });
  return storePromise;
}

export const tauriStorage = {
  getItem: async (name) => {
    try {
      let rawValue = null;
      try {
        const store = await getStore();
        rawValue = await store.get(name);
        if (rawValue === undefined || rawValue === null) {
          if (name === "skoolboks-store") {
            rawValue = await store.get("skoolbox-store");
          }
        }
      } catch (err) {
        console.warn("Tauri store read warning:", err);
      }

      if (rawValue) {
        if (typeof rawValue === "string" && rawValue.startsWith("enc_v1:")) {
          return decryptPayload(rawValue);
        }
        return typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
      }

      // Fallback to localStorage if Tauri store is empty
      try {
        const localVal = localStorage.getItem(name);
        if (localVal) {
          if (typeof localVal === "string" && localVal.startsWith("enc_v1:")) {
            return decryptPayload(localVal);
          }
          return typeof localVal === "string" ? localVal : JSON.stringify(localVal);
        }
      } catch (e) {}

      return null;
    } catch (err) {
      console.error("Storage getItem error:", err);
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      const encryptedValue = encryptPayload(stringValue);

      // Dual-save encrypted value to localStorage for instant synchronous persistence
      try {
        localStorage.setItem(name, encryptedValue);
      } catch (e) {}

      // Save to Tauri plugin store and explicitly flush to disk with store.save()
      const store = await getStore();
      await store.set(name, encryptedValue);
      await store.save();
    } catch (err) {
      console.error("Storage setItem error:", err);
    }
  },
  removeItem: async (name) => {
    try {
      try {
        localStorage.removeItem(name);
      } catch (e) {}

      const store = await getStore();
      await store.delete(name);
      await store.save();
    } catch (err) {
      console.error("Storage removeItem error:", err);
    }
  },
};
