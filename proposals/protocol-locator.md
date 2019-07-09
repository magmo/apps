# Proposal 1

On an action, the `protocolLocator` string's value should describe the path down the redux state tree, starting from the `protocolState` that is living on the `processState`.

## Example

Say some process state is

```
{
  ...
  protocolState: {
    foo: {
      protocol: 'Foo',
      waitingForBar: {
        protocol: 'Bar',
        ...
      },
      ...
    },
    secondBar: {
      protocol: 'Bar',
      ...
    }
  }
}
```

Then

- the protocol locator for the first `Bar` protocol should be `'foo/waitingForBar'`
- the protocol locator for the second `Bar` protocol should be `'secondBar'`

See below for an argument why this is preferred over using `'Foo/Bar'` and `'Bar'`

## Argument

Think about some abstract "funding" protocol that both the server and the client need to coordinate on

- Suppose the Foo protocol embeds two Bar protocols
- They both need to be able to route actions to the "first" Bar protocol
- Therefore, they agree that they will call that protocol "BarOne"
- And they then decide to route actions to that protocol by making the protocolLocator start with `"BarOne"`

The client is free to _store_ the protocols however it wants.
However, I argue that it makes sense to store the "BarOne" protocol under the key `"BarOne"`, because that key describes what it is.
In addition, this convention is _completely unambiguous_ -- no matter what other protocols there are, and no matter where they're embedded, if the protocol locator string is `'some/words/making/up/a/path'`, then the action should be routed to whatever protocol is stored at `processState.protocolState.some.words.making.up.a.path`

## Renaming

With this considered, I recommend we rename `protocolLocator` to `path`, in keeping with the anatomy of a URL.

## Development implications

The protocols should eventually be described or specified in a common-code package.
Right now, there is a "communication" module responsible for defining common code, but it is
specific to javascript projects.

In the short term, we can define specific `path` strings in a `protocol-paths.ts` file in the communication module.
Actions that have a `path` property should use one of these paths.
This partially specifies a protocol in that the server does not need to be refactored based on how the client chooses to store protocols.
