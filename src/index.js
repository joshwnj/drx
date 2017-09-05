import { createElement, PureComponent, DOM } from 'react'

function PropRef (component, key) {
  this.component = component
  this.def = component.__x
  this.key = key
}

function resolveProp (parent, ref) {
  return parent.lastProps[ref.key]
}

function collectDependencies (content, parent, result = {}) {
  // no content: terminate with result
  if (!content) { return result }

  function collectFromDef (def) {
    Object.keys(def.props).forEach(k => {
      const ref = def.props[k]

      if (ref instanceof PropRef) {
        if (ref.def === parent.def) {
          result[ref.key] = ref
        }
        return
      }

      if (ref.__x_from) {
        ref.__x_from.forEach(ref => {
          if (ref instanceof PropRef) {
            if (ref.def === parent.def) {
              result[ref.key] = ref
            }
            return
          }
        })
      }
    })

    // recurse
    if (def.content) {
      collectDependencies(def.content, parent, result)
    }
  }

  content.forEach(ch => {
    if (ch.__x) {
      return collectFromDef(ch.__x)
    }
  })

  return result
}

function getProps (parent, def, props) {
  const source = def.props

  // find all children of this component that have a dependency on this component's parent
  // so we can make sure the props are passed down
  const dependencies = collectDependencies(def.content, parent)
  Object.keys(dependencies).forEach(k => {
    source[k] = dependencies[k]
  })

  // TODO: complain if there are props that weren't declared

  // default: no props
  if (!source) { return {} }

  const newProps = {}
  Object.keys(source).forEach(k => {
    const ref = source[k]

    // add 1 or more props to the signature,
    // and possibly run them through a reducer:
    if (ref.__x_from) {
      const fromValues = {}
      ref.__x_from.forEach(from => {
        if (from instanceof PropRef) {
          fromValues[from.key] = resolveProp(parent, from)
          return
        }

        if (typeof from === 'function') {
          newProps[k] = from(fromValues)
          return
        }

        console.warn('Unknown argument in x.from:', from)
      })

      return
    }

    if (ref instanceof PropRef) {
      newProps[k] = resolveProp(parent, ref)
      return
    }

    // special case: we only want to use `props.className` and `props.children` from parent when opted in
    if (k === 'children' || k === 'className') {
      newProps[k] = ref
      return
    }

    const t = typeof ref
    switch (t) {
      case 'boolean':
      case 'string':
      case 'number':
      case 'function':
        newProps[k] = props[k] || ref
        return

      default:
        console.warn('Unknown propref type:', k, def)
        return
    }
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

      // children that are elements are created directly, with no wrapper
      return def.elem
        ? createElement(def.type, getProps(this, def, props))
        : createElement(Component, getProps(this, def, props))
    }

    getChildren (props) {
      const { def } = this

      // need to make sure we return an array so it can be spread
      // (otherwise strings get split)
      // TODO: consolidate this block with the return below
      if (!def.content) {
        return Array.isArray(props.children)
          ? props.children
          : [ props.children ]
      }

      const resolveChild = (ch) => {
        if (!ch) { return null }

        if (ch.__x) { return this.getChild(ch, props) }

        if (typeof ch === 'function') {
          return resolveChild(ch(props))
        }

        // default: return the child as-is
        return ch
      }

      const children = def.content.map(resolveChild)

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
        // normalize to be an array
        if (!Array.isArray(newProps.className)) {
          newProps.className = [ newProps.className ]
        }

        // TODO: resolve prop dependencies
        // ...

        const join = (val) => Array.isArray(val) ? val.join(' ') : val

        // resolve dynamic classnames
        newProps.className = newProps.className.map(c => {
          if (c.__x_from) {
            return c.__x_from.reduce((acc, value) => {
              if (value instanceof PropRef) {
                acc[value.key] = newProps[value.key]
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

      return createElement(def.type, propsWithDefaults, ...children)
    }
  }

  const c = DrxComponent

  c.__x = def

  // expose the prop references
  Object.keys(def.props).forEach(k => {
    c[k] = new PropRef(c, k)
  })

  c.children = function (...ch) {
    def.content = ch
    return c
  }

  return c
}

const x = (props) => create({ props })

x.from = (...refs) => ({  __x_from: refs })

const types = Object.keys(DOM)
types.forEach(type => {
  x[type] = (props) => create({ type, props, elem: true })
})

export default x
