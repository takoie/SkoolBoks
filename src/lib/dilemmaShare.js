/**
 * Helper functions for exporting and importing Dilemma Sessions
 */

const SHARE_PREFIX = "SKOOLBOKS_DILEMMA:";
const LEGACY_PREFIX = "SKOOLBOX_DILEMMA:";

/**
 * Export session to token, json, or text list format
 */
export function exportDilemmaSessionToString(session, format = "token") {
  if (!session) return "";

  const cleanData = {
    title: session.title || "Dilemma-økt",
    description: session.description || "",
    dilemmas: (session.dilemmas || []).map((d) => ({
      title: d.title || "",
      leftOption: {
        text: d.leftOption?.text || "",
        icon: d.leftOption?.icon || "",
        imagePath: d.leftOption?.imagePath || "",
      },
      rightOption: {
        text: d.rightOption?.text || "",
        icon: d.rightOption?.icon || "",
        imagePath: d.rightOption?.imagePath || "",
      },
    })),
  };

  if (format === "json") {
    return JSON.stringify(cleanData, null, 2);
  }

  if (format === "text") {
    let text = `=== ${cleanData.title} ===\n`;
    if (cleanData.description) {
      text += `${cleanData.description}\n\n`;
    }
    cleanData.dilemmas.forEach((d, idx) => {
      text += `${idx + 1}. ${d.title}\n`;
      text += `   [A - Venstre]: ${d.leftOption.icon ? d.leftOption.icon + " " : ""}${d.leftOption.text}\n`;
      text += `   [B - Høyre]:   ${d.rightOption.icon ? d.rightOption.icon + " " : ""}${d.rightOption.text}\n\n`;
    });
    return text.trim();
  }

  // Default: 'token' format
  try {
    const jsonStr = JSON.stringify(cleanData);
    const encoded = btoa(encodeURIComponent(jsonStr));
    return `${SHARE_PREFIX}${encoded}`;
  } catch (e) {
    console.error("Failed to encode dilemma session:", e);
    return JSON.stringify(cleanData);
  }
}

/**
 * Parse an imported string (token, JSON, or raw text) into a valid DilemmaSession object
 */
export function parseDilemmaShareString(input) {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  let parsed = null;

  // 1. Check for token prefix
  if (trimmed.startsWith(SHARE_PREFIX) || trimmed.startsWith(LEGACY_PREFIX)) {
    const prefix = trimmed.startsWith(SHARE_PREFIX) ? SHARE_PREFIX : LEGACY_PREFIX;
    const content = trimmed.slice(prefix.length).trim();
    try {
      const jsonStr = decodeURIComponent(atob(content));
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      try {
        parsed = JSON.parse(content);
      } catch (e2) {
        // failed
      }
    }
  }

  // 2. Try raw JSON
  if (!parsed && (trimmed.startsWith("{") || trimmed.startsWith("["))) {
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      // failed
    }
  }

  // 3. Normalize parsed structure if valid
  if (parsed && typeof parsed === "object") {
    const title = typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : "Importert dilemma-økt";

    const description = typeof parsed.description === "string" ? parsed.description : "";

    let rawDilemmas = Array.isArray(parsed.dilemmas) ? parsed.dilemmas : [];
    if (!Array.isArray(parsed.dilemmas) && Array.isArray(parsed)) {
      rawDilemmas = parsed;
    }

    const dilemmas = rawDilemmas.map((d, idx) => {
      return {
        id: crypto.randomUUID(),
        title: typeof d.title === "string" && d.title.trim() ? d.title.trim() : `Dilemma ${idx + 1}`,
        leftOption: {
          text: typeof d.leftOption?.text === "string" ? d.leftOption.text : d.left || d.optionA || "",
          icon: typeof d.leftOption?.icon === "string" ? d.leftOption.icon : "👈",
          imagePath: typeof d.leftOption?.imagePath === "string" ? d.leftOption.imagePath : "",
        },
        rightOption: {
          text: typeof d.rightOption?.text === "string" ? d.rightOption.text : d.right || d.optionB || "",
          icon: typeof d.rightOption?.icon === "string" ? d.rightOption.icon : "👉",
          imagePath: typeof d.rightOption?.imagePath === "string" ? d.rightOption.imagePath : "",
        },
      };
    });

    if (dilemmas.length > 0) {
      return {
        id: crypto.randomUUID(),
        title,
        description,
        dilemmas,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  return null;
}
