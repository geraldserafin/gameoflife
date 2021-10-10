import { Cell, QuadTree, Rectangle } from "./quadTree";

export function setCell(x, y, tree) {
  tree.insert(new Cell(x, y, 1, 0));

  for (let i = x - 1; i < x + 2; i++) {
    for (let j = y - 1; j < y + 2; j++) {
      if (i != x || j != y) {
        tree.insert(new Cell(i, j, 0, 1));
      }
    }
  }
}

export function initializeRandomBoard(x) {
  let boundary = new Rectangle(x / 2, x / 2, x, x);
  let board = new QuadTree(boundary, 1);

  for (let i = 0; i < (x * x) / 2; i++) {
    let a = Math.round(Math.random() * x);
    let b = Math.round(Math.random() * x);
    setCell(a, b, board);
  }

  return board;
}

export function nextGeneration(board) {
  let newBoard = new QuadTree(board.boundary, board.capacity);
  let points = [];

  // query all points on the board
  // modifies points array
  board.query(board.boundary, points, false);
  console.log(points);

  points.forEach((point) => {
    if (point.state == 1) {
      if (point.neighbours >= 2 && point.neighbours <= 3) {
        newBoard.insert(new Cell(point.x, point.y, 1, 0));
      }
    } else {
      if (point.neighbours == 3) {
        newBoard.insert(new Cell(point.x, point.y, 1, 0));
      }
    }
  });

  return newBoard;
}
