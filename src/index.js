const { createElement, PureComponent, DOM } = require('react')
const renderStyles = require('./render-styles')

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

function selectProps (keys, props, shouldRename = false) {
  if (!keys) { return {} }

  const target = shouldRename ? 'to' : 'from'
  const newProps = {}
  keys.forEach(k => {
    const t = typeof k

    switch (t) {
      case 'string':
        if (!(k in props)) {
          console.warn(k, 'not found in props')
        }
        newProps[k] = props[k]
        break

      case 'object':
        if (k.from && k.to) {
          newProps[k[target]] = (shouldRename && k.func)
            ? k.func(props[k.from], props)
            : props[k.from]
        }
        break
    }
  })

  return newProps
}

function renameProps (keys, props) {
  return selectProps(keys, props, true)
}

function renderChildren ({ list, content }, props) {
  if (list) {
    const { key, type } = list
    const tSelf = type.__x

    return props[key].map((item, i) => {
      const selectedProps = selectProps(tSelf.selected, item)
      return createElement(type, Object.assign({ key: i }, selectedProps))
    })
  }

  if (!content) { return null }

  return content.map(ch => {
    const chSelf = ch.__x
    if (chSelf) {
      const selectedProps = selectProps(chSelf.selected, props)

      // select the list prop for the wrapper component,
      // but not for the element
      const list = chSelf.list
      if (list) {
        selectedProps[list.key] = props[list.key]
      }

      return createElement(ch, selectedProps)
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
    render () {
      const props = this.props

      if (!shouldRender(self.renderIf, props)) { return null }

      const children = renderChildren(self, props) || []
      const renamedProps = renameProps(self.selected, props)

      const className = renderStyles(self, props)
      if (className) { renamedProps.className = className }

      return createElement(type, renamedProps, ...children)
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

  c.list = function (key, type) {
    self.list = { key, type }
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

module.exports = x
