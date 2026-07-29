import { load } from "@tauri-apps/plugin-store";

let storePromise = null;
function getStore() {
  if (!storePromise) storePromise = load("skoolbox-data.json", { autoSave: true });
  return storePromise;
}

export const tauriStorage = {
  getItem: async (name) => {
    const store = await getStore();
    const value = await store.get(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    const store = await getStore();
    await store.set(name, value);
  },
  removeItem: async (name) => {
    const store = await getStore();
    await store.delete(name);
  },
};
