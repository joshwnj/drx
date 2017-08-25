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
    const Component = x.div('some-class')
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

describe('Basic conditional rendering', () => {
  const Component = x.div()
    .renderIf('active')
    .props('children')

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

describe('Conditional rendering by function', () => {
  const Component = x.div()
    .renderIf(p => p.a + p.b > 10)
    .props('children')

  it('with sum of props greater than 10', () => {
    expect(
      render(Component, { a: 9, b: 2, children: 'hi' })
    ).toMatchSnapshot()
  })

  it('with sum of props less than 10', () => {
    expect(
      render(Component, { a: 1, b: 8, children: 'hi' })
    ).toMatchSnapshot()
  })
})

describe('Passing props', () => {
  const Image = x.img()
    .props('src', 'alt')

  const Text = x.span()
    .props('children')

  const Component = x.div()
    .content(
      Text,
      Image
    )

  it('passes props to child components', () => {
    expect(
      render(Component, { src: 'awyis.gif', alt: 'aw yis', children: 'a gif' })
    ).toMatchSnapshot()
  })
})
