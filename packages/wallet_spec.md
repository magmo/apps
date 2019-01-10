## What is the role of the magmo channel wallet?
 
The magmo channel wallet is a piece of software that sits between an application and the other players in the channel. In the same way that metamask is an interface to the blockchain, the magmo channel wallet (statestash?) is an interface to the state channel itself, and allows the application to conform to the ForceMove protocol (and shortly, the turbo and nitro protocols).

It is responsible for constructing, signing, recieving and storing states that *could* be submitted to an adjudicator on chain. 

In RPS and TTT, there are a number of points in the user flow where the wallet is necessary. This document aims to specify where these are and how the app should interact with the wallet. 

The wallet is almost its own mini-application. It has its own front end views/components, its own redux machinery (states, actions, reducers) as well as its own sagas. Of course it shares the store with the application, and currently this is how communication between app and wallet is achieved. In future this may change to a postmessage/onmessage communication between an iframe and its parent page. 

# Logging in to firebase
The first responsibility of the wallet is to manage the login of firebase, and the generation of an ephemeral key for the state channel in question. In firebase, we create a record under 'wallets' that has a title, and data including a uid, address and private key. 



