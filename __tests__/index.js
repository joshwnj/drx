/* global describe, it, expect */

import x from '../src'
import renderer from 'react-test-renderer'
import { createElement } from 'react'

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

  it('with conditional classes', () => {
    const Component = x({
      className: [
        'base-class',
        p => p.big ? 'big' : 'small'
      ]
    })
    expect(render(Component)).toMatchSnapshot()
    expect(render(Component, { big: true })).toMatchSnapshot()
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

describe('Props', () => {
  it('selected from parent', () => {
    const Outer = x({
      className: 'outer',
      imageUrl: 'the-image.jpg',
      caption: 'The Image'
    })

    const Inner1 = x.img({
      src: Outer.imageUrl,
      alt: Outer.caption
    })

    const Inner2 = x.span({
      children: Outer.caption
    })

    Outer.children(Inner1, Inner2)

    expect(render(Outer)).toMatchSnapshot()
  })

  it('selected from grandparent', () => {
    const Outer = x({
      className: 'outer',
      imageUrl: 'the-image.jpg',
      caption: 'The Image'
    })

    const Outer2 = x({
      className: 'outer-2'
    })

    const Inner1 = x.img({
      src: Outer.imageUrl,
      alt: Outer.caption
    })

    const Inner2 = x.span({
      children: Outer.caption
    })

    Outer.children(
      Outer2.children(
        Inner1,
        Inner2
      )
    )

    expect(render(Outer)).toMatchSnapshot()
  })
})

describe('Reducing', () => {
  it('a single prop with a transform function', () => {
    const Root = x({
      className: 'root',
      imageUrl: 'the-image.jpg',
      caption: 'The Image'
    })

    const Image = x.img({
      src: x.from(Root.imageUrl, p => `http://example.com/${p.imageUrl}`),
      alt: Root.caption
    })

    Root.children(Image)

    expect(render(Root)).toMatchSnapshot()
  })

  it('multiple props with a transform function', () => {
    const Root = x({
      className: 'root',
      imageUrl: 'the-image.jpg',
      caption: 'The Image',
      secure: false
    })

    const Wrapper = x({
      className: 'wrapper'
    })

    const Image = x.img({
      src: x.from(Root.imageUrl, Root.secure, p => (
        `${p.secure ? 'https' : 'http'}://example.com/${p.imageUrl}`
      )),
      alt: Root.caption
    })

    Root.children(
      Wrapper.children(
        Image
      )
    )

    expect(render(Root)).toMatchSnapshot()
    expect(render(Root, { secure: true })).toMatchSnapshot()
  })
})

describe('Conditional rendering', () => {
  it('using a child-function', () => {
    const Root = x({
      className: 'root',
      imageUrl: '',
      caption: ''
    })

    const Image = x.img({
      src: Root.imageUrl,
      alt: Root.caption
    })

    Root.children(
      p => p.imageUrl && Image
    )

    expect(render(Root)).toMatchSnapshot()
    expect(render(Root, { imageUrl: 'the-image.jpg' })).toMatchSnapshot()
  })
})

describe('Default values', () => {
  it('with wrapper component', () => {
    const Root = x({
      children: 'default text'
    })

    expect(render(Root)).toMatchSnapshot()
    expect(render(Root, { children: 'custom text' })).toMatchSnapshot()
  })

  it('with changed defaults', () => {
    const Root = x.div({
      'data-text': 'default text'
    })

    Root['data-text']('default text 2')

    expect(render(Root)).toMatchSnapshot()
    expect(render(Root, { 'data-text': 'custom text' })).toMatchSnapshot()
  })
})
