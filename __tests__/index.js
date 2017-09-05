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
