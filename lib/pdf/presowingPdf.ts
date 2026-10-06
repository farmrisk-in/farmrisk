/**
 * Pre-Sowing PDF Generator Utility
 * Generates high-resolution multi-page A4 PDF reports for the Pre-Sowing advisory.
 *
 * Features:
 * - Strictly pure white, high-contrast light theme (no dark elements).
 * - Smart page breaking at card boundaries (avoids splitting cards, tables, or callouts).
 * - Enhanced typography, sizing, and comfortable spacing for maximum legibility.
 * - Complete un-truncated titles and clean running page footers.
 */

export interface PreSowingPDFOptions {
  elementId: string;
  cropName: string;
  stateName: string;
}

export async function generatePreSowingPDF({
  elementId,
  cropName,
  stateName,
}: PreSowingPDFOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Dynamically import html2canvas-pro and jsPDF to prevent SSR issues
  const html2canvas = (await import("html2canvas-pro")).default;
  const { jsPDF } = await import("jspdf");

  const scale = 2; // 2x retina resolution
  const fixedWidth = 1100; // Fixed 1100px desktop viewport for balanced A4 proportions

  // We will collect card bounds from the cloned document
  let cardBounds: Array<{ top: number; bottom: number }> = [];

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: "#FFFFFF",
    windowWidth: fixedWidth,
    onclone: (clonedDoc) => {
      // 1. Force strictly pure light mode on document roots
      clonedDoc.documentElement.classList.remove("dark");
      clonedDoc.body.classList.remove("dark");
      clonedDoc.documentElement.setAttribute("data-theme", "light");
      clonedDoc.documentElement.style.colorScheme = "light";

      // 2. Unhide the PDF report header
      const header = clonedDoc.getElementById("presowing-pdf-header");
      if (header) {
        header.style.display = "block";
      }

      // 3. Inject strict light theme and typography styles for the printable container
      const style = clonedDoc.createElement("style");
      style.textContent = `
        /* STRICT LIGHT MODE OVERRIDES FOR PDF EXPORT */
        html, body, #presowing-printable-area, #presowing-printable-area * {
          color-scheme: light !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        #presowing-printable-area {
          background-color: #FFFFFF !important;
          color: #0F172A !important;
          width: ${fixedWidth}px !important;
          max-width: ${fixedWidth}px !important;
          box-sizing: border-box !important;
          padding: 16px !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }

        /* Pure white cards with crisp light borders and subtle elevation */
        #presowing-printable-area [data-pdf-card="true"],
        #presowing-printable-area .bg-card,
        #presowing-printable-area [data-slot="card"] {
          background-color: #FFFFFF !important;
          color: #0F172A !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 14px !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
        }

        /* Un-truncate all titles and text so full text is readable */
        #presowing-printable-area .truncate {
          overflow: visible !important;
          text-overflow: clip !important;
          white-space: normal !important;
        }

        /* Card Header Typography */
        #presowing-printable-area h3 {
          font-size: 16px !important;
          font-weight: 700 !important;
          color: #0F172A !important;
          line-height: 1.35 !important;
        }

        #presowing-printable-area h3 + p,
        #presowing-printable-area .text-muted-foreground {
          font-size: 12px !important;
          color: #475569 !important;
          line-height: 1.4 !important;
        }

        /* Body paragraphs and lists */
        #presowing-printable-area p {
          font-size: 13.5px !important;
          line-height: 1.6 !important;
          color: #1E293B !important;
          margin-bottom: 8px !important;
        }

        #presowing-printable-area li {
          font-size: 13px !important;
          line-height: 1.55 !important;
          color: #334155 !important;
          margin-bottom: 4px !important;
        }

        #presowing-printable-area strong {
          color: #0F172A !important;
          font-weight: 700 !important;
        }

        /* Markdown tables: Spacious, clean, high readability */
        #presowing-printable-area table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 12px 0 !important;
          font-size: 12.5px !important;
          background-color: #FFFFFF !important;
        }

        #presowing-printable-area th {
          background-color: #F8FAFC !important;
          color: #0F172A !important;
          font-weight: 700 !important;
          font-size: 11.5px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          padding: 9px 12px !important;
          border-bottom: 2px solid #CBD5E1 !important;
          border-right: 1px solid #E2E8F0 !important;
          text-align: left !important;
        }

        #presowing-printable-area td {
          padding: 8px 12px !important;
          font-size: 12.5px !important;
          line-height: 1.5 !important;
          color: #1E293B !important;
          border-bottom: 1px solid #E2E8F0 !important;
          border-right: 1px solid #E2E8F0 !important;
          background-color: #FFFFFF !important;
        }

        #presowing-printable-area tr:nth-child(even) td {
          background-color: #F8FAFC !important;
        }

        #presowing-printable-area th:last-child,
        #presowing-printable-area td:last-child {
          border-right: none !important;
        }

        /* Callouts / Warnings (Emerald treatment) */
        #presowing-printable-area blockquote {
          background-color: #F0FDF4 !important;
          border-left: 4px solid #16A34A !important;
          color: #14532D !important;
          padding: 10px 14px !important;
          border-radius: 6px !important;
          margin: 12px 0 !important;
          font-size: 12.5px !important;
          line-height: 1.55 !important;
        }

        #presowing-printable-area blockquote strong,
        #presowing-printable-area blockquote em {
          color: #14532D !important;
        }

        /* Badges */
        #presowing-printable-area .bg-muted {
          background-color: #F1F5F9 !important;
          color: #334155 !important;
        }

        #presowing-printable-area .bg-emerald-500\\/10 {
          background-color: #ECFDF5 !important;
          color: #065F46 !important;
        }

        /* Nearest KVK Guidance Card */
        #presowing-printable-area [data-pdf-card="true"]:last-child {
          background-color: #FFFFFF !important;
          color: #0F172A !important;
          border: 1px solid #E2E8F0 !important;
        }
      `;
      clonedDoc.head.appendChild(style);

      // 4. Force styles directly on the root element
      const printRoot = clonedDoc.getElementById(elementId);
      if (printRoot) {
        printRoot.style.backgroundColor = "#FFFFFF";
        printRoot.style.color = "#0F172A";
        printRoot.style.width = `${fixedWidth}px`;
        printRoot.style.maxWidth = `${fixedWidth}px`;

        // 5. Measure card positions for smart page-breaking
        const rootRect = printRoot.getBoundingClientRect();
        const cards = Array.from(
          clonedDoc.querySelectorAll('[data-pdf-card="true"]')
        ) as HTMLElement[];

        cardBounds = cards.map((c) => {
          const rect = c.getBoundingClientRect();
          return {
            top: (rect.top - rootRect.top) * scale,
            bottom: (rect.bottom - rootRect.top) * scale,
          };
        });
      }
    },
  });

  // A4 dimensions in millimeters
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 10; // 10mm margins on all sides
  const contentWidth = imgWidth - margin * 2; // 190mm usable width
  const contentHeight = pageHeight - margin * 2; // 277mm usable height

  const pxPerMm = canvas.width / contentWidth;
  const maxPageHeightPx = contentHeight * pxPerMm;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Smart slice calculation:
  // Instead of cutting through cards, break pages cleanly above cards that would be sliced
  const slices: Array<{ startY: number; height: number }> = [];
  let currentY = 0;

  while (currentY < canvas.height) {
    const nominalBottom = currentY + maxPageHeightPx;

    if (nominalBottom >= canvas.height) {
      // Final page
      slices.push({
        startY: currentY,
        height: canvas.height - currentY,
      });
      break;
    }

    // Check if nominalBottom slices through any card
    let bestSliceBottom = nominalBottom;

    for (const card of cardBounds) {
      if (card.top < nominalBottom && card.bottom > nominalBottom) {
        // This card is being intersected by the page break!
        // If the card starts at least 120px below currentY, break cleanly right before it
        if (card.top > currentY + 120 * scale) {
          bestSliceBottom = card.top - 6 * scale; // 6px buffer above the card
          break;
        }
      }
    }

    const sliceHeight = bestSliceBottom - currentY;
    slices.push({
      startY: currentY,
      height: sliceHeight,
    });

    currentY = bestSliceBottom;
  }

  const totalPages = slices.length;

  for (let i = 0; i < totalPages; i++) {
    const slice = slices[i];
    const sliceHeightMm = slice.height / pxPerMm;

    // Create an isolated canvas slice for the current A4 page
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = slice.height;

    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        slice.startY,
        canvas.width,
        slice.height,
        0,
        0,
        canvas.width,
        slice.height
      );

      const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);

      if (i > 0) {
        pdf.addPage("a4", "portrait");
      }

      pdf.addImage(
        pageImgData,
        "JPEG",
        margin,
        margin,
        contentWidth,
        sliceHeightMm,
        undefined,
        "FAST"
      );

      // Running page footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `FarmRisk Pre-Sowing Advisory Report • ${cropName} (${stateName}) • Page ${i + 1} of ${totalPages}`,
        imgWidth / 2,
        pageHeight - 4,
        { align: "center" }
      );
    }
  }

  const safeCrop = cropName.replace(/[^a-zA-Z0-9]/g, "_");
  const safeState = stateName.replace(/[^a-zA-Z0-9]/g, "_");
  pdf.save(`FarmRisk_PreSowing_${safeCrop}_${safeState}.pdf`);
}
