import Papa from 'papaparse'

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        resolve(results.data)
      },
      error(err) {
        reject(err)
      },
    })
  })
}

export function parseCsvString(csvString) {
  const results = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  })
  return results.data
}
