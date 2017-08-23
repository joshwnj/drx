const cmz = require('cmz')

module.exports = function renderStyles (styles, props) {
  const rules = []
  const classes = []

  function group (s) {
    if (typeof s === 'string' && s.indexOf(':') > 0) {
      rules.push(s)
    }
    else {
      classes.push(s)
    }
  }

  function groupAll (styles) {
    if (!Array.isArray(styles)) { return group(styles) }

    styles.forEach(s => {
      (typeof s === 'function') ?  groupAll(s(props)) : group(s)
    })
  }

  groupAll(styles)

  if (rules.length > 0) {
    classes.push(cmz(rules))
  }

  return classes.join(' ')
}
