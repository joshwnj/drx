const { createElement, PureComponent, DOM } = require('react')
const renderStyles = require('./render-styles')

function shouldRender (self, props) {
  const cond = self.renderIf
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

function getPropsFromSource (source, props) {
  // default: no props
  if (!source) { return {} }

  return typeof source === 'function'
    ? source(props) || {}
    : source
}

const getAttr = (self, props) => getPropsFromSource(self.attr, props)
const getProps = (self, props) => getPropsFromSource(self.props, props)

function elem (Component, props) {
  return createElement(Component, getProps(Component.__x, props))
}

function getChildren (self, props) {
  if (!self.content) { return [ props.children ] }

  const children = self.content.map(ch => {
    if (ch.__x) { return elem(ch, props) }

    if (typeof ch === 'function') {
      const ch1 = ch(props)
      if (!ch1) { return null }

      return ch1.__x
        ? elem(ch1, props)
        : ch1
    }

    // default: return the child as-is
    return ch
  })

  if (children.length === 1 && Array.isArray(children[0])) {
    return children[0]
  } else {
    return children || [ props.children ]
  }
}

function mergeDefaultProps (self, props) {
  return self.defaultProps
    ? Object.assign({}, self.defaultProps, props)
    : props
}

function x (type, ...styles) {
  const self = {
    type,
    styles,
    props: null,
    attr: null
  }

  class DrxComponent extends PureComponent {
    render () {
      const propsWithDefaults = mergeDefaultProps(self, this.props)
      const attr = getAttr(self, propsWithDefaults)

      Object.keys(attr).forEach(k => {
        if (typeof attr[k] === 'undefined') {
          console.warn('attr %s not found in props', k)
        }
      })

      if (!shouldRender(self, propsWithDefaults)) { return null }

      const className = renderStyles(self, propsWithDefaults)
      if (className) { attr.className = className }

      // children get original props, not translated props
      const children = getChildren(self, Object.assign({ className }, propsWithDefaults)) || []

      if (!self.type) {
        return (children.length === 1)
          ? children[0]
         : createElement('div', { className }, ...children)
      }

      return createElement(self.type || 'div', attr, ...children)
    }
  }

  const c = DrxComponent

  c.props = (props) => {
    if (typeof props === 'function') {
      self.props = props
      return c
    }

    if (!self.props || typeof self.props === 'function') { self.props = {} }
    Object.assign(self.props, props)
    return c
  }

  c.attr = (props) => {
    if (typeof props === 'function') {
      self.attr = props
      return c
    }

    if (!self.attr || typeof self.attr === 'function') { self.attr = {} }
    Object.assign(self.attr, props)

    return c
  }

  c.defaultProps = (props) => {
    self.defaultProps = props
    return c
  }

  c.style = (...styles) => {
    self.styles = self.styles.concat(styles)
    return c
  }

  c.content = (...items) => {
    self.content = items
    return c
  }

  c.list = (func, Component) => {
    return c.content((props) => (
      func(props).map((item, key) => (
        createElement(Component, Object.assign({ key }, item))
      ))
    ))
  }

  c.renderIf = (func) => {
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

module.exports = x
