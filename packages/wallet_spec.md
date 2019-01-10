## What is the role of the magmo channel wallet?
 
The magmo channel wallet is a piece of software that sits between an application and the other players in the channel. In the same way that metamask is an interface to the blockchain, the magmo channel wallet (statestash?) is an interface to the state channel itself, and allows the application to conform to the ForceMove protocol (and shortly, the turbo and nitro protocols).

It is responsible for constructing, signing, recieving and storing states that *could* be submitted to an adjudicator on chain. 

In RPS and TTT, there are a number of points in the user flow where the wallet is necessary. This document aims to specify where these are and how the app should interact with the wallet. 

