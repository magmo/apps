# Channel Management Protocol

The channel management protocol is a simple protocol that allows users to manage their ledger channels with the hub.

The user should be able to close channels with the hub and withdraw their funds.

## State Machine

```mermaid
graph TD
linkStyle default interpolate basis
  S((Start)) --> DC(DisplayChannels)
  DC-->|StopDisplayChannels|SS((success))
  classDef logic fill:#efdd20;
  classDef Success fill:#58ef21;
  classDef Failure fill:#f45941;
  classDef WaitForChildProtocol stroke:#333,stroke-width:4px,color:#ffff,fill:#333;
  class S,E,MT logic;
  class SS Success;
  class F Failure;
  class D,CU WaitForChildProtocol;
```
