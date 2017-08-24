module.exports = function createPropsFunc (arg, ...rest) {
  const t = typeof arg

  switch (t) {
    case 'object':
      // if we get a normal object, use it to map props
      return (p) => {
        const newProps = {}
        Object.keys(arg).forEach(k => {
          const val = p[arg[k]]
          if (val !== undefined) {
            newProps[k] = val
          } else if (k === 'children') {
            // children is a special case: we only want it to pass on if it's manually opted in
            newProps[k] = ''
          }
        })
        return newProps
      }

    // if we get a string, that is the key of a sub-object
    case 'string':
      return (p) => {
        const newProps = {}
        newProps[arg] = p[arg]
        rest.forEach(function (k) { newProps[k] = p[k] })
        return newProps
      }

    default:
      // TODO: make sure it's a function at this point
      return arg
  }
}
