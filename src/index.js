const { createElement, DOM } = require('react')
const renderStyles = require('./render-styles')
const getChildren = require('./get-children')

function x (type, ...styles) {
  const self = {
    styles
  }

  function render (props) {
    if (self.renderIf) {
      if (!self.renderIf(props)) { return null }
    }

    const selfProps = self.props ? self.props(props) : {}

    const className = props.className || renderStyles(self.styles, props)

    // don't look for children if we've already had some assigned by .props()
    const children = selfProps && selfProps.children !== undefined
      ? null
      : getChildren(self.list, self.content, props)

    return createElement(
      type,
      Object.assign({ children, className }, selfProps)
    )
  }

  render.style = function (...styles) {
    self.styles = styles
    return render
  }

  render.content = function (...args) {
    self.content = (props) => {
      return args.map((a, key) => createElement(a, Object.assign({ key }, props)))
    }

    return render
  }

  render.renderIf = function (func) {
    // if we get a string, consider it to be the key of a prop
    if (typeof func === 'string') {
      self.renderIf = (p) => Boolean(p[func])
    }
    // TODO: make sure it's a function at this point
    else {
      self.renderIf = func
    }

    return render
  }

  render.props = function (func) {
    const t = typeof func

    // if we get an object, use it to map props
    if (t === 'object') {
      self.props = (p) => {
        const newProps = {}
        Object.keys(func).forEach(k => {
          const val = p[func[k]]
          if (val !== undefined) {
            newProps[k] = val
          }
          // children is a special case: we only want it to pass on if it's manually opted in
          else if (k === 'children') { newProps[k] = '' }
        })
        return newProps
      }
    }
    // if we get a string, that is the key of a sub-object
    else if (t === 'string') {
      self.props = (p) => p[func]
    }
    // TODO: make sure it's a function at this point
    else {
      self.props = func
    }

    return render
  }

  render.list = function (prop, type) {
    self.list = { prop, type }
    return render
  }
  
  return render
}

const types = Object.keys(DOM)
types.forEach(type => {
  x[type] = (...styles) => x(type, ...styles)
})

module.exports = x
