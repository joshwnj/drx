/* global describe, it, expect */

import x from '../src'
import renderer from 'react-test-renderer'
import React, { createElement } from 'react'

function render (type, props) {
  return renderer.create(
    createElement(type, props)
  ).toJSON()
}

describe('Classes', () => {
  it('with no classes', () => {
    const Component = x({})
    expect(render(Component)).toMatchSnapshot()
  })

  it('with a single class', () => {
    const Component = x({
      className: 'some-class'
    })
    expect(render(Component)).toMatchSnapshot()
  })

  it('with multiple classes', () => {
    const Component = x({
      className: [
        'some-class', 'another-class'
      ]
    })
    expect(render(Component)).toMatchSnapshot()
  })
})

describe('Attributes', () => {
  it('not rendered on a wrapper component', () => {
    const Component = x({
      id: 'default-id',
      'data-name': 'Default name'
    })
    expect(render(Component)).toMatchSnapshot()
  })

  it('rendered on an element', () => {
    const Component = x.div({
      id: 'default-id',
      'data-name': 'Default name'
    })
    expect(render(Component)).toMatchSnapshot()
  })

  it('rendered on an element with parent props', () => {
    const Component = x.div({
      id: 'default-id',
      'data-name': 'Default name'
    })
    expect(
      render(Component, {
        id: 'custom-id',
        'data-name': 'Custom name'
      })
    ).toMatchSnapshot()
  })

  it('passed from wrapper component to element', () => {
    const Component = x({
      id: 'default-id',
      'data-name': 'Default name'
    })

    Component.children(
      x.span({
        id: Component.id,
        'data-attr': 'Other custom attr'
      })
    )

    expect(render(Component)).toMatchSnapshot()
  })
})
