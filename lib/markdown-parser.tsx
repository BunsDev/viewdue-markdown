interface ParsedComponent {
  type: string
  props: Record<string, string>
  content: string
}

export function parseCustomComponents(markdown: string): {
  processedMarkdown: string
  components: ParsedComponent[]
} {
  const components: ParsedComponent[] = []
  let componentIndex = 0

  // Match custom components like <Card title="...">content</Card>
  const componentRegex = /<(Card|Callout|Accordion|Header|Steps|Carousel)([^>]*)>([\s\S]*?)<\/\1>/gi

  const processedMarkdown = markdown.replace(componentRegex, (match, type, propsString, content) => {
    const props: Record<string, string> = {}

    // Parse props from string like ' title="Hello" type="info"'
    const propsRegex = /(\w+)=["']([^"']*)["']/g
    let propMatch: RegExpExecArray | null
    while ((propMatch = propsRegex.exec(propsString)) !== null) {
      if (propMatch[1] !== undefined && propMatch[2] !== undefined) {
        props[propMatch[1]] = propMatch[2]
      }
    }

    components[componentIndex] = {
      type,
      props,
      content: content.trim(),
    }

    const placeholder = `__COMPONENT_${componentIndex}__`
    componentIndex++

    return placeholder
  })

  return { processedMarkdown, components }
}

export function generateComponentMarkdown(
  type: string,
  props: Record<string, string>,
  content = "Your content here...",
): string {
  const propsString = Object.entries(props)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ")

  switch (type) {
    case "Card":
      return `<Card ${propsString}>\n${content}\n</Card>`
    case "Callout":
      return `<Callout ${propsString}>\n${content}\n</Callout>`
    case "Accordion":
      return `<Accordion ${propsString}>\n${content}\n</Accordion>`
    case "Header":
      return `<Header ${propsString}>${content}</Header>`
    case "Steps":
      return `<Steps>\n1. First step\n2. Second step\n3. Third step\n</Steps>`
    case "Carousel":
      return `<Carousel images="image1.jpg,image2.jpg,image3.jpg" />`
    default:
      return `<${type} ${propsString}>\n${content}\n</${type}>`
  }
}
