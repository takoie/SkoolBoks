/**
 * Helper to export the mindmap/wordcloud as a high-res PNG image
 */
export async function exportToPng(viewportElement, title = "ordsky-tankekart") {
  if (!viewportElement) return;

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Get bounding box of all nodes
    const nodeElements = viewportElement.querySelectorAll("[data-node-id]");
    if (nodeElements.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    nodeElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const parentRect = viewportElement.getBoundingClientRect();

      const left = rect.left - parentRect.left;
      const top = rect.top - parentRect.top;
      const right = left + rect.width;
      const bottom = top + rect.height;

      if (left < minX) minX = left;
      if (top < minY) minY = top;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    });

    const padding = 60;
    const width = Math.max(800, maxX - minX + padding * 2);
    const height = Math.max(600, maxY - minY + padding * 2);

    canvas.width = width * 2; // 2x retina high DPI
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // Background fill
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Render SVG connections onto canvas
    const svgEl = viewportElement.querySelector("svg");
    if (svgEl) {
      const svgString = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(blobURL);
          resolve();
        };
        img.onerror = resolve;
        img.src = blobURL;
      });
    }

    // Trigger download link
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Feil ved eksportering til PNG:", err);
    alert("Kunne ikke eksportere som PNG. Vennligst prøv igjen.");
  }
}

/**
 * Helper to export standalone SVG vector file
 */
export function exportToSvg(viewportElement, title = "ordsky-tankekart") {
  if (!viewportElement) return;

  const svgEl = viewportElement.querySelector("svg");
  if (!svgEl) return;

  const clone = svgEl.cloneNode(true);
  const svgString = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Helper to trigger print dialog with clean layout
 */
export function printCanvas() {
  window.print();
}
