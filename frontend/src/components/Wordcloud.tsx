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
    const width = elem.parentElement?.clientWidth! * (window.devicePixelRatio ?? 1)
    console.log('parent width', width)
    elem.setAttribute('width', width.toString())
    const height = (width * 9) / 16
    elem.setAttribute('height', height.toString())
    // wordWeights = wordWeights.map(([word, weight]) => [word, (weight / sum) * 100])
    console.log('wordWeights', wordWeights)
    const options = {
      list: wordWeights,
      weightFactor: (size: number) => ((size * width) / sum) * (0.65 + wordWeights.length * 0.035),
      // minFontSize: 10,
      rotationSteps: 2,
      backgroundColor: theme.palette.bgColor,
      color: theme.isDarkMode ? 'random-light' : 'random-dark',
      shuffle: false,
      shape: 'square',
      drawOutOfBound: false,
      shrinkToFit: true,
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
