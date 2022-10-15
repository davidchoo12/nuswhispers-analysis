import React from 'react'
import { useMemo } from 'react'

// adapted from https://www.freecodecamp.org/news/build-a-custom-pagination-component-in-react/

export const DOTS = '...'

const range = (start, end) => {
  let length = end - start + 1
  return Array.from({ length }, (_, idx) => idx + start)
}

const usePagination = ({
  totalCount,
  pageSize,
  siblingCount = 1,
  currentPage
}) => {
  const paginationRange = useMemo(() => {
    const totalPageCount = Math.ceil(totalCount / pageSize)

    // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
    const totalPageNumbers = siblingCount + 5

    /*
      If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPageCount]
    */
    if (totalPageNumbers >= totalPageCount) {
      return range(1, totalPageCount)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPageCount
    )

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
      let rightRange = range(
        totalPageCount - rightItemCount + 1,
        totalPageCount
      )
      return [firstPageIndex, DOTS, ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex)
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex]
    }
  }, [totalCount, pageSize, siblingCount, currentPage])

  return paginationRange
}

function PaginationButton({ children, selected=false, disabled=false, onClick }) {
  return (
    <button className={`border-2 transition py-1.5 px-6 m-0.5 rounded-full font-semibold disabled:opacity-50 ${selected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-none border-blue-200'} ${!selected && !disabled ? 'hover:bg-blue-100' : ''} ${disabled ? 'pointer-events-none' : ''}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}

export default function Pagination({
  onPageChange,
  totalCount,
  siblingCount = 1,
  currentPage,
  pageSize,
}) {
  console.log('in pagination')
  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize
  })

  console.log(currentPage, paginationRange)
  if (currentPage === 0 || paginationRange.length < 2) {
    return null
  }

  let lastPage = paginationRange[paginationRange.length - 1]
  return (
    <div>
      <PaginationButton
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage-1)}
      >
        &#8249;
      </PaginationButton>
      {paginationRange.map(pageNumber => {
        if (pageNumber === DOTS) {
          return <PaginationButton disabled>…</PaginationButton>
        }

        return (
          <PaginationButton
            selected={pageNumber === currentPage}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </PaginationButton>
        )
      })}
      <PaginationButton
        disabled={currentPage === lastPage}
        onClick={() => onPageChange(currentPage+1)}
      >
        &#8250;
      </PaginationButton>
      {/* <li
        className={`pagination-item ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <span className="text-base">&#8249;</span>
      </li>
      {paginationRange.map(pageNumber => {
        if (pageNumber === DOTS) {
          return <li className="pagination-item dots">…</li>
        }

        return (
          <li
            className={`pagination-item ${pageNumber === currentPage ? 'selected' : ''}`}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </li>
        )
      })}
      <li
        className={`pagination-item ${currentPage === lastPage ? 'disabled' : ''}`}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span className="text-base">&#8250;</span>
      </li> */}
    </div>
  )
}
