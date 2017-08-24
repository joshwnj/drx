/* global test, expect */

const x = require('../src')
const renderer = require('react-test-renderer')

test('Div with class', () => {
  const Component = x.div('some-class')
  const tree = renderer.create(
    Component()
  ).toJSON()

  expect(tree).toMatchSnapshot()
})
