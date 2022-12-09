import Heading from './Heading'

interface SectionProps {
  children: React.ReactNode
  title: string
  level: number
}

export default function Section({ children, title, level }: SectionProps) {
  const levelMargin: Record<number, string> = {
    1: 'my-24',
    2: 'my-12',
  }
  return (
    <section className={levelMargin[level]}>
      <Heading title={title} level={level} />
      {children}
    </section>
  )
}
