const { createElement, PureComponent, DOM } = require('react')

function selectProps (keys, props) {
  if (!keys) { return {} }

  const selectedProps = {}
  keys.forEach(k => {
    const t = typeof k

    switch (t) {
      case 'string':
        if (!(k in props)) {
          console.warn(k, 'not found in props')
        }
        selectedProps[k] = props[k]
        break

      case 'object':
        if (k.from && k.to) {
          selectedProps[k.to] = k.func ? k.func(props[k.from]) : props[k.from]
        }
        break
    }
  })

  return selectedProps
}

function shouldRender (cond, props) {
  if (!cond) { return true }

  const t = typeof cond
  switch (t) {
    case 'string':
      return Boolean(props[cond])

    case 'function':
      return cond(props)

    default:
      console.warn('Unknown renderIf type:', cond)
  }
}

function getProps (self, props) {
  const newProps = selectProps(self.selected, props)

  if (!self.styles || newProps.className) {
    return newProps
  }

  const className = self.styles.join(' ')
  return Object.assign({}, newProps, { className })
}

function renderRoot (root) {
  return class DrxRoot extends PureComponent {
    constructor(props) {
      super(props)
    }

    render() {
      const props = this.props
      const self = root.__x

      if (!shouldRender(self.renderIf, props)) { return null }

      const children = self.content
            ? renderChildren(self.content, props) || []
            : []

      const newProps = getProps(self, props)
      return createElement(self.type, newProps, ...children)
    }
  }
}

function renderChild (ch, props) {
  return createElement(ch, getProps(ch.__x, props))
}

function renderChildren (children, props) {
  return children.map(ch => {
    if (ch.__x) {
      return shouldRender(ch.__x.renderIf, props)
        ? renderChild(ch, props)
        : null
    }

    if (typeof ch === 'function') {
      return createElement(ch, props)
    }

    return ch
  }).filter(Boolean)
}

function x (type, ...styles) {
  const self = {
    type,
    styles
  }

  const DrxComponent = class extends PureComponent {
    constructor(props) {
      super(props)
    }

    render() {
      const props = this.props
      const children = self.content
        ? renderChildren(self.content, props) || []
        : []

      return createElement(type, props, ...children)
    }
  }

  const c = DrxComponent

  // select which props should be passed in
  c.select = function (...keys) {
    self.selected = keys
    return c
  }

  // declare child components
  c.content = function (...components) {
    self.content = components
    return c
  }

  // condition to decide whether to render the component based on parent props
  c.renderIf = function (func) {
    self.renderIf = func
    return c
  }

  c.__x = self
  return c
}

const types = Object.keys(DOM)
types.forEach(type => {
  x[type] = (...styles) => x(type, ...styles)
})

x.rename = (from, to, func) => ({ from, to, func })
x.transform = (key, func) => ({ from: key, to: key, func })
x.root = renderRoot

module.exports = x
