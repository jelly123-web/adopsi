function Card({ children, className = '', ...props }) {
  return (
    <article className={`card panel ${className}`.trim()} {...props}>
      {children}
    </article>
  )
}

export default Card
