/**
 * Generates an A4 light-background PDF from a policy page element using html2pdf.js.
 */
export const downloadPolicyPdf = async (elementId, filename = 'Marichin_Homestay_Policies.pdf') => {
  if (typeof document === 'undefined') return false;
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) return false;

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const html2pdfModule = await import('html2pdf.js');
  const html2pdf = html2pdfModule.default || html2pdfModule;

  const opt = {
    margin: [10, 10, 12, 10],
    filename,
    image: { type: 'jpeg', quality: 0.96 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FAF6EC',
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (el) => {
        if (!el || !el.classList) return false;
        return el.classList.contains('print:hidden') || el.classList.contains('no-print');
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  await html2pdf().from(sourceEl).set(opt).save();
  return true;
};

