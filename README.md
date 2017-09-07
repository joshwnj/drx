# Dr. X

_Declarative React Experiments_

[![Build Status](https://secure.travis-ci.org/joshwnj/drx.png)](http://travis-ci.org/joshwnj/drx)

## Install

```
npm install --save drx
```

## Let's see the example right away pls

[-> codepen](https://codepen.io/joshwnj/pen/zdLree?editors=0011#)

## Q. Is this ready to use in production?

Nope! Things are most likely going to change.

## Q. What is this? Is it even a good idea?

I'm still figuring that out :D But I'm discovering a lot of useful patterns arising from this idea of writing components (structure & logic) declaratively.

In short, the goal is to provide a way of creating components by describing the dependencies between their props.

Take a look at the examples below if you're keen, and let me know what you think.

## Getting started

Let's start with the simplest possible example:

```js
import x from 'drx'

export default x({
  className: 'message',
  children: ''
})
```

This is the rough equivalent of:

```js
import React, { PureComponent } from 'react'

export default class extends PureComponent {
  render () {
    const { children, className } = this.props

    return (
      <div className={className || 'message'}>
        {children}
      </div>
    )
  }
}
```

So we saved a few lines by using `drx`. That won't always be the case, sometimes we'll end up with more lines than a traditional approach. But I hope we can get to the point of gaining much more value from those extra lines.

## Example: translating props

A common bit of display logic in components is translating props from a parent to a child. For example, this component receives an `imageUrl` prop which becomes the `src` of a child image element:

```jsx
import React, { PureComponent } from 'react'

export default class extends PureComponent {
  render () {
    const { children, imageUrl } = this.props

    return (
      <div className='message'>
        { imageUrl && <img src={imageUrl} className='message__image' /> }
        <h1 className='message__heading'>{props.heading || 'Default Heading'}</h1>
        <span className='message__text'>{ children }</span>
      </div>
    )
  }
}
```

There are 3 prop translations happening in the example above:

1. `imageUrl` becomes the `src` of the image
1. `heading` becomes the `children` of the h1 (with fallback to a default value)
1. `children` becomes the `children` of the span

We've also got some display logic to say we don't want to render an `<img>` element if we don't have an `imageUrl`.

To write the above with `drx` we'll get something like this:

```js
import x from 'drx'

const Root = x({
  className: 'message',
  imageUrl: '',
  children: '',
  heading: 'Default Heading'
})

const Image = x.img({
  className: 'message__image',
  src: Root.imageUrl
})

const Heading = x.h1({
  className: 'message__heading',
  children: Root.heading
})

const Text = x.span({
  className: 'message__text',
  children: Root.children
})

Root.children(
  Heading,
  props => props.imageUrl && Image,
  Text
)

export default Root
```

Reading from the top:

- a component `Root`, with some default props

- a component `Image`
  - renders an `<img>` with classname `message__image`
  - maps the `Root.imageUrl` prop to the `src` attribute of the `<img>`

- a component `Heading`
  - renders an `<h1>` with classname `message__heading`
  - maps the `Root.heading` prop to the heading's `children`. If no `heading` prop is provided to `Root`, we'll get the default heading value from `Root`'s definition.

- a component `Text`
  - renders a `<span>` with classname `message__text`
  - adopts the `children` of the `Root` component as its own `children`

- finally we tell `Root` to render with `Heading`, `Image` and `Text` as its children
  - `Image` will only be rendered if we have a truthy `imageUrl` prop

## Example: reducing props

Sometimes a child's prop is a function of 1 or more parent props. We can declare this with `x.from`. It both defines the dependency (ensuring that the props are passed down) and calls the function to transform or reduce the original values.

```
import x from 'drx'

const Root = x({
  caption: '',
  imageUrl: '',
  secure: false
})

const Text = x.div({
  children: x.from(Root.caption, p => p.caption.toUpperCase())
})

const Image = x.img({
  alt: Root.caption,
  src: x.from(
    Root.imageUrl, Root.secure,
    p => `${p.secure ? 'https' : 'http'}://example.com/${p.imageUrl}`
  )
})

export default Root.children(
  Image,
  Text
)
```

## Inspiration

- [recompose](https://github.com/acdlite/recompose)
- [styled-components](https://github.com/styled-components/styled-components)
