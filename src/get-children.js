const { createElement } = require('react')

module.exports = function getChildren (list, content, props) {
  if (!list) {
    return content ? content(props) : null
  }

  const { prop, type } = list
  return props[prop].map((item, key) => (
    typeof item === 'object' ? item : createElement(
      type,
      Object.assign({ key }, item)
  )))
}
