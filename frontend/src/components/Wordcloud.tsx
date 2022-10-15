import { useRef, useEffect } from 'react'
import wordcloudPlot from 'wordcloud/src/wordcloud2'

export default function Wordcloud({ title, wordWeights }) {
  const canvasRef = useRef(null)
  // console.log(sum, wordWeights)
  useEffect(() => {
    const sum = wordWeights.reduce((a, e) => a + e[1], 0)
    const options = {
      list: wordWeights.map(([word, weight]) => [word, weight/sum]),
      weightFactor: 200,
      rotationSteps: 2,
    }
    const elem = canvasRef.current
    wordcloudPlot(elem, options)
    return () => {
      if (elem?.innerHTML) {
        elem.innerHTML = ''
      }
    }
  }, [wordWeights])
  return (
    <canvas ref={canvasRef}></canvas>
  )
}