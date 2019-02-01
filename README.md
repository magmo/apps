<h1 align="center">
<div><img src="./orange_fireball.svg"> </div>
Magmo Apps
<!-- <hr> -->
</h1>
Welcome to the Magmo mono-repo, home of several proof-of-concept applications built on our state channel protocols.

## For more information
On our [website](https://magmo.com) you will find links to our whitepapers and contact information. Whether you simply want to try
out our apps, or get involved more deeply we would love to hear your thoughts. Deployed versions of our games may be accessed with these links:

* [Rock Paper Scissors](https://demo.magmo.com) (RPS)
* [Tic Tac Toe](https://ttt.magmo.com) (TTT)

## Setting up development environment and running a game application
You will need `yarn` installed (see [here](https://yarnpkg.com/lang/en/docs/install/) for instructions).
1. In the top directory, run `yarn install`.
2. In the top directory, run `npx lerna bootstrap`.
3. Run the wallet via `yarn start` in the `wallet` package directory
4. Run a game (either RPS or TTT) via `yarn start` in the relevant package directory.

### Documentation
We are working hard to produce documenation for our applications. In the interm, please see our [Developer Handbook](https://magmo.gitbook.io/developer-handbook/), which as some of the hints and tips
for developing on ethereum that we have used to develop our apps. You will also find some information in the `/notes/` subdirectory of each app. 


