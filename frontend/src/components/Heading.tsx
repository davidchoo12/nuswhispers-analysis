import './Heading.css'

interface HeadingProps {
  title: string
  level: number
}
enum HeadingTag {
  h1 = 'h1',
  h2 = 'h2',
  h3 = 'h3',
  h4 = 'h4',
  h5 = 'h5',
  h6 = 'h6',
}

export default function Heading({ title, level }: HeadingProps) {
  const id = encodeURIComponent(title.toLowerCase().replace(/ /g, '-'))
  const Hx = `h${level}` as HeadingTag

  return (
    <header className="my-4">
      <Hx id={id} className={`inline text-center font-semibold`} style={{ scrollMarginTop: '2em' }}>
        {title}
      </Hx>
      <a href={'#' + id} className="text-2xl no-underline ml-3 opacity-30 transition" aria-label={title}>
        {/* src https://heroicons.com/ */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 inline -translate-y-1"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          />
        </svg>
      </a>
    </header>
  )
}
