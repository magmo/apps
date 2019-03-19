<!-- Recommend VSCode plugin 
Name: Markdown Preview Mermaid Support
Id: bierner.markdown-mermaid
Description: Adds Mermaid diagram and flowchart support to VS Code's builtin markdown preview
Version: 1.1.2
Publisher: Matt Bierner
VS Marketplace Link: https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid -->
# Redux diagrams (current state)
as of commit 1947c682f74648ee162459314827bb9e24ca1fb1
### Methodology
These flowcharts are made by constructing nodes from the *state types* or (*stage types* where indicated), from the relevant file in a `/states/` directory, and then constructing edges from the relationships defined in the relevant `/reducers/` directory. Edges are labelled with the *action types* from the `/actions/` directory (or function calls such as other reducers), and the flowcharts suppress information about conditional checks that are performed by the reducers. Where useful, reducers have had their sub-reducers unpacked -- making for a fewer number of more complicated flowcharts. When a reducer returns the same state as the result of conditional checks failing, these loops are also suppressed. Globally handled actions are also sometimes suppressed.
<!-- TODO: consider using the actual `string` value of the types, rather than the variable name. -->
<!-- TODO: related to ^, consider enforcing this string to be *exactly* the same as the type variable name -->
<!-- TODO: use hyperlinks / anchors to make this document easier to navigate. -->


### Key: 
```mermaid
  graph LR
  linkStyle default interpolate basis
    STATE --> |ACTION| ANOTHER_STATE
    ANOTHER_STATE.->|functionCall| YET_ANOTHER_STATE
```
# Top level
## loginReducer
[`/packages/rps/src/redux/login/reducer.ts`](../src/redux/login/reducer.ts)
```mermaid
  graph TD
  linkStyle default interpolate basis
    loadingFALSE --> |LOGIN_REQUEST| loadingTRUE
    loadingFALSE --> |LOGOUT_REQUEST| loadingTRUE
```
<!-- etc -- doesn't fit in a flowchart so nicely. -->
## gameReducer
[`/packages/rps/src/redux/game/reducer.ts`](../src/redux/game/reducer.ts)
```mermaid
  graph TD
  linkStyle default interpolate basis
    NoName -->|UPDATE_PROFILE| Lobby

    Lobby -->|NEW_OPEN_GAME| CreatingOpenGame
    Lobby -->|JOIN_OPEN_GAME| WaitForConfirmationA

    CreatingOpenGame -->|CREATE_OPEN_GAME| WaitingRoom
    CreatingOpenGame -->|CANCEL_OPEN_GAME| Lobby

    WaitingRoom  -->|INITIAL_COMMITMENT_RECEIVED| ConfirmGameB
    WaitingRoom  -->|CANCEL_OPEN_GAME| Lobby

    WaitForGameConfirmationA --> WaitForFunding

    ConfirmGameB -->|CONFIRM_GAME| WaitForFunding
    ConfirmGameB -->|ANYTHING_ELSE| Lobby

    WaitForFunding -->|FUNDING_FAILURE| Lobby
    WaitForFunding -->|FUNDING_SUCCESS| PickWeapon

    PickWeapon -->|CHOOSE_WEAPON| WaitForOpponentToPickWeaponA
    PickWeapon -->|CHOOSE_WEAPON| WaitForOpponentToPickWeaponB

    WaitForOpponentToPickWeaponA -->|COMMITMENT_RECEIVED| PlayAgain
    WaitForOpponentToPickWeaponA -->|COMMITMENT_RECEIVED| GameOver
    WaitForOpponentToPickWeaponA -->|COMMITMENT_RECEIVED| Reveal

    WaitForOpponentToPickWeaponB -->|COMMITMENT_RECEIEVED| WaitForRevealB
    WaitForOpponentToPickWeaponB -->|COMMITMENT_RECEIEVED| Accept

    WaitForRevealB -->|COMMITMENT_RECEIEVED| GameOver
    WaitForRevealB -->|COMMITMENT_RECEIEVED| PlayAgain

    PlayAgain -->|PLAY_AGAIN| WaitForRestingA
    PlayAgain -->|PLAY_AGAIN| Resting
    PlayAgain -->|PLAY_AGAIN| PickWeapon

    WaitForRestingA -->|COMMITMENT_RECEIVED| PickWeapon

    GameOver -->|RESIGN| WaitForWithdrawal

    WaitForWithdrawal --> |RESIGN| Lobby




```