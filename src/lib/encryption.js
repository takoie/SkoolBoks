// Simple, robust local payload encryption helper for SkoolBox data persistence.
// Ensures student names and sensitive store data written to disk are scrambled/encrypted
// rather than being stored in plaintext JSON.

const DEFAULT_SECRET = "skoolbox_local_secure_key_v1";

export function encryptPayload(data, keyPrefix = "") {
  try {
    const jsonString = typeof data === "string" ? data : JSON.stringify(data);
    const key = DEFAULT_SECRET + (keyPrefix || "");
    let result = "";
    for (let i = 0; i < jsonString.length; i++) {
      const charCode = jsonString.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    // Prefix marker to identify encrypted payloads
    return "enc_v1:" + btoa(unescape(encodeURIComponent(result)));
  } catch (err) {
    console.error("Encryption error:", err);
    return data;
  }
}

export function decryptPayload(payload, keyPrefix = "") {
  if (typeof payload !== "string" || !payload.startsWith("enc_v1:")) {
    return payload; // Return raw payload if not encrypted
  }
  try {
    const encoded = payload.replace("enc_v1:", "");
    const encryptedStr = decodeURIComponent(escape(atob(encoded)));
    const key = DEFAULT_SECRET + (keyPrefix || "");
    let jsonString = "";
    for (let i = 0; i < encryptedStr.length; i++) {
      const charCode = encryptedStr.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      jsonString += String.fromCharCode(charCode);
    }
    return jsonString;
  } catch (err) {
    console.error("Decryption error:", err);
    return null;
  }
}
