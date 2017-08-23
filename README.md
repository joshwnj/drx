# Dr. X

_Declarative React Experiments_

## Install

```
npm install --save drx
```

## Q. Is this ready to use in production?

Nope! Things are most likely going to change.

## Q. What is this? Is it even a good idea?

I'm still figuring that out :D But I'm discovering a lot of useful patterns arising from this idea of writing components (structure & logic) declaratively.

Take a look at the examples below if you're keen, and let me know what you think.

## Example: conditional rendering

We often write components that involve some display logic. Like a message that should only be rendered if it has children:

```js
export default function (props) {
  if (!props.children) { return null }

  return (
    <div className='message'>
      {props.children}
    </div>
  )
}
```

This is simple and easy enough to read, but can become unwieldy as components get larger and more complex.

We've also combined 2 concerns:

- _how_ to render the component
- _when_ to render the component

Not a big deal, as it's often convenient for those 2 concerns to be nearby. But could we declare these traits of the component, rather than writing them longhand?

```js
import x from 'drx'

const Message = x.div('message')
  .renderIf('children')

export default Message
```

Here we have:

- a functional component `Message`
- it renders a `<div>` with a className of `message`
- if the `children` prop is empty it will not render anything.

## Example: translating props

Another common bit of display logic in components is translating props from a parent to a child. For example, this component receives an `imageUrl` prop which becomes the `src` of a child image element:

```js
export default function (props) {
  const { children, imageUrl } = props
  
  return (
    <div className='message'>
      { imageUrl && <img src={imageUrl} className='message__image /> }
      <h1 className='message__heading'>{props.heading}</h1>
      <span className='message__text'>{ children }</span>
    </div>
  )
}
```

As before, we've got some display logic to say we don't want to render an `<img>` element if we don't have a src.

There are 3 prop translations happening in the example above:

1. `imageUrl` becomes the `src` of the image
1. `heading` becomes the `children` of the h1
1. `children` becomes the `children` of the span

We can declare that behaviour with `.props(...)`, and describe the nested structure with `.content(...)`:

```js
import x from 'drx'

const Image = x.img('message__image')
  .props({ src: 'imageUrl' })
  .renderIf('imageUrl')

const Heading = x.h1('message__heading')
  .props({ children: 'heading' })

Heading.defaultProps = {
  heading: 'Default Heading'
}

const Text = x.span('message__text')
  .props({ children: 'children' })

const Message = x.div('message')
  .content(
    Heading,
    Image,
    Text
  )

export default Message
```

Reading from the top:

- a functional component `Image`
  - renders an `<img>` with classname `message__image`
  - receives an `imageUrl` prop which becomes the `src` attribute of the `<img>`
  - if there is no `imageUrl` the `<img>` is not rendered at all

- a functional component `Heading`
  - renders an `<h1>` with classname `message__heading`
  - receives a `heading` prop which becomes the `children` of the `<h1>`

- a functional component `Text`
  - renders a `<span>` with classname `message__text`
  - adopts the `children` of the parent component as its own `children`

- a functional component `Message`
  - renders a `<div>` with classname `message`
  - contains a `Heading`, `Image` and `Text`, and automatically passes its props down to them.
