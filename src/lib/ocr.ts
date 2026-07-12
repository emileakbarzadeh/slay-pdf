import Tesseract from 'tesseract.js'
import type { SourceDocument, WorkspacePage } from '../types'
import { renderPageBlob } from './pdf'

export type OcrWord = {
  text: string
  confidence: number
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

export type OcrPage = {
  words: OcrWord[]
  text: string
  imageWidth: number
  imageHeight: number
}

function tesseractBase() {
  return `${import.meta.env.BASE_URL}vendor/tesseract`
}

function collectWords(page: Tesseract.Page): OcrWord[] {
  const blocks = page.blocks ?? []
  return blocks.flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines.flatMap((line) => line.words)))
    .filter((word) => word.text.trim().length > 0 && word.confidence >= 25)
    .map((word) => ({ text: word.text, confidence: word.confidence, bbox: word.bbox }))
}

export async function recognizePages(
  pages: WorkspacePage[],
  sources: SourceDocument[],
  onProgress?: (progress: number, label: string) => void
) {
  const base = tesseractBase()
  const worker = await Tesseract.createWorker('eng', 1, {
    workerPath: `${base}/worker.min.js`,
    corePath: `${base}/core`,
    langPath: `${base}/lang`,
    workerBlobURL: false,
    gzip: true,
    logger: (message) => {
      if (message.status) onProgress?.(Math.min(0.95, message.progress), `OCR ${message.status}`)
    }
  })

  try {
    const output: OcrPage[] = []
    for (let index = 0; index < pages.length; index += 1) {
      const item = pages[index]
      const source = sources.find((candidate) => candidate.id === item.sourceId)
      if (!source) {
        output.push({ words: [], text: '', imageWidth: item.width * 2, imageHeight: item.height * 2 })
        continue
      }
      onProgress?.(index / pages.length, `OCR page ${index + 1}`)
      const image = await renderPageBlob(source, item.sourcePageIndex, 'image/png', 2)
      const result = await worker.recognize(image, {}, { blocks: true, text: true })
      output.push({
        words: collectWords(result.data),
        text: result.data.text,
        imageWidth: item.width * 2,
        imageHeight: item.height * 2
      })
    }
    return output
  } finally {
    await worker.terminate()
  }
}
