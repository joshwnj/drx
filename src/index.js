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

    // record which keys have been changed
    def.changed[key] = true

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
    const propDef = def.props
    Object.keys(propDef).forEach(k => {
      const p = propDef[k]

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
          }
        })
      }
    })

    // recurse
    if (propDef.children) {
      collectDependencies(propDef.children, parent, result)
    }
  }

  ensureArray(content)
    .map(ch => ch.__x)
    .filter(Boolean)
    .forEach(collectFromDef)

  ensureArray(content)
    .map(ch => ch.__x_list)
    .filter(Boolean)
    .forEach(list => {
      const ref = list.ref.__x_ref
      if (ref.def === parent.def) {
        result[ref.key] = list.ref
      }
    })

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
          newProps[k] = f(Object.assign({}, props, fromValues))
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
  const propDef = def.props
  def.changed = {}

  class DrxComponent extends PureComponent {
    constructor (props) {
      super(props)
      this.def = def
      this.propDef = propDef
    }

    getChild (Component, props) {
      const def = Component.__x
      if (!def) {
        console.error('Not a valid DrxComponent', Component)
        return null
      }

      const propDef = def.props

      // find all props dependencies from sub-children
      // so we can make sure the props are passed down
      const dependencies = collectDependencies(propDef.children, this)
      const hasDependencies = Object.keys(dependencies).length > 0

      // select props for the child
      const childProps = resolveProps(this, propDef, props)

      if (hasDependencies) {
        const resolvedDeps = resolveProps(this, dependencies, props)
        Object.keys(resolvedDeps).forEach(k => {
          if (k in childProps) {
            childProps[k] = resolvedDeps[k]
          }
        })

        childProps._dependencies = resolvedDeps
      }

      const list = (childProps.children && childProps.children.__x_list)
      if (list) {
        const items = resolveProp(this, list.ref.__x_ref)
        childProps.children = items.map((item, i) => (
          this.getChild(list.component, Object.assign({ key: i }, item))
        ))
      if (childProps.children) {
        childProps.children = ensureArray(childProps.children).reduce((acc, child) => {
          const list = child.__x_list
          if (!list) {
            acc.push(child)
            return acc
          }

          const items = resolveProp(this, list.ref.__x_ref)

          return acc.concat(items.map((item, i) => (
            this.getChild(list.component, Object.assign({ key: i }, item))
          )))
        }, [])
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

      const resolveChild = (ch) => {
        if (!ch) { return null }

        if (ch.__x) { return this.getChild(ch, props) }

        if (ch.__x_ref) {
          return resolveProp(this, ch.__x_ref)
        }

        const list = ch.__x_list
        if (list) {
          const items = resolveProp(this, list.ref.__x_ref)

          return items.map((item, i) => (
            this.getChild(list.component, Object.assign({ key: i }, item))
          ))
        }

        // recurse
        if (typeof ch === 'function') {
          return resolveChild(ch(props))
        }

        // default: return the child as-is
        return ch
      }

      // children have already been resolved
      if (props.children && !def.changed.children) {
        // TODO: handle __x_from

        return ensureArray(props.children)
      }

      const children = ensureArray(propDef.children).map(resolveChild)

      if (children.length === 1 && Array.isArray(children[0])) {
        return children[0]
      } else {
        return children || [ props.children ]
      }
    }

    mergeDefaultProps () {
      const { props, propDef } = this

      const newProps = Object.assign({}, props)

      // look at the component definition to get defaults or dependencies
      Object.keys(propDef).forEach(k => {
        if (newProps[k] === undefined) {
          newProps[k] = propDef[k]
        }
      })

      const propReducer = (acc, value) => {
        const ref = value.__x_ref
        if (ref) {
          acc[ref.key] = newProps[ref.key]
          return acc
        }

        if (typeof value === 'function') {
          return value(Object.assign({}, newProps, acc))
        }
      }

      // resolve x.from values
      Object.keys(newProps).forEach(k => {
        const value = newProps[k]
        const info = value.__x_from
        if (!info) { return }

        newProps[k] = info.reduce(propReducer, {})
      })

      // special case: className
      if (newProps.className) {
        const join = (val) => Array.isArray(val) ? val.join(' ') : val

        // resolve dynamic classnames
        newProps.className = ensureArray(newProps.className).map(c => {
          const info = c.__x_from
          if (info) {
            return join(info.reduce(propReducer, {}))
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
        const props = {}
        const keys = [ 'className', 'style' ]
        keys.forEach(k => {
          const v = propsWithDefaults[k]
          if (v === undefined || v === null || v === '') { return }
          props[k] = v
        })
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

x.from = (...refs) => ({ __x_from: refs })

x.list = (ref, component) => ({
  __x_list: { ref, component }
})

const types = Object.keys(DOM)
types.forEach(type => {
  x[type] = (props) => create({ type, props, elem: true })
})

export default x
