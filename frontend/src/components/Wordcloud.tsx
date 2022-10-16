import { useRef, useEffect } from 'react'
import wordcloudPlot from 'wordcloud'

interface WordcloudProps {
  wordWeights: [string, number][]
}

export default function Wordcloud({ wordWeights }: WordcloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // console.log(sum, wordWeights)
  useEffect(() => {
    const sum = wordWeights.reduce((a, e) => a + e[1], 0)
    const options = {
      list: wordWeights.map(([word, weight]) => [word, weight/sum]),
      weightFactor: 200,
      rotationSteps: 2,
    }
    const elem = canvasRef.current as HTMLElement
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