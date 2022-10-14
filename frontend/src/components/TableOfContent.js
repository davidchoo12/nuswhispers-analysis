import { useState, useEffect } from 'react'
import './TableOfContent.css'

// adapted from https://www.emgoto.com/react-table-of-contents/

const getNestedHeadings = (headingElems) => {
  const nestedHeadings = []
  for (const heading of headingElems) {
    const { innerText: title, id, nodeName } = heading
    if (nodeName === 'H2') {
      nestedHeadings.push({ id, title, items: [] })
    } else if (nodeName === 'H3' && nestedHeadings.length > 0) {
      nestedHeadings[nestedHeadings.length - 1].items.push({ id, title })
    }
  }
  return nestedHeadings
}

const useHeadingsData = () => {
  const [nestedHeadings, setNestedHeadings] = useState([])

  useEffect(() => {
    const headingElements = Array.from(document.querySelectorAll('h2, h3'))

    const newNestedHeadings = getNestedHeadings(headingElements)
    setNestedHeadings(newNestedHeadings)
  }, [])

  return nestedHeadings
}

// adapted from https://codepen.io/hakimel/pen/BpKNPg
function useHighlightMarker(nestedHeadings) {
  useEffect(() => {
    if (!nestedHeadings || nestedHeadings.length === 0) {
      return
    }
    const toc = document.querySelector('.toc')
    const tocPath = document.querySelector('.toc-marker path')
    let tocItems = []

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
          item.listItem.classList.add('active')
        } else {
          item.listItem.classList.remove('active')
        }
      }

      // if none of the headers are visible, set it to the last visible header
      if (visibleItems === 0) {
        pathStart = lastItemAbove.pathStart
        pathEnd = lastItemAbove.pathEnd
        visibleItems = 1
        lastItemAbove.listItem.classList.add('active')
      }

      // Draw the path
      if (pathStart < pathEnd) {
        tocPath.setAttribute('stroke-dashoffset', '1')
        tocPath.setAttribute('stroke-dasharray', '1, '+ pathStart +', '+ (pathEnd - pathStart) +', ' + pathLength)
      }
    }

    function drawPath() {
      tocItems = [].slice.call(toc.querySelectorAll('li'))

      // Cache element references and measurements
      tocItems = tocItems.map(item => {
        let anchor = item.querySelector('a')
        let target = document.getElementById(anchor.getAttribute('href').slice(1))

        return {
          listItem: item,
          anchor: anchor,
          target: target,
        }
      })

      // Remove missing targets
      tocItems = tocItems.filter(item => item.target)

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
          // Draw an additional line when there's a change in
          // indent levels
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
    window.addEventListener('scroll', sync, false)
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
  return (
    <nav className='toc'>
      <ul className='relative mt-20'>
        {nestedHeadings.map((heading) => (
          <li key={heading.id} className={'text-xl pl-3 my-0.5'}>
            <a href={`#${heading.id}`} className={'no-underline text-gray-400'}>{heading.title}</a>
            <ul className={`ml-6`}>
              {heading.items.length > 0 && heading.items.map(child => (
                <li key={child.id} className={'text-lg pl-3'}>
                  <a href={`#${child.id}`} className={'no-underline text-gray-400'}>{child.title}</a>
                </li>
              ))}
            </ul>
          </li>
        ))}
        <svg className="toc-marker absolute top-0 left-0 w-full h-full -z-10" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <path className="transition-all duration-300" stroke="#444" stroke-width="3" fill="transparent" stroke-dasharray="0, 0, 0, 1000" stroke-linecap="round" stroke-linejoin="round" transform="translate(-0.5, -0.5)" />
        </svg>
      </ul>
    </nav>
  )
}