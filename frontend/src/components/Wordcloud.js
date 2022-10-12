import { useRef, useEffect } from 'react'
import WordCloud from 'wordcloud/src/wordcloud2'

export default function Wordcloud({ title, wordWeights }) {
  const canvasRef = useRef(null)
  const sum = wordWeights.reduce((a, e) => a + e[1], 0)
  // console.log(sum, wordWeights)
  const options = {
    list: wordWeights.map(([word, weight]) => [word, weight/sum]),
    weightFactor: 200,
    rotationSteps: 2,
  }
  useEffect(() => {
    WordCloud(canvasRef.current, options)
  }, [])
  return (
    <canvas ref={canvasRef}></canvas>
  )
}