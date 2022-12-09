import { ParseResult } from 'papaparse'
import { useEffect, useState } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import PostsTable from '../components/PostsTable'
import Section from '../components/Section'
import FetchCsv from '../CsvFetcher'
import { Post } from '../models'

interface TopPostsByMetricProps {
  metricDataset: Record<string, Post[]>
  timedeltas: Record<string, string>
}

function TopPostsByMetric({ metricDataset, timedeltas }: TopPostsByMetricProps) {
  const [selectedTimedelta, setSelectedTimedelta] = useState(Object.keys(timedeltas)[0])
  return (
    <>
      <ButtonGroup
        options={Object.entries(timedeltas).map(([value, name]) => ({ name, value }))}
        onChange={(value: string) => setSelectedTimedelta(value)}
      />
      <PostsTable csvData={metricDataset[selectedTimedelta].slice(0, 10)} />
    </>
  )
}

const metrics = ['likes', 'comments', 'shares']
const timedeltas = { all: 'All Time', year: 'Last Year', month: 'Last Month', week: 'Last Week' }

type TimedeltaPostDataset = Record<string, Post[]>
type MetricTimedeltaPostDataset = Record<string, TimedeltaPostDataset>

export default function TopPosts() {
  const defaultDataset: MetricTimedeltaPostDataset = {}
  for (const metric of metrics) {
    defaultDataset[metric] = {}
    for (const timedelta of Object.keys(timedeltas)) {
      defaultDataset[metric][timedelta] = []
    }
  }
  const [datasets, setDatasets] = useState<MetricTimedeltaPostDataset>(defaultDataset)

  useEffect(() => {
    const promises: Promise<ParseResult<Post>>[] = []
    const metricTimedeltas: { metric: string; timedelta: string }[] = []
    for (const metric of metrics) {
      for (const timedelta of Object.keys(timedeltas)) {
        const csvUrl = `./data/top-posts/${metric}-${timedelta}.csv`
        promises.push(FetchCsv<Post>(csvUrl))
        metricTimedeltas.push({ metric, timedelta })
      }
    }

    Promise.all(promises).then((results) => {
      const queriedDatasets: MetricTimedeltaPostDataset = {}
      for (const [i, result] of results.entries()) {
        const { metric, timedelta } = metricTimedeltas[i]
        if (!queriedDatasets[metric]) {
          queriedDatasets[metric] = {}
        }
        queriedDatasets[metric][timedelta] = result.data
      }
      setDatasets(queriedDatasets)
    })
  }, [])

  return (
    <Section title="Top Posts" level={1}>
      <p>
        Here are the top 10 NUSWhispers posts sorted by number of likes, comments and shares. The counts here only
        include likes, comments and shares from public accounts. In other words, these numbers are what you will see if
        you open each facebook post in incognito mode.
      </p>
      <Section title="Top 10 Most Liked Posts" level={2}>
        <p>
          Likes refer specifically to only the "Like 👍" reaction. Other reactions (Love ❤️, Care 🥰, Haha 🤣, Wow 😮,
          Sad 😢, Angry 😡) are not included. This is due to the other reaction counts were not available for data
          mining.
        </p>
        <p>Therefore, the top posts tend to be more positive in nature and more agreeable to the masses.</p>
        <TopPostsByMetric metricDataset={datasets['likes']} timedeltas={timedeltas} />
      </Section>
      <Section title="Top 10 Most Commented Posts" level={2}>
        <p>
          In contrast to the most liked posts, the most commented posts are more negative/controversial. They are also
          more likely to contain questions.
        </p>
        <TopPostsByMetric metricDataset={datasets['comments']} timedeltas={timedeltas} />
      </Section>
      <Section title="Top 10 Most Shared Posts" level={2}>
        <p>
          Many of the most shared posts are also in the most commented posts as shown by the high comment counts. There
          are also a few positive posts that managed to reach the top 10.
        </p>
        <TopPostsByMetric metricDataset={datasets['shares']} timedeltas={timedeltas} />
      </Section>
    </Section>
  )
}
