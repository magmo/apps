var TTT = artifacts.require("TicTacToehelpers");

contract('TicTacToehelpers', (accounts) => {

  let stateContract;

  before(async () => {
    TTT = await TTT.deployed();

  });

  it("Recognizes a winning 'marks' integer after 3 marks", async () => {
      assert.isTrue(await TTT.hasWon.call(0b111000000));
    });

  it("Recognizes a winning 'marks' integer after 4 marks", async () => {
    assert.isTrue(await TTT.hasWon.call(0b111000010));
  });

  it("Recognizes a winning 'marks' integer after 5 marks", async () => {
    assert.isTrue(await TTT.hasWon.call(0b000000000));
  });

  // it("Recognizes disjoint noughts and crosses", async () => {
  //   assert.isTrue(await TTT.areDisjoint.call(0b000000111,0b111000000));
  // });
//   it("Recognizes a winning 'marks' integer after 4 marks", function() {
//     TTT.new().then(function(instance) {
//       assert.true(instance.hasWon.call(0b100000111), "didn't recognize a winning 'marks' integer");
//     });
//   });
//   it("Recognizes a winning 'marks' integer after 5 marks", function() {
//     TTT.new(). then(function(instance) {
//       assert.true(instance.hasWon.call(0b000000000), "didn't recognize a winning 'marks' integer");
//     });
//   });
});

/* IN truffle develop console: truffle deploy, followed by TicTacToehelpers.at("0xa4392264a2d8c998901d10c154c91725b1bf0158").hasWon(0b111000000) returns  true */