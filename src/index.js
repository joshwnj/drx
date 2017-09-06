import { createElement, PureComponent, DOM } from 'react'

const ensureArray = v => Array.isArray(v) ? v : [ v ]

function createPropRef (component, key) {
  const def = component.__x

  // the prop ref is a setter function
  // with metadata about the prop & component class
  const PropRef = (...args) => {
    // special case: children and className can have multiple values
    def.props[key] = (key === 'children' || key === 'className')
      ? args
      : args[0]

    return component
  }
  PropRef.__x_ref = { key, def }
  return PropRef
}

function resolveProp (parent, ref) {
  const { key } = ref
  const last = parent.lastProps
  const deps = last._dependencies || {}

  return last[key] || deps[key]
}

function collectDependencies (content, parent, result = {}) {
  // no content: terminate with result
  if (!content) { return result }

  function collectFromDef (def) {
    Object.keys(def.props).forEach(k => {
      const p = def.props[k]
      const ref = p.__x_ref

      if (ref) {
        if (ref.def === parent.def) {
          result[ref.key] = p
        }
        return
      }

      const from = p.__x_from
      if (from) {
        from.forEach(p => {
          const ref = p.__x_ref
          if (ref) {
            if (ref.def === parent.def) {
              result[ref.key] = p
            }
            return
          }
        })
      }
    })

    // recurse
    if (def.props.children) {
      collectDependencies(def.props.children, parent, result)
    }
  }

  ensureArray(content)
    .map(ch => ch.__x)
    .filter(Boolean)
    .forEach(collectFromDef)

  return result
}

function resolveProps (parent, source, props) {
  // default: no props
  if (!source) { return {} }

  const newProps = {}
  Object.keys(source).forEach(k => {
    const p = source[k]

    // add 1 or more props to the signature,
    // and possibly run them through a reducer:
    const from = p.__x_from
    if (from) {
      const fromValues = {}
      from.forEach(f => {
        const ref = f.__x_ref
        if (ref) {
          fromValues[ref.key] = resolveProp(parent, ref)
          return
        }

        if (typeof f === 'function') {
          newProps[k] = f(fromValues)
          return
        }

        console.warn('Unknown argument in drx.from():', f)
      })

      return
    }

    const ref = p.__x_ref
    if (ref) {
      newProps[k] = resolveProp(parent, ref)
      return
    }

    // special case: we only want to use `props.className` and `props.children` from parent when opted in
    if (k === 'children' || k === 'className') {
      newProps[k] = p
      return
    }

    const t = typeof p
    switch (t) {
      case 'boolean':
      case 'string':
      case 'number':
      case 'function':
        newProps[k] = props[k] || p
        return

      default:
        console.warn('Unknown propref type:', k, p)
        return
    }
  })

  // delete undefined props
  Object.keys(newProps).forEach(k => {
    if (newProps[k] === undefined) { delete newProps[k] }
  })

  return newProps
}

// declare a component by its props
function create (def) {
  class DrxComponent extends PureComponent {
    constructor (props) {
      super(props)
      this.def = def
    }

    getChild (Component, props) {
      const def = Component.__x

      // find all props dependencies from sub-children
      // so we can make sure the props are passed down
      const dependencies = collectDependencies(def.props.children, this)
      const hasDependencies = Object.keys(dependencies).length > 0

      // select props for the child
      const childProps = resolveProps(this, def.props, props)

      if (hasDependencies) {
        const resolvedDeps = resolveProps(this, dependencies, props)
        Object.keys(resolvedDeps).forEach(k => {
          if (k in childProps) {
            childProps[k] = resolvedDeps[k]
          }
        })

        childProps._dependencies = resolvedDeps
      }

      // if this is an element, with no prop dependencies,
      // we can render the element directly rather than wrapping it
      // in a DrxComponent
      const needsWrapper = !def.elem || hasDependencies

      return needsWrapper
        ? createElement(Component, childProps)
        : createElement(def.type, childProps)
    }

    getChildren (props) {
      const { def } = this

      // need to make sure we return an array so it can be spread
      // (otherwise strings get split)
      if (!def.props.children) {
        return ensureArray(props.children)
      }

      const resolveChild = (ch) => {
        if (!ch) { return null }

        if (ch.__x) { return this.getChild(ch, props) }

        // recurse
        if (typeof ch === 'function') {
          return resolveChild(ch(props))
        }

        // default: return the child as-is
        return ch
      }

      const children = ensureArray(def.props.children).map(resolveChild)

      if (children.length === 1 && Array.isArray(children[0])) {
        return children[0]
      } else {
        return children || [ props.children ]
      }
    }

    mergeDefaultProps () {
      const { def, props } = this
      const newProps = Object.assign({}, props)

      // look at the component definition to get defaults or dependencies
      Object.keys(def.props).forEach(k => {
        if (newProps[k] === undefined) {
          newProps[k] = def.props[k]
        }
      })

      // special case: className
      if (newProps.className) {
        const join = (val) => Array.isArray(val) ? val.join(' ') : val

        // resolve dynamic classnames
        newProps.className = ensureArray(newProps.className).map(c => {
          if (c.__x_from) {
            return c.__x_from.reduce((acc, value) => {
              const ref = value.__x_ref
              if (ref) {
                acc[ref.key] = newProps[ref.key]
                return acc
              }

              if (typeof value === 'function') {
                return join(value(Object.assign({}, newProps, acc)))
              }
            }, {})
          }

          if (typeof c === 'function') {
            return join(c(newProps))
          }

          return join(c)
        })

        // create a string
        newProps.className = newProps.className.join(' ')
      }

      return newProps
    }

    render () {
      const propsWithDefaults = this.mergeDefaultProps()

      // render-tree stuff needs to go on the instance, not on the class
      this.lastProps = Object.assign({}, propsWithDefaults)

      // children get original props, not translated props
      const children = this.getChildren(propsWithDefaults) || []

      if (!def.type) {
        const { className } = propsWithDefaults
        const props = className ? { className } : {}
        return createElement('div', props, ...children)
      }

      // we don't want the `_dependencies` prop if it's an element
      if (def.elem) {
        delete propsWithDefaults._dependencies
      }

      return createElement(def.type, propsWithDefaults, ...children)
    }
  }

  const c = DrxComponent

  c.__x = def

  // expose the prop references
  Object.keys(def.props).forEach(k => {
    c[k] = createPropRef(c, k)
  })

  const keys = ['children', 'className']
  keys.forEach(k => {
    if (!c[k]) {
      c[k] = createPropRef(c, k)
    }
  })

  return c
}

const x = (props) => create({ props })

x.from = (...refs) => ({  __x_from: refs })

const types = Object.keys(DOM)
types.forEach(type => {
  x[type] = (props) => create({ type, props, elem: true })
})

export default x
