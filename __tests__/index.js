/* global describe, it, expect */

const x = require('../src')
const renderer = require('react-test-renderer')
const { createElement } = require('react')

function render (type, props) {
  return renderer.create(
    createElement(type, props)
  ).toJSON()
}

describe('Classes', () => {
  it('with no classes', () => {
    const Component = x.div()
    expect(render(Component)).toMatchSnapshot()
  })

  it('with a single class', () => {
    const Component = x.div('some-class')
    expect(render(Component)).toMatchSnapshot()
  })

  it('with multiple classes', () => {
    const Component = x.div('some-class', 'another-class')
    expect(render(Component)).toMatchSnapshot()
  })
})

describe('Div with a conditional class', () => {
  const Component = x.div(
    'thing',
    p => p.big ? 'thing--big' : [ 'thing--small', 'small' ]
  )

  it('gets a single extra class with the prop flag', () => {
    expect(render(Component, { big: true })).toMatchSnapshot()
  })

  it('gets two extra classes without the prop flag', () => {
    expect(render(Component)).toMatchSnapshot()
  })
})
