import Papa from 'papaparse'
import { useState, useEffect } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import Section from '../components/Section'
import TimelineChart from '../components/TimelineChart'

const metrics = {'likes': 'Likes', 'comments': 'Comments', 'shares': 'Shares'}

export default function MetricsDistribution() {
  const [datasets, setDatasets] = useState({})
  const [selectedMetric, setSelectedMetric] = useState('likes')
  useEffect(() => {
    const promises = []
    for (const metric of Object.keys(metrics)) {
      const csvUrl = `/data/metrics-distribution/${metric}.csv`
      promises.push(new Promise((resolve) => {
        Papa.parse(csvUrl, {
          download: true,
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: result => {
            if (result.errors.length > 0) {
              console.error('parse data failed', csvUrl, result.errors)
              resolve({metric, data: []})
            }
            let transposed = result.meta.fields.map(field => result.data.map(row => row[field]))
            transposed[0] = transposed[0].map(label => label.toString())
            resolve({metric, data: transposed})
          }
        })
      }))
    }
    Promise.all(promises)
    .then(results => {
      const queriedDatasets = {}
      for (const {metric, data} of results) {
        queriedDatasets[metric] = data
      }
      setDatasets(queriedDatasets)
    })
  }, [])
  return (
    <Section title="Metrics Distribution" level={2}>
      <ButtonGroup options={Object.entries(metrics).map(([k,v]) => ({name: v, value: k}))} onChange={(value) => setSelectedMetric(value)}/>
      <TimelineChart data={datasets[selectedMetric]} isXAxisDateType={false} isCategorical={true} />
    </Section>
  )
}