import { useEffect, useState } from 'react'
import { ParseResult } from 'papaparse'
import Section from '../components/Section'
import PostsNetwork from '../components/PostsNetwork'
import PostsTable from '../components/PostsTable'
import { MostMentionedNetwork, Network, Post } from '../models'
import FetchCsv from '../CsvFetcher'
import Pagination from '../components/Pagination'

const sizes = ['biggest', 'longest']
const mostMentioned = 'most-mentioned'
interface ParsedNetwork {
  root: number
  nodes: number[]
  edges: [number, number][]
  longest_path: number[]
}
type SizeParsedNetworkDataset = Record<string, ParsedNetwork[]>
type SizePostDataset = Record<string, Post[]>

export default function TopNetworks() {
  const [mostMentionedNetworks, setMostMentionedNetworks] = useState<ParsedNetwork[]>([])
  const defaultDataset: Record<string, any[]> = {}
  for (const size of sizes) {
    defaultDataset[size] = []
  }
  const [networkDatasets, setNetworkDatasets] = useState<SizeParsedNetworkDataset>({})
  const [postDatasets, setPostDatasets] = useState<SizePostDataset>({})

  const [selectedNthMostMentioned, setSelectedNthMostMentioned] = useState<number>(0)
  const [selectedNthBiggest, setSelectedNthBiggest] = useState<number>(0)
  const [selectedNthLongest, setSelectedNthLongest] = useState<number>(0)

  useEffect(() => {
    FetchCsv<MostMentionedNetwork>('./data/top-networks/most-mentioned.csv').then((result) => {
      const parsedNetworks: ParsedNetwork[] = result.data.map((row) => {
        const neighbours: number[] = row.neighbours.split(',').map((e) => parseInt(e))
        return {
          root: row.source,
          nodes: [row.source, ...neighbours],
          edges: neighbours.map((neighbour) => [row.source, neighbour]),
          longest_path: [],
        }
      })
      setMostMentionedNetworks(parsedNetworks)
    })

    const networkPromises: Promise<ParseResult<Network>>[] = []
    for (const size of sizes) {
      const networkCsvUrl = `./data/top-networks/${size}.csv`
      networkPromises.push(FetchCsv<Network>(networkCsvUrl))
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

    const postPromises: Promise<ParseResult<Post>>[] = []
    const postSizes = [mostMentioned, ...sizes]
    for (const size of postSizes) {
      const postCsvUrl = `./data/top-networks/${size}-posts.csv`
      postPromises.push(FetchCsv<Post>(postCsvUrl))
    }
    Promise.allSettled(postPromises).then((promisesResults) => {
      const datasets: SizePostDataset = {}
      for (const [i, promiseResult] of promisesResults.entries()) {
        if (promiseResult.status === 'rejected') {
          continue
        }
        const size = postSizes[i]
        datasets[size] = promiseResult.value.data
      }
      setPostDatasets(datasets)
    })
  }, [])

  return (
    <Section title="Most Controversial Posts" level={2}>
      <p>
        NUSWhispers is known for some of its controversial posts. Here we explore the top posts that caused the most
        controversy in the history of NUSWhispers.
      </p>
      <p>
        Posts on NUSWhispers often reference another post by it's confession #. I extracted mentions of any older posts
        for every post, which forms the edges (arrows) in a network. In technical terms, the edge list forms a bunch of
        disjointed directed acyclic graphs. These are some of such networks.
      </p>
      <Section title="Top 10 Most Mentioned Posts" level={3}>
        <p>These are the top posts that has the most direct mentions by any other posts.</p>
        <Pagination
          currentPage={selectedNthMostMentioned + 1}
          onPageChange={(newPage) => {
            setSelectedNthMostMentioned(newPage - 1)
          }}
          pageSize={1}
          totalCount={mostMentionedNetworks?.length}
        />
        <PostsNetwork
          nodes={mostMentionedNetworks?.[selectedNthMostMentioned]?.nodes}
          edges={mostMentionedNetworks?.[selectedNthMostMentioned]?.edges}
          highlightNodes={[mostMentionedNetworks?.[selectedNthMostMentioned]?.root]}
        />
        <PostsTable
          csvData={postDatasets?.[mostMentioned]?.filter((post) => {
            return mostMentionedNetworks?.[selectedNthMostMentioned]?.nodes?.includes(post.cid)
          })}
          hideNumberCol={true}
          highlightCid={mostMentionedNetworks?.[selectedNthMostMentioned]?.root}
        />
      </Section>

      <Section title="Top 10 Biggest Networks" level={3}>
        <p>
          Just like replies in facebook/twitter comments, a post in NUSWhisper can "reply" to another post that
          "comments" on the source post. I consider these posts as indirect mentions to the source post. These are the
          posts that has the most direct and indirect mentions.
        </p>
        {/* <ButtonGroup options={nthOptions} onChange={(value) => setSelectedNthBiggest(value)} /> */}
        <Pagination
          currentPage={selectedNthBiggest + 1}
          onPageChange={(newPage) => {
            setSelectedNthBiggest(newPage - 1)
          }}
          pageSize={1}
          totalCount={networkDatasets?.biggest?.length}
        />
        <PostsNetwork
          nodes={networkDatasets?.biggest?.[selectedNthBiggest]?.nodes}
          edges={networkDatasets?.biggest?.[selectedNthBiggest]?.edges}
          highlightNodes={[networkDatasets?.biggest?.[selectedNthBiggest]?.root]}
        />
        <PostsTable
          csvData={postDatasets?.biggest?.filter((post) => {
            return networkDatasets?.biggest?.[selectedNthBiggest]?.nodes?.includes(post.cid)
          })}
          hideNumberCol={true}
          highlightCid={networkDatasets?.biggest?.[selectedNthBiggest]?.root}
        />
      </Section>

      <Section title="Top 10 Longest Networks" level={3}>
        <p>
          These are the top posts that caused the longest chain of mentions. They tend to include replies from the
          original poster of the source post forming a conversation under the veil of anonymity. The{' '}
          <span className="text-highlight-bright dark:text-highlight-dark">highlighted arrows</span> show the longest
          path.
        </p>
        {/* <ButtonGroup options={nthOptions} onChange={(value) => setSelectedNthLongest(value)} /> */}
        <Pagination
          currentPage={selectedNthLongest + 1}
          onPageChange={(newPage) => {
            setSelectedNthLongest(newPage - 1)
          }}
          pageSize={1}
          totalCount={networkDatasets?.longest?.length}
        />
        <PostsNetwork
          nodes={networkDatasets?.longest?.[selectedNthLongest]?.longest_path}
          edges={networkDatasets?.longest?.[selectedNthLongest]?.edges}
          highlightNodes={[networkDatasets?.longest?.[selectedNthLongest]?.root]}
          highlightEdges={networkDatasets?.longest?.[selectedNthLongest]?.longest_path?.map((e, i, a) => [e, a[i + 1]])}
        />
        <PostsTable
          csvData={postDatasets?.longest?.filter((post) => {
            return networkDatasets?.longest?.[selectedNthLongest]?.longest_path?.includes(post.cid)
          })}
          hideNumberCol={true}
          highlightCid={networkDatasets?.longest?.[selectedNthLongest]?.root}
        />
      </Section>
    </Section>
  )
}
