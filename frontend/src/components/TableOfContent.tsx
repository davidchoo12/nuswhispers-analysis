import { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../ThemeContext'

// adapted from https://www.emgoto.com/react-table-of-contents/

interface NestedHeadings {
  id: string
  title: string
  items?: NestedHeadings[]
}

const getNestedHeadings = (headingElems: HTMLHeadingElement[]) => {
  const nestedHeadings: NestedHeadings[] = []
  for (const heading of headingElems) {
    const { innerText: title, id, nodeName } = heading
    if (nodeName === 'H1') {
      nestedHeadings.push({ id, title, items: [] })
    } else if (nodeName === 'H2' && nestedHeadings.length > 0) {
      nestedHeadings[nestedHeadings.length - 1].items?.push({ id, title })
    }
  }
  return nestedHeadings
}

const useHeadingsData = () => {
  const [nestedHeadings, setNestedHeadings] = useState<NestedHeadings[]>([])

  useEffect(() => {
    const headingElements: HTMLHeadingElement[] = Array.from(document.querySelectorAll('h1, h2'))
    const newNestedHeadings = getNestedHeadings(headingElements)
    setNestedHeadings(newNestedHeadings)
  }, [])

  return nestedHeadings
}

interface TocItem {
  listItem: HTMLLIElement
  anchor: HTMLAnchorElement
  target: HTMLElement
  pathStart: number
  pathEnd: number
}

// adapted from https://codepen.io/hakimel/pen/BpKNPg
function useHighlightMarker(nestedHeadings: NestedHeadings[]) {
  useEffect(() => {
    if (!nestedHeadings || nestedHeadings.length === 0) {
      return
    }

    const toc = document.querySelector('.toc') as Element
    const tocPath: SVGPathElement = document.querySelector('.toc-marker path') as SVGPathElement
    let tocItems: TocItem[] = []
    // Fraction of viewport height that the element must cross before it's considered visible
    const TOP_MARGIN = 0.1
    const BOTTOM_MARGIN = 0.2
    let pathLength = 0

    function sync() {
      let windowHeight = window.innerHeight
      let pathStart = pathLength
      let pathEnd = 0
      let visibleItems = 0
      let lastItemAbove = tocItems[0]

      for (const item of tocItems) {
        var targetBounds = item.target.getBoundingClientRect()

        if (targetBounds.bottom <= windowHeight * TOP_MARGIN) {
          lastItemAbove = item
        }
        if (targetBounds.bottom > windowHeight * TOP_MARGIN && targetBounds.top < windowHeight * (1 - BOTTOM_MARGIN)) {
          pathStart = Math.min(item.pathStart, pathStart)
          pathEnd = Math.max(item.pathEnd, pathEnd)
          visibleItems += 1
          item.listItem.classList.add('font-bold')
          item.listItem.classList.remove('font-normal')
        } else {
          item.listItem.classList.remove('font-bold')
          item.listItem.classList.add('font-normal')
        }
      }

      // if none of the headers are visible, set it to the last visible header
      if (visibleItems === 0) {
        pathStart = lastItemAbove.pathStart
        pathEnd = lastItemAbove.pathEnd
        visibleItems = 1
        lastItemAbove.listItem.classList.add('font-bold')
        lastItemAbove.listItem.classList.remove('font-normal')
      }

      // Draw the path
      if (pathStart < pathEnd) {
        tocPath.setAttribute('stroke-dashoffset', '1')
        tocPath.setAttribute('stroke-dasharray', '1, ' + pathStart + ', ' + (pathEnd - pathStart) + ', ' + pathLength)
      }
    }

    function drawPath() {
      const listItems = [].slice.call(toc.querySelectorAll('li')) as HTMLLIElement[]
      // Cache element references and measurements
      for (const item of listItems) {
        let anchor = item.querySelector('a') as HTMLAnchorElement
        let target = document.getElementById(anchor.getAttribute('href')?.slice(1) || '')
        if (target == null) {
          continue
        }

        tocItems.push({
          listItem: item,
          anchor: anchor,
          target: target,
          pathStart: 0,
          pathEnd: 0,
        })
      }

      let path = []
      let pathIndent = 0
      for (const [i, item] of tocItems.entries()) {
        const x = item.anchor.offsetLeft - 10
        const y = item.anchor.offsetTop
        const height = item.anchor.offsetHeight

        if (i === 0) {
          path.push('M', x, y, 'L', x, y + height)
          item.pathStart = 0
        } else {
          // Draw an additional line when there's a change in indent levels
          if (pathIndent !== x) {
            path.push('L', pathIndent, y)
          }

          path.push('L', x, y)

          // Set the current path so that we can measure it
          tocPath.setAttribute('d', path.join(' '))
          item.pathStart = tocPath.getTotalLength() || 0

          path.push('L', x, y + height)
        }

        pathIndent = x

        tocPath.setAttribute('d', path.join(' '))
        item.pathEnd = tocPath.getTotalLength()
      }
      pathLength = tocPath.getTotalLength()
      sync()
    }

    drawPath()
    window.addEventListener('scroll', sync, { passive: true })
    const observer = new ResizeObserver(sync)
    observer.observe(document.body)

    return () => {
      window.removeEventListener('scroll', sync, false)
      observer.disconnect()
    }
  }, [nestedHeadings])
}

export default function TableOfContent() {
  const nestedHeadings = useHeadingsData()
  useHighlightMarker(nestedHeadings)
  const theme = useContext(ThemeContext)

  const [hidden, setHidden] = useState(true)

  return (
    <>
      <button
        className="menuButton lg:hidden fixed z-30 top-[90px] right-4 p-3 rounded-full bg-secondary-bright transition"
        onClick={() => setHidden(!hidden)}
        title="Table of Content"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <nav
        className={`toc align-top fixed lg:sticky lg:flex-shrink-0 lg:self-start z-20 right-0 top-16 lg:top-24 w-full h-full lg:w-[300px] whitespace-nowrap lg:p-0 bg-primary-bright dark:bg-primary-dark overflow-y-auto ${
          hidden ? 'hidden lg:block' : ''
        } lg:inline-block`}
      >
        <ul className="relative w-fit px-4 mx-auto lg:ml-0 lg:mt-8">
          {nestedHeadings.map((heading) => (
            <li key={heading.id} className={'text-lg lg:text-base pl-3 my-6 lg:my-3'}>
              <a
                href={`#${heading.id}`}
                className={'no-underline text-primary-dark dark:text-primary-bright'}
                onClick={() => setHidden(true)}
              >
                {heading.title}
              </a>
              <ul className={`ml-6`}>
                {heading.items &&
                  heading.items.map((child) => (
                    <li key={child.id} className={'text-base lg:text-sm pl-3 my-3 lg:my-1.5'}>
                      <a
                        href={`#${child.id}`}
                        className={'no-underline text-primary-dark dark:text-primary-bright'}
                        onClick={() => setHidden(true)}
                      >
                        {child.title}
                      </a>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
          <svg
            className="toc-marker absolute top-0 left-0 w-full h-full -z-10"
            width="200"
            height="200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="transition-all duration-300"
              stroke={theme.palette.fgColor}
              strokeWidth={3}
              fill="transparent"
              strokeDasharray="0, 0, 0, 1000"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(-0.5, 0.5)"
            />
          </svg>
        </ul>
      </nav>
    </>
  )
}
