export interface Marks {
   // the first player has up to 9*7*5*3 = 945 different marks they can make
   // the second player has up to 8*6*4*2 = 384 different marks they can make
   // we won't give these all names!
   
  //  tl = 0, // 'top left' etc.
  //   tm = 1,
  //   tr = 2,
  //   ml = 3,
  //   mm = 4,
  //   mr = 5,
  //   bl = 6,
  //   bm = 7,
  //   br = 8
  }
  
// Unravelling of grid is as follows:
// 
//      0  |  1  |  2  
//   +-----------------+
//      3  |  4  |  5  
//   +-----------------+
//      6  |  7  |  8  
// 
// The representation for a single mark is 2**(8-index). 
// In binary notation: 
//
// e.g. noughts =   1 = 0b000000001
//      crosses = 128 = 0b010000000
// 
// corresponds to 
//
//         |  X  |     
//   +-----------------+
//         |     |     
//   +-----------------+
//         |      |  0  
// 
