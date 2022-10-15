import Heading from './Heading'

export default function Section({ children, title, level }) {
  return (
    <section className="py-3">
      <Heading title={title} level={level} />
      {children}
    </section>
  )
}