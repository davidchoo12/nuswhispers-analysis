import Heading from './Heading'

interface SectionProps {
  children: React.ReactNode
  title: string
  level: number
}

export default function Section({ children, title, level }: SectionProps) {
  return (
    <section className="py-3">
      <Heading title={title} level={level} />
      {children}
    </section>
  )
}