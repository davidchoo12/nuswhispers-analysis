import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import Section from '../components/Section'
import PostsNetwork from '../components/PostsNetwork'
import ButtonGroup from '../components/ButtonGroup'
import PostsTable from '../components/PostsTable'

const datasetNames = ['biggest', 'longest', 'biggest-posts', 'longest-posts']
const nthOptions = [
  { name: '1st', value: 0 },
  { name: '2nd', value: 1 },
  { name: '3rd', value: 2 },
  { name: '4th', value: 3 },
  { name: '5th', value: 4 },
  { name: '6th', value: 5 },
  { name: '7th', value: 6 },
  { name: '8th', value: 7 },
  { name: '9th', value: 8 },
  { name: '10th', value: 9 },
]

export default function TopNetworks() {
  const defaultDataset = {}
  for (const datasetName of datasetNames) {
    defaultDataset[datasetName] = []
  }
  const [datasets, setDatasets] = useState(defaultDataset)
  const [selectedNthBiggest, setSelectedNthBiggest] = useState(0)
  const [selectedNthLongest, setSelectedNthLongest] = useState(0)

  useEffect(() => {
    const promises = []
    for (const datasetName of datasetNames) {
      const csvUrl = `/data/top-networks/${datasetName}.csv`
      promises.push(new Promise((resolve) => {
        Papa.parse(csvUrl, {
          download: true,
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: result => {
            if (result.errors.length > 0) {
              console.error('parse data failed', csvUrl, result.errors)
              resolve({datasetName, data: []})
            }
            resolve({datasetName, data: result.data})
          }
        })
      }))
    }
    Promise.all(promises)
    .then(results => {
      const queriedDatasets = {}
      for (const {datasetName, data} of results) {
        const parsedData = data.map(row => {
          if ('nodes' in row) {
            row.nodes = row.nodes.split(',').map(e => parseInt(e))
          }
          if ('edges' in row) {
            row.edges = JSON.parse(row.edges)
          }
          if ('longest_path' in row) {
            row.longest_path = row.longest_path.split(',').map(e => parseInt(e))
          }
          return row
        })
        queriedDatasets[datasetName] = parsedData
      }
      console.log('topnetworks setting datasets')
      setDatasets(queriedDatasets)
    })
  }, [])
  console.log('topnetworks')
  return (
    <Section title="Most controversial posts" level={2}>
      <Section title="Biggest networks" level={3}>
        <ButtonGroup
          options={nthOptions}
          onChange={(value) => setSelectedNthBiggest(value)}
        />
        <PostsNetwork
          nodes={datasets?.biggest?.[selectedNthBiggest]?.nodes}
          edges={datasets?.biggest?.[selectedNthBiggest]?.edges}
          highlightNodes={[datasets?.biggest?.[selectedNthBiggest]?.adj]}
        />
        <PostsTable csvData={datasets?.['biggest-posts'].filter(row => {
          return datasets?.biggest?.[selectedNthBiggest]?.nodes?.includes(row.cid)
        })} />
      </Section>
      <Section title="Longest networks" level={3}>
        <ButtonGroup
          options={nthOptions}
          onChange={(value) => setSelectedNthLongest(value)}
        />
        <PostsNetwork
          nodes={datasets?.longest?.[selectedNthLongest]?.longest_path}
          edges={datasets?.longest?.[selectedNthLongest]?.edges}
          highlightEdges={datasets?.longest?.[selectedNthLongest]?.longest_path.map((e,i,a) => ([a[i+1],e]))}
        />
        <PostsTable csvData={datasets?.['longest-posts'].filter(row => {
          return datasets?.longest?.[selectedNthLongest]?.longest_path?.includes(row.cid)
        })} />
      </Section>
    </Section>
  )
}