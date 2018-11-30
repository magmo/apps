export enum SingleMarks {
    tl = 1 << 8,
    tm = 1 << 7,
    tr = 1 << 6,
  
    ml = 1 << 5,
    mm = 1 << 4,
    mr = 1 << 3,
  
    bl = 1 << 2,
    bm = 1 << 1,
    br = 1 << 0,
  
    nn = 0
  };
  
  export type Marks = SingleMarks | SingleMarks;  // union type (not sure if this is doing anything uesful...)