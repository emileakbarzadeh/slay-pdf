import type { ExportSettings } from '../types'

type ProcessingOptions = Pick<ExportSettings, 'compression'> & { password?: string }

async function runAdvancedWorker(
  payload: { action: 'process'; compression: ExportSettings['compression']; password?: string } | { action: 'decrypt'; password: string },
  input: Blob,
  onProgress?: (progress: number, label: string) => void
) {
  const worker = new Worker(new URL('../workers/advanced.worker.ts', import.meta.url), { type: 'module' })
  const bytes = await input.arrayBuffer()
  return new Promise<Blob>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<{ type: string; bytes?: ArrayBuffer; progress?: number; label?: string; message?: string }>) => {
      if (event.data.type === 'progress') onProgress?.(event.data.progress ?? 0, event.data.label ?? 'Processing PDF')
      if (event.data.type === 'result' && event.data.bytes) {
        worker.terminate()
        resolve(new Blob([event.data.bytes], { type: 'application/pdf' }))
      }
      if (event.data.type === 'error') {
        worker.terminate()
        reject(new Error(event.data.message ?? 'Advanced PDF processing failed.'))
      }
    }
    worker.onerror = () => {
      worker.terminate()
      reject(new Error('The PDF processing worker could not start.'))
    }
    worker.postMessage({ bytes, ...payload }, [bytes])
  })
}

export async function processPdf(
  input: Blob,
  options: ProcessingOptions,
  onProgress?: (progress: number, label: string) => void
) {
  return runAdvancedWorker({ action: 'process', ...options }, input, onProgress)
}

export async function decryptPdf(input: Blob, password: string, onProgress?: (progress: number, label: string) => void) {
  return runAdvancedWorker({ action: 'decrypt', password }, input, onProgress)
}
