module.exports = function renderStyles (self, props) {
  if (props.className) { return props.className }

  const styles = self.styles
  const classes = []

  function groupAll (styles) {
    if (!Array.isArray(styles)) {
      classes.push(styles)
      return
    }

    styles.forEach(s => {
      (typeof s === 'function') ? groupAll(s(props)) : groupAll(s)
    })
  }

  groupAll(styles)

  return classes.join(' ')
}
