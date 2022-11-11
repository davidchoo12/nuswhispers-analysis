import { useRef, useEffect, useContext } from 'react'
// import WordCloud from 'wordcloud/src/wordcloud2'
import { Network, DataSet, Options } from 'vis-network/standalone/esm'
import { ThemeContext } from '../ThemeContext'

interface PostsNetworkProps {
  nodes: (string | number)[]
  edges: (string | number)[][]
  highlightNodes?: (string | number)[]
  highlightEdges?: (string | number)[][]
}

export default function PostsNetwork({
  nodes = [],
  edges = [],
  highlightNodes = [],
  highlightEdges = [],
}: PostsNetworkProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const theme = useContext(ThemeContext)

  useEffect(() => {
    const options: Options = {
      nodes: {
        font: {
          size: 30,
          color: theme.palette.fgColor,
        },
        color: theme.palette.bgSecondary,
      },
      edges: {
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 1,
          },
        },
        width: 2,
        color: theme.palette.fgSecondary,
      },
      layout: {
        randomSeed: 0,
        // hierarchical: {
        //   levelSeparation: 200,
        //   nodeSpacing: 50,
        //   direction: 'LR',
        //   sortMethod: 'directed',
        //   shakeTowards: 'leaves',
        // }
      },
      interaction: {
        dragNodes: false,
        dragView: false,
        selectable: false,
        zoomView: false,
      },
      physics: {
        barnesHut: {
          avoidOverlap: 0.1,
          springLength: 50,
        },
        // stabilization: {
        //   iterations: 2000,
        // },
      },
    }

    const data = {
      nodes: new DataSet(
        nodes.map((node) => ({
          id: node,
          label: node.toString(),
          color: highlightNodes.includes(node) ? { background: theme.palette.bgHighlight } : undefined,
        }))
      ),
      edges: new DataSet(
        edges.map((edge) => ({
          from: edge[0],
          to: edge[1],
          color: highlightEdges.find((e) => e[0] === edge[0] && e[1] === edge[1])
            ? { color: theme.palette.bgHighlight }
            : undefined,
        }))
      ),
    }

    const elem = divRef.current
    if (nodes.length > 0 && elem != null) {
      new Network(elem, data, options)
    }

    return () => {
      if (elem?.innerHTML) {
        elem.innerHTML = ''
      }
    }
  }, [nodes, edges, highlightNodes, highlightEdges, theme])

  if (nodes.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <div ref={divRef} className="h-[600px]"></div>
      <div className="absolute top-0 left-0 bg-primary-bright dark:bg-primary-dark">
        {/* <div>X -&gt; Y means post #X is tagged by post #Y.</div> */}
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
      </div>
    </div>
  )
}
