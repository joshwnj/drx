const { createElement, DOM } = require('react')
const renderStyles = require('./render-styles')
const getChildren = require('./get-children')
const createPropsFunc = require('./create-props-func')

function x (type, ...styles) {
  const self = {
    styles
  }

  function render (props = {}) {
    if (self.renderIf) {
      if (!self.renderIf(props)) { return null }
    }

    const selfProps = self.props ? self.props(props) : {}

    const className = props.className || renderStyles(self.styles, props)

    // don't look for children if we've already had some assigned by .props()
    const children = selfProps && selfProps.children !== undefined
      ? null
      : getChildren(self.list, self.content, props)

    const elem = createElement(
      type,
      Object.assign({ children, className }, selfProps)
    )

    if (self.defaultProps) {
      elem.defaultProps = self.defaultProps
    }

    return elem
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
    } else {
      // TODO: make sure it's a function at this point
      self.renderIf = func
    }

    return render
  }

  render.props = function (...args) {
    self.props = createPropsFunc(...args)
    return render
  }

  render.defaultProps = function (props) {
    self.defaultProps = props
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
