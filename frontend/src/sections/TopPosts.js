import Papa from 'papaparse'
import { useEffect, useState } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import PostsTable from '../components/PostsTable'
import Section from '../components/Section'

function TopPostsByMetric({ title, metricDataset, timedeltas }) {
  const [selectedTimedelta, setSelectedTimedelta] = useState(Object.keys(timedeltas)[0])
  return (
    <Section title={title} level={3}>
      <ButtonGroup
        options={Object.entries(timedeltas).map(([value, name]) => ({name, value}))}
        onChange={(value) => setSelectedTimedelta(value)}
      />
      <PostsTable csvData={metricDataset[selectedTimedelta].slice(0, 10)} />
    </Section>
  )
}

const metrics = ['likes', 'comments', 'shares']
const timedeltas = {'all': 'All Time', 'year': 'This Year', 'month': 'This Month', 'week': 'This Week'}
const titles = ['Top 10 most liked posts', 'Top 10 most commented posts', 'Top 10 most shared posts']

export default function TopPosts() {
  const defaultDataset = {}
  for (const metric of metrics) {
    defaultDataset[metric] = {}
    for (const timedelta of Object.keys(timedeltas)) {
      defaultDataset[metric][timedelta] = []
    }
  }
  const [datasets, setDatasets] = useState(defaultDataset)

  useEffect(() => {
    const promises = []
    for (const metric of metrics) {
      for (const timedelta of Object.keys(timedeltas)) {
        const csvUrl = `/data/top-posts/${metric}-${timedelta}.csv`
        promises.push(new Promise((resolve) => {
          Papa.parse(csvUrl, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: result => {
              if (result.errors.length > 0) {
                console.error('parse data failed', csvUrl, result.errors)
                resolve({metric, timedelta, data: []})
              }
              resolve({metric, timedelta, data: result.data})
            }
          })
        }))
      }
    }
    Promise.all(promises)
    .then(results => {
      const queriedDatasets = {}
      for (const {metric, timedelta, data} of results) {
        if (!queriedDatasets[metric]) {
          queriedDatasets[metric] = {}
        }
        queriedDatasets[metric][timedelta] = data
      }
      setDatasets(queriedDatasets)
    })
  }, [])
  return (
    <Section title='Top Posts' level={2}>
      {metrics.map((metric, i) => (
        <TopPostsByMetric
          key={metric}
          title={titles[i]}
          metricDataset={datasets[metric]}
          timedeltas={timedeltas}
        />
      ))}
    </Section>
  )
}