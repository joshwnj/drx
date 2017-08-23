const { createElement } = require('react')

module.exports = function getChildren (list, content, props) {
  if (!list) {
    return content ? content(props) : props.children
  }

  const { prop, type } = list
  return props[prop].map((item, key) => createElement(
    type,
    Object.assign({ key }, item)
  ))
}
