export class Cell {
  constructor(x, y, state, neighbors) {
    this.x = x;
    this.y = y;
    this.state = state;
    this.neighbours = neighbors;
  }
}

export class Rectangle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  contains(point) {
    return (
      point.x > this.x - this.w &&
      point.x < this.x + this.w &&
      point.y > this.y - this.h &&
      point.y < this.y + this.h
    );
  }

  // intersects(range) {
  //   return (
  //     range.x - range.w > this.x + this.w ||
  //     range.x + range.w < this.x - this.w ||
  //     range.y - range.h > this.y + this.h ||
  //     range.y + range.h < this.y - this.h
  //   );
  // }
}

export class QuadTree {
  constructor(boundary, capacity) {
    this.boundary = boundary;
    this.capacity = capacity;

    this.points = [];
    this.divided = false;
  }

  subdivide() {
    let x = this.boundary.x;
    let y = this.boundary.y;
    let w = this.boundary.w / 2;
    let h = this.boundary.h / 2;

    let nwBoundary = new Rectangle(x - w, y - h, w, h);
    this.nw = new QuadTree(nwBoundary, this.capacity);

    let neBoundary = new Rectangle(x + w, y - h, w, h);
    this.ne = new QuadTree(neBoundary, this.capacity);

    let swBoundary = new Rectangle(x - w, y + h, w, h);
    this.sw = new QuadTree(swBoundary, this.capacity);

    let seBoundary = new Rectangle(x + w, y + h, w, h);
    this.se = new QuadTree(seBoundary, this.capacity);

    this.divided = true;
  }

  insert(point) {
    if (!this.boundary.contains(point)) return;
    if (this.alreadyContains(point)) return;

    if (this.points.length < this.capacity) {
      this.points.push(point);
    } else {
      if (!this.divided) this.subdivide();

      this.nw.insert(point);
      this.ne.insert(point);
      this.sw.insert(point);
      this.se.insert(point);
    }
  }

  query(range, points) {
    this.points.forEach((point) => {
      points.push(point);
    });

    if (this.divided) {
      this.ne.query(range, points);
      this.nw.query(range, points);
      this.se.query(range, points);
      this.sw.query(range, points);
    }
  }

  // Game of life specific Functions
  alreadyContains(point) {
    this.points.forEach((p) => {
      if (p.x == point.x && p.y == point.y) {
        p.neighbours += 1;
        return true;
      }
    });
    return false;
  }
}
