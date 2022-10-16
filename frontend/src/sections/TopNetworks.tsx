import { useEffect, useState } from 'react'
import { ParseResult } from 'papaparse'
import Section from '../components/Section'
import PostsNetwork from '../components/PostsNetwork'
import ButtonGroup from '../components/ButtonGroup'
import PostsTable from '../components/PostsTable'
import { Network, Post } from '../models'
import FetchCsv from '../CsvFetcher'

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

const sizes = ['biggest', 'longest']
interface ParsedNetwork {
  root: number
  nodes: number[]
  edges: [number, number][]
  longest_path: number[]
}
type SizeParsedNetworkDataset = Record<string, ParsedNetwork[]>
type SizePostDataset = Record<string, Post[]>

export default function TopNetworks() {
  const defaultDataset: Record<string, any[]> = {}
  for (const size of sizes) {
    defaultDataset[size] = []
  }
  const [networkDatasets, setNetworkDatasets] = useState<SizeParsedNetworkDataset>(defaultDataset)
  const [postDatasets, setPostDatasets] = useState<SizePostDataset>(defaultDataset)

  const [selectedNthBiggest, setSelectedNthBiggest] = useState<number>(0)
  const [selectedNthLongest, setSelectedNthLongest] = useState<number>(0)

  useEffect(() => {
    const networkPromises: Promise<ParseResult<Network>>[] = []
    const postPromises: Promise<ParseResult<Post>>[] = []
    for (const size of sizes) {
      const networkCsvUrl = `/data/top-networks/${size}.csv`
      networkPromises.push(FetchCsv<Network>(networkCsvUrl))
      const postCsvUrl = `/data/top-networks/${size}-posts.csv`
      postPromises.push(FetchCsv<Post>(postCsvUrl))
    }

    Promise.allSettled(networkPromises).then((promiseResults) => {
      const datasets: SizeParsedNetworkDataset = {}
      for (const [i, promiseResult] of promiseResults.entries()) {
        if (promiseResult.status === 'rejected') {
          continue
        }
        const parsedNetworks: ParsedNetwork[] = promiseResult.value.data.map((row) => ({
          root: row.root,
          nodes: row.nodes.split(',').map((e) => parseInt(e)),
          edges: JSON.parse(row.edges),
          longest_path: row.longest_path.split(',').map((e) => parseInt(e)),
        }))
        const size = sizes[i]
        datasets[size] = parsedNetworks
      }
      setNetworkDatasets(datasets)
    })

    Promise.allSettled(postPromises).then((promisesResults) => {
      const datasets: SizePostDataset = {}
      for (const [i, promiseResult] of promisesResults.entries()) {
        if (promiseResult.status === 'rejected') {
          continue
        }
        const size = sizes[i]
        datasets[size] = promiseResult.value.data
      }
      setPostDatasets(datasets)
    })
  }, [])

  return (
    <Section title="Most controversial posts" level={2}>
      <Section title="Biggest networks" level={3}>
        <ButtonGroup options={nthOptions} onChange={(value) => setSelectedNthBiggest(value)} />
        <PostsNetwork
          nodes={networkDatasets?.biggest?.[selectedNthBiggest]?.nodes || []}
          edges={networkDatasets?.biggest?.[selectedNthBiggest]?.edges || []}
          highlightNodes={[networkDatasets?.biggest?.[selectedNthBiggest]?.root || 0]}
        />
        <PostsTable
          csvData={postDatasets?.biggest?.filter((post) => {
            return networkDatasets?.biggest?.[selectedNthBiggest]?.nodes?.includes(post.cid)
          })}
        />
      </Section>

      <Section title="Longest networks" level={3}>
        <ButtonGroup options={nthOptions} onChange={(value) => setSelectedNthLongest(value)} />
        <PostsNetwork
          nodes={networkDatasets?.longest?.[selectedNthLongest]?.longest_path || []}
          edges={networkDatasets?.longest?.[selectedNthLongest]?.edges || []}
          highlightEdges={networkDatasets?.longest?.[selectedNthLongest]?.longest_path?.map((e, i, a) => [e, a[i + 1]])}
        />
        <PostsTable
          csvData={postDatasets?.longest?.filter((post) => {
            return networkDatasets?.longest?.[selectedNthLongest]?.longest_path?.includes(post.cid)
          })}
        />
      </Section>
    </Section>
  )
}
