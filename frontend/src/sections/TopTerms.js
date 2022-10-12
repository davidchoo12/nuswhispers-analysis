import { useEffect, useState } from 'react'
import Section from '../components/Section'
import Wordcloud from '../components/Wordcloud'

export default function TopTerms() {
  const [wordcloudData, setWordcloudData] = useState({})
  useEffect(() => {
    fetch('/data/top-terms/terms.json')
      .then(res => res.json())
      .then(data => setWordcloudData(data))
  }, [])
  return (
    <Section title="Most mentioned words per week" level={2}>
      {Object.entries(wordcloudData).reverse().slice(0, 20).map(([date, wordWeights]) => (
        <div key={date} className="inline-block">
          <p>{date}</p>
          <Wordcloud wordWeights={Object.entries(wordWeights)} />
        </div>
      ))}
    </Section>
  )
}