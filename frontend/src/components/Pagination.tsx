import React, { useEffect, useRef, useState } from 'react'
import { useMemo } from 'react'

// adapted from https://www.freecodecamp.org/news/build-a-custom-pagination-component-in-react/

const DOTS = '...' as const
type ButtonLabel = typeof DOTS | number

const range = (start: number, end: number) => {
  let length = end - start + 1
  return Array.from({ length }, (_, idx) => idx + start)
}

const usePagination = ({
  totalCount,
  pageSize,
  siblingCount = 1,
  currentPage,
}: {
  totalCount: number
  pageSize: number
  siblingCount: number
  currentPage: number
}) => {
  const paginationRange = useMemo<ButtonLabel[]>((): ButtonLabel[] => {
    const totalPageCount = Math.ceil(totalCount / pageSize)
    // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
    const totalPageNumbers = siblingCount + 5
    /*
      If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPageCount]
    */
    if (totalPageCount <= totalPageNumbers) {
      return range(1, totalPageCount)
    }
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPageCount)
    /*
      We do not want to show dots if there is only one position left 
      after/before the left/right page count as that would lead to a change if our Pagination
      component size which we do not want
    */
    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2
    const firstPageIndex = 1
    const lastPageIndex = totalPageCount

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount
      let leftRange = range(1, leftItemCount)
      return [...leftRange, DOTS, totalPageCount]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount
      let rightRange = range(totalPageCount - rightItemCount + 1, totalPageCount)
      return [firstPageIndex, DOTS, ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex)
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex]
    }

    return []
  }, [totalCount, pageSize, siblingCount, currentPage])

  return paginationRange
}

interface PaginationButtonProps {
  className?: string
  children: React.ReactNode
  selected?: boolean
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

function PaginationButton({ className, children, selected = false, disabled = false, onClick }: PaginationButtonProps) {
  return (
    <button
      className={`border-2 border-r-0 border-emerald-600 transition py-1.5 w-11 my-1 font-semibold disabled:opacity-50 ${
        selected ? 'bg-emerald-600 text-white' : 'bg-none'
      } ${!selected && !disabled ? 'hover:bg-emerald-200 hover:dark:bg-emerald-800' : ''} ${
        disabled ? 'pointer-events-none' : ''
      } ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface PaginationProps {
  onPageChange: (value: number) => any
  totalCount: number
  siblingCount?: number
  currentPage: number
  pageSize: number
}

export default function Pagination({
  onPageChange,
  totalCount,
  // siblingCount = 10,
  currentPage,
  pageSize,
}: PaginationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [siblingCount, setSiblingCount] = useState<number>(1)
  useEffect(() => {
    const buttonWidth = 44 // class w-11 = 44px
    // total buttons = 2 * siblingCount + 7 (left, first, dot, siblings, curr, siblings, dot, last, right)
    // total width = total buttons * button width
    // siblingCount = (total width / button width - 7) / 2
    function fitPaginationButtons() {
      console.log('fitting pagination buttons')
      if (!containerRef.current?.clientWidth) {
        return
      }
      let targetSiblingCount = Math.floor((Math.floor(containerRef.current?.clientWidth / buttonWidth) - 7) / 2)
      setSiblingCount(targetSiblingCount)
    }
    const observer = new ResizeObserver(fitPaginationButtons)
    observer.observe(document.body)

    return () => {
      observer.disconnect()
    }
  }, [])
  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize,
  })

  if (currentPage === 0 || paginationRange.length < 2) {
    return null
  }

  const lastPage = paginationRange[paginationRange.length - 1]

  return (
    <div ref={containerRef} className="my-5 text-center">
      <PaginationButton
        className="border-l-2 rounded-l-lg"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        &#8249;
      </PaginationButton>

      {paginationRange.map((pageNumber, i) => {
        if (pageNumber === DOTS) {
          return (
            <PaginationButton key={i} className="border-none" disabled>
              …
            </PaginationButton>
          )
        }
        return (
          <PaginationButton
            key={i}
            className={paginationRange?.[i + 1] === DOTS ? 'border-r-2' : ''}
            selected={pageNumber === currentPage}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </PaginationButton>
        )
      })}

      <PaginationButton
        className="border-r-2 rounded-r-lg"
        disabled={currentPage === lastPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        &#8250;
      </PaginationButton>
    </div>
  )
}

interface PaginationDropdownProps {
  onPageChange: (value: number) => any
  currentPage: number
  pageNames: string[]
}

export function PaginationDropdown({ onPageChange, currentPage, pageNames }: PaginationDropdownProps) {
  const lastPage = pageNames.length
  return (
    <div className="my-5 flex justify-center">
      <PaginationButton
        className="border-l-2 rounded-l-lg"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        &#8249;
      </PaginationButton>

      <select className="border-2 border-r-0 border-emerald-600 px-1.5 my-1 font-semibold bg-transparent">
        {pageNames.map((pageName, i) => (
          <option key={i} selected={i === currentPage} onClick={() => onPageChange(i)}>
            {pageName}
          </option>
        ))}
      </select>

      <PaginationButton
        className="border-r-2 rounded-r-lg"
        disabled={currentPage === lastPage - 1}
        onClick={() => onPageChange(currentPage + 1)}
      >
        &#8250;
      </PaginationButton>
    </div>
  )
}
