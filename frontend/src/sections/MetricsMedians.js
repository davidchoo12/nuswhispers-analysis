import Papa from 'papaparse'
import { useEffect, useState } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import Section from '../components/Section'
import TimelineChart from '../components/TimelineChart'

function MetricMedians({ title, metricDataset, timedeltas }) {
  const [selectedTimedelta, setSelectedTimedelta] = useState(Object.keys(timedeltas)[0])
  // console.log('MetricMedians metricDataset[selectedTimedelta]', metricDataset[selectedTimedelta])
  return (
    <Section title={title} level={3}>
      <ButtonGroup
        options={Object.entries(timedeltas).map(([value, name]) => ({name, value}))}
        onChange={(value) => setSelectedTimedelta(value)}
      />
      <TimelineChart data={[...metricDataset[selectedTimedelta]]} isXAxisDateType={!['hourofday', 'minuteofday'].includes(selectedTimedelta)} />
    </Section>
  )
}

export default function MetricsMedians() {
  const metrics = ['likes', 'comments', 'shares']
  const timedeltas = {
    'year': 'Per Year',
    'month': 'Per Month',
    'week': 'Per Week',
    'day': 'Per Day',
    'hourofday': 'Per Hour of Day',
    // 'minuteofday': 'Per Minute of Day',
  }
  const titles = ['Median Likes', 'Median Comments', 'Median Shares']
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
        const csvUrl = `/data/metrics-medians/${metric}-${timedelta}.csv`
        promises.push(new Promise((resolve) => {
          Papa.parse(csvUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: result => {
              if (result.errors.length > 0) {
                console.error('parse data failed', csvUrl, result.errors)
                resolve({metric, timedelta, data: []})
              }
              let transposed = result.meta.fields.map(field => result.data.map(row => row[field]))
              transposed[0] = transposed[0].map(timestamp => Date.parse(timestamp)/1000 || parseInt(timestamp))
              resolve({metric, timedelta, data: transposed})
            }
          })
        }))
      }
    }
    Promise.all(promises)
    .then(results => {
      for (const {metric, timedelta, data} of results) {
        if (!datasets[metric]) {
          datasets[metric] = {}
        }
        datasets[metric][timedelta] = data
      }
      // console.log('MetricsMedians promise all setting datasets')
      setDatasets({...datasets})
    })
    .catch(console.error)
  }, [])
  return (
    <Section title='Metrics Medians' level={2}>
      {metrics.map((metric, i) => (
        <MetricMedians
          key={metric}
          title={titles[i]}
          metricDataset={datasets[metric]}
          timedeltas={timedeltas}
        />
      ))}
    </Section>
  )
}