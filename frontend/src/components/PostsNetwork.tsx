import { useRef, useEffect, useContext } from 'react'
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
          from: {
            enabled: true,
            scaleFactor: 1,
          },
        },
        width: 2,
        color: theme.palette.fgSecondary,
      },
      layout: {
        randomSeed: 0,
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
      <div ref={divRef} className="h-[50vh] my-5"></div>
      <div className="flex flex-col sm:flex-row items-center justify-center sm:gap-6 text-sm text-center mb-4">
        <div>
          <span className="inline-flex h-5 w-5 bg-highlight-bright dark:bg-highlight-dark rounded-full border border-secondary-dark items-center justify-center">
            X
          </span>{' '}
          is root post
        </div>
        <div>
          <span className="inline-flex h-5 w-5 bg-emerald-200 dark:bg-secondary-dark rounded-full border border-secondary-dark items-center justify-center">
            X
          </span>{' '}
          →{' '}
          <span className="inline-flex h-5 w-5 bg-emerald-200 dark:bg-secondary-dark rounded-full border border-secondary-dark items-center justify-center">
            Y
          </span>{' '}
          means #X mentions #Y
        </div>
        <div>
          No. of{' '}
          <span className="inline-flex h-8 w-16 bg-emerald-200 dark:bg-secondary-dark rounded-[50%] border border-secondary-dark items-center justify-center">
            Posts
          </span>{' '}
          = {nodes.length}
        </div>
        <div>No. of Mentions (→) = {edges.length}</div>
      </div>
      {/* <div className="absolute top-0 right-0 bg-primary-bright dark:bg-primary-dark text-sm">
        <span className="inline-flex h-5 w-5 bg-emerald-200 dark:bg-secondary-dark rounded-full border border-secondary-dark items-center justify-center">
          X
        </span>{' '}
        →{' '}
        <span className="inline-flex h-5 w-5 bg-emerald-200 dark:bg-secondary-dark rounded-full border border-secondary-dark items-center justify-center">
          Y
        </span>{' '}
        means #X mentions #Y
      </div> */}
    </div>
  )
}
