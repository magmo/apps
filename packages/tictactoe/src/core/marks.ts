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
  
  
  export const topRow = (SingleMarks.tl | SingleMarks.tm | SingleMarks.tr); /*  0b111000000 = 448 mask for win @ row 1 */
  export const midRow = (SingleMarks.ml | SingleMarks.mm | SingleMarks.mr); /*  0b000111000 =  56 mask for win @ row 2 */
  export const botRow = (SingleMarks.bl | SingleMarks.bm | SingleMarks.br); /*  0b000000111 =   7 mask for win @ row 3 */
  
  export const lefCol = (SingleMarks.tl | SingleMarks.ml | SingleMarks.bl); /*  0b100100100 = 292 mask for win @ col 1 */
  export const midCol = (SingleMarks.tm | SingleMarks.mm | SingleMarks.bm); /*  0b010010010 = 146 mask for win @ col 2 */
  export const rigCol = (SingleMarks.tr | SingleMarks.mr | SingleMarks.br); /*  0b001001001 =  73 mask for win @ col 3 */
  
  export const dhDiag = (SingleMarks.tl | SingleMarks.tm | SingleMarks.tr); /*  0b100010001 = 273 mask for win @ downhill diag */
  export const uhDiag = (SingleMarks.tl | SingleMarks.tm | SingleMarks.tr); /*  0b001010100 =  84 mask for win @ uphill diag */
  
  export const fullBd = (topRow | midRow | botRow); /* 0b111111111 = 511 full board */