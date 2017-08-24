/* global test, expect, describe, it */

const x = require('../src')
const renderer = require('react-test-renderer')
const { createElement } = require('react')

function render (type, props) {
  return renderer.create(
    createElement(type, props)
  ).toJSON()
}

test('Div with class', () => {
  const Component = x.div('some-class')

  expect(render(Component)).toMatchSnapshot()
})

test('Div with multiple classes', () => {
  const Component = x.div('some-class', 'another-class')
  expect(render(Component)).toMatchSnapshot()
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

describe('Basic conditional rendering', () => {
  const Component = x.div().renderIf('active')

  it('with the prop flag', () => {
    expect(
      render(Component, { active: true, children: 'hi' })
    ).toMatchSnapshot()
  })

  it('without the prop flag', () => {
    expect(
      render(Component, { children: 'hi' })
    ).toMatchSnapshot()
  })
})
