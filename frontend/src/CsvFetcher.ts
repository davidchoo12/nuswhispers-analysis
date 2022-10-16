import Papa, { ParseResult } from 'papaparse'

export default async function FetchCsv<T>(csvUrl: string) {
  return new Promise<ParseResult<T>>((resolve, reject) => {
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result: ParseResult<T>) => {
        if (result.errors.length > 0) {
          console.error('parse data failed', csvUrl, result.errors)
          // resolve({metric, data: []})
          reject(result.errors)
        }
        resolve(result)
      },
    })
  })
}
