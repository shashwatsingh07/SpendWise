/**
 * fileReader — turns an uploaded File into plain text the parser can read.
 *  - CSV / TXT: read directly
 *  - PDF: extract text with pdf.js (lazy-loaded so it doesn't bloat the
 *    initial bundle)
 */

export async function readFileAsText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return readPdf(file)
  }
  // csv, tsv, txt, or anything text-like
  return file.text()
}

async function readPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise

  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    // Group text items into lines by their y-position so rows stay intact
    const items = content.items as { str: string; transform: number[] }[]
    const lineMap = new Map<number, { x: number; str: string }[]>()
    for (const it of items) {
      if (!it.str.trim()) continue
      const y = Math.round(it.transform[5])
      const x = it.transform[4]
      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y)!.push({ x, str: it.str })
    }
    const sortedY = [...lineMap.keys()].sort((a, b) => b - a)
    for (const y of sortedY) {
      const line = lineMap.get(y)!
        .sort((a, b) => a.x - b.x)
        .map(c => c.str)
        .join(' ')
      pages.push(line)
    }
  }
  return pages.join('\n')
}
