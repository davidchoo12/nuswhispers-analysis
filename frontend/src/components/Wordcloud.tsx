import { useRef, useEffect, useContext } from 'react'
import wordcloudPlot from 'wordcloud'
import { ThemeContext } from '../ThemeContext'

interface WordcloudProps {
  wordWeights: [string, number][]
}

export default function Wordcloud({ wordWeights }: WordcloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useContext(ThemeContext)

  useEffect(() => {
    const sum = wordWeights.reduce((a, e) => a + e[1], 0)
    const elem = canvasRef.current as HTMLElement
    // fix hi-dpi display blurry font issue https://github.com/timdream/wordcloud2.js/issues/97#issuecomment-302927922
    const width = elem.parentElement?.clientWidth! * 2
    elem.setAttribute('width', width.toString())
    elem.setAttribute('height', ((width * 9) / 16).toString())
    const options = {
      list: wordWeights.map(([word, weight]) => [word, weight / sum]),
      weightFactor: 900,
      rotationSteps: 2,
      backgroundColor: theme.palette.bgColor,
      color: theme.isDarkMode ? 'random-light' : 'random-dark',
      shuffle: false,
    }
    wordcloudPlot(elem, options)
    return () => {
      if (elem?.innerHTML) {
        elem.innerHTML = ''
      }
    }
  }, [wordWeights, theme])

  return <canvas ref={canvasRef} className="w-full"></canvas>
}
