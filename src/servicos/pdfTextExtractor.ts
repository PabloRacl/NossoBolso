import * as pdfjsLib from 'pdfjs-dist';

// Configuração do worker do PDF.js
try {
  if (typeof window !== 'undefined') {
    // Configura o worker utilizando o bundle compilado do pdfjs-dist
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
} catch {
  // Fallback silencioso caso URL não possa ser resolvida no ambiente de teste
}

/**
 * Extrai o texto completo de um arquivo PDF no cliente (navegador).
 * Processa página a página e une os blocos de texto mantendo linhas.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  const fullTextLines: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();

    let lastY: number | null = null;
    let pageText = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        const textItem = item as { str: string; transform: number[] };
        const currentY = textItem.transform[5];

        // Se mudou a coordenada vertical (linha diferente), adiciona quebra de linha
        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }

        pageText += textItem.str;
        lastY = currentY;
      }
    }

    fullTextLines.push(pageText);
  }

  return fullTextLines.join('\n\n');
}
