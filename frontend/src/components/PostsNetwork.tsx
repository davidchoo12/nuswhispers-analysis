import { useRef, useEffect } from 'react'
// import WordCloud from 'wordcloud/src/wordcloud2'
import { Network, DataSet, Options } from 'vis-network/standalone/esm/vis-network'

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

  useEffect(() => {
    const options: Options = {
      nodes: {
        font: {
          size: 30,
        },
      },
      edges: {
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 1,
          },
        },
        width: 2,
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
        zoomView: false,
      },
    }

    const data = {
      nodes: new DataSet(
        nodes.map((node) => ({
          id: node,
          label: node.toString(),
          color: highlightNodes.includes(node) ? { background: 'rgba(251, 191, 36)' } : undefined,
        }))
      ),
      edges: new DataSet(
        edges.map((edge) => ({
          from: edge[0],
          to: edge[1],
          color: highlightEdges.find((e) => e[0] === edge[0] && e[1] === edge[1])
            ? { color: 'rgba(251, 191, 36)' }
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
  }, [nodes, edges, highlightNodes, highlightEdges])

  if (nodes.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <div ref={divRef} className="h-96"></div>
      <div className="absolute top-0 left-0 bg-white">
        <div>X -&gt; Y means post #X is tagged by post #Y.</div>
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
      </div>
    </div>
  )
}