import Queue from "queue-fifo";
import PriorityQueue from "tinyqueue";
import { vec2 } from "p2";

const EMPTY_SPACE = 0;
const BLOCKED_SPACE = 1;
const ONE_WAY_PLATFORM = 2;
const NAV_NODE = 3;

const WALK = "walk";
const JUMP = "jump";
const JUMP_TO = "jump_to";
const FALL = "fall";
const FALL_TO = "fall_to";

const DEBUG = false;

// PLANS:
// - complete jump engine [doneish]
// - complete motion planning engine
// clean everything up

// /**
//  * Directional link class - represents a link between two NavAreas that may be
//  * uni-directional or bi-directional
//  */
// class NavLink {
//   static _id = 1;
//   static DISCONNECTED = 0;
//   static WALK_TO = 1;
//   static FALL_TO = 2;
//   static JUMP_TO = 3;
//   constructor(a, b) {
//     this.id = NavLink._id++;
//     this.a = a;
//     this.b = b;
//     this.aToBMethod = NavLink.DISCONNECTED;
//     this.bToAMethod = NAVLink.DISCONNECTED;
//     this.aToBCost = Infinity;
//     this.bToACost = Infinity;
//   }
//   setABConnectionMethodAndCost(method, cost) {
//     this.aToBMethod = method;
//     this.aToBCost = cost;
//   }
//   setBAConnectionMethodAndCost(method, cost) {
//     this.bToAMethod = method;
//     this.bToACost = cost;
//   }
//   setConnectionMethodAndCost(start, method, cost) {
//     if (start === this.a) {
//       this.setABConnectionMethodAndCost(method, cost);
//     }
//     else {
//       this.setBAConnectionMethodAndCost(method, cost);
//     }
//   }
//   getConnectionMethodAndCost(start) {
//     if (start === this.a) {
//       return [this.aToBMethod, this.aToBCost];
//     }
//     else {
//       return [this.bToAMethod, this.bToACost];
//     }
//   }
//   getOtherNode(start) {
//     return start === this.a ? this.b : this.a;
//   }
// }


export class CollisionBBox {
  constructor(xSize, ySize) {
    this.x = 0;
    this.y = 0;
    this.xSize = xSize;
    this.ySize = ySize;
    this.xMin = -xSize * 0.5;
    this.xMax = xSize * 0.5;
    this.yMin = -ySize * 0.5;
    this.yMax = ySize * 0.5;
  }
  containsPoint(point) {
    return (
      this.x + this.xMin <= point.x &&
      this.x + this.xMax >= point.x &&
      this.y + this.yMin <= point.y &&
      this.y + this.yMax >= point.y
    );
  }
  intersects(other) {
    if (this.x + this.xMin > other.x + other.xMax) {
      return false;
    }
    if (this.x + this.xMax < other.x + other.xMin) {
      return false;
    }
    if (this.y + this.yMin > other.y + other.yMax) {
      return false;
    }
    if (this.y + this.yMax < other.y + other.yMin) {
      return false;
    }
    return true;
  }
  clone() {
    const bbox = new CollisionBBox(this.xSize, this.ySize);
    bbox.x = this.x;
    bbox.y = this.y;
    return bbox;
  }
  centerOnPoint(pos) {
    this.x = pos.x;
    this.y = pos.y;
    return this;
  }
}

class NavBlockage extends CollisionBBox {
  constructor(xSize, ySize, type) {
    super(xSize, ySize);
    this.type = type;
  }
}

// const LINK_WALK = 1;
// const LINK_JUMP = 2;
//
// class NavNode {
//   constructor() {
//     this.type = NAV_NODE;
//     this.linksById = {};
//   }
//   linkBidirectionally(other) {
//
//   }
//   linkUnidirectionally(other) {
//
//   }
// }

class JumpPlanningCache {
  constructor(resolution = 1, vResolution = 0.1) {
    this.resolution = resolution;
    this.invResolution = 1 / resolution;
    this.vResolution = vResolution;
    this.invVResolution = 1 / vResolution;
    this.cache = {};
  }
  _key(x, y, vx, vy) {
    const rx = Math.round(x * this.invResolution);
    const ry = Math.round(y * this.invResolution);
    const rvx = Math.round(vx * this.invVResolution);
    const rvy = Math.round(vy * this.invVResolution);
    return `${rx}-${ry}-${rvx}-${rvy}`;
  }
  get(x, y, vx, vy) {
    return this.cache[this._key(x, y, vx, vy)] || null;
  }
  add(node) {
    const { x, y, vx, vy } = node;
    this.cache[this._key(x, y, vx, vy)] = node;
  }
}

class JumpPlanningNode {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.chainLength = 0;
    this.prevNode = null;
    this.distCost = 0;
    this.cost = 0;
  }
  copyLocationToBBox(bbox) {
    bbox.x = this.x;
    bbox.y = this.y;
  }
  distanceFrom(other) {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }
  velocityCost(other, gravity) {
    let x = this.x;
    let y = this.y;
    const vx = this.vx;
    let vy = this.vy;
    let leastDistToPoint = Infinity;
    for (let t = 0; t < 200; t++) {
      x += vx;
      y += vy + gravity / 2;
      vy += gravity;
      const dist = Math.abs(other.x - x) + Math.abs(other.y - y); // cheap
      if (dist < leastDistToPoint) {
        leastDistToPoint = dist;
      }
      else {
        break;
      }
    }

    return leastDistToPoint;
  }
}

class NavPlanningCache {
  constructor(resolution = 16) {
    this.resolution = resolution;
    this.invResolution = 1 / resolution;
    this.cache = {};
  }
  _key(x, y, vx, vy) {
    const rx = Math.round(x * this.invResolution);
    const ry = Math.round(y * this.invResolution);
    return `${rx}-${ry}`;
  }
  get(x, y) {
    return this.cache[this._key(x, y)] || null;
  }
  add(node) {
    const { x, y } = node;
    this.cache[this._key(x, y)] = node;
  }
}

class NavPlanningNode {
  constructor(x, y, action) {
    this.x = x;
    this.y = y;
    this.action = action;
    this.chainLength = 0;
    this.prevNode = null;
    this.distCost = 0;
    this.cost = 0;
    this.actionPlan = null;
  }
  distanceFrom(other) {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }
}

/**
 * Representation of movement capabilities for jump planning
 */
export class MovementCapabilities {
  constructor(
    xAcceleration,
    maxJumpVelocity,
    gravity
  ) {
    this.xAcceleration = xAcceleration;
    this.maxJumpVelocity = maxJumpVelocity;
    this.gravity = gravity;
  }
}

class NavGrid {
  constructor(grid, gridScale, gridWidth, gridHeight) {
    this.grid = grid;
    this.gridScale = gridScale;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    global.JumpPlanningCache = JumpPlanningCache;
    global.CollisionBBox = CollisionBBox;
  }
  /**
   * Checks a given bounding box for intersection with the grid
   */
  checkBBox(bbox, ignoreOneWay) {
    const gxMin = Math.max(
      0,
      Math.floor((bbox.x + bbox.xMin) / this.gridScale)
    );
    const gxMax = Math.min(
      this.gridWidth - 1,
      Math.floor((bbox.x + bbox.xMax) / this.gridScale)
    );
    const gyMin = Math.max(
      0,
      Math.floor((bbox.y + bbox.yMin) / this.gridScale)
    );
    const gyMax = Math.min(
      this.gridHeight - 1,
      Math.floor((bbox.y + bbox.yMax) / this.gridScale)
    );
    for (let x = gxMin; x <= gxMax; x++) {
      const column = this.grid[x];
      for (let y = gyMin; y <= gyMax; y++) {
        const block = column[y];
        if (block === null) {
          continue;
        }
        if (bbox.intersects(block) && (
          block.type === BLOCKED_SPACE ||
          (block.type === ONE_WAY_PLATFORM && !ignoreOneWay)
        )) {
          return true;
        }
      }
    }
    return false;
  }
  fitBBoxIntoGrid(bbox, leeway = 8, ignoreOneWay = true) {
    const { gridScale } = this;
    const { x: rawX, y: rawY, xMin, xMax, yMin, yMax } = bbox;
    const width = xMax - xMin;
    const height = yMax - yMin;

    bbox.x = (Math.floor(rawX / gridScale) + 0.5) * gridScale;
    bbox.y = (Math.floor(rawY / gridScale) + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.y = Math.floor((rawY - leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.x = Math.floor((rawX - leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.x = Math.floor((rawX + leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.y = Math.floor((rawY + leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.x = Math.floor((rawX - leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.x = Math.floor((rawX + leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.x = rawX;
    bbox.y = rawY;
    return false;
  }
  /**
   * Attempts to plan a jump through the grid
   */
  planJump(
    start,
    end,
    size,
    xAcceleration,
    maxJumpVelocity,
    gravity
  ) {
    const { grid, gridScale, gridWidth, gridHeight } = this;

    // figure out what scale of calculations we want to run on
    // half of grid size sounds reasonable
    const microScale = gridScale / 2;

    // set the time scale - this may be variable later
    const timeScale = 1 / 60;

    // calculated appropreately scaled motion parameters
    const scaledXAccelleration = xAcceleration * timeScale;
    const scaledMaxJumpVelocity = maxJumpVelocity * timeScale;
    const scaledGravity = gravity * (timeScale * timeScale);

    // find the start point and end point in terms of grid location
    const startBBox = new CollisionBBox(size.x - 1, size.y - 1);
    const endBBox = new CollisionBBox(size.x - 1, size.y - 1);
    startBBox.x = start.x;
    startBBox.y = start.y;
    endBBox.x = end.x;
    endBBox.y = end.y;
    if (!this.fitBBoxIntoGrid(startBBox)) {
      return null;
    }
    if (!this.fitBBoxIntoGrid(endBBox)) {
      return null;
    }

    // create a bounding box for use in ongoing collision checking
    const checkBBox = startBBox.clone();
    const expandedBBox = new CollisionBBox(size.x + 2, size.y + 2);
    expandedBBox.centerOnPoint(checkBBox);

    // find range of apexes
    const lowestApexPossible = (end.y < start.y) ? start.y - end.y : 0;
    const highestApexPossible = 0.5 *
      (scaledMaxJumpVelocity ** 2) /
      scaledGravity;

    // set up expansion queue
    const cache = new JumpPlanningCache(microScale, scaledXAccelleration);
    const frontier = new PriorityQueue([], (a, b) => a.cost - b.cost);

    function addInitialJump(vy) {
      const node = new JumpPlanningNode(startBBox.x, startBBox.y, 0, vy);
      node.cost = node.distanceFrom(endBBox);
      node.cost += node.velocityCost(endBBox, scaledGravity);
      frontier.push(node);
    }

    // seed initial frontier with usable initial jumps
    addInitialJump(scaledMaxJumpVelocity);
    for (let apex = lowestApexPossible; apex < highestApexPossible; apex += microScale) {
      const apexVelocity = -Math.sqrt(scaledGravity * apex * 2);
      addInitialJump(apexVelocity);
    }

    // define expansion function
    const scaledGridWidth = gridWidth * gridScale;
    const scaledGridHeight = gridHeight * gridScale;
    const expand = (prevNode, x, y, vx, vy) => {

      // bounds check
      if (
        x < 0 ||
        x >= scaledGridWidth ||
        y < 0 ||
        y >= scaledGridHeight
      ) {
        return;
      }

      // check cache
      if (Math.abs(vx) + Math.abs(vy) >= scaledXAccelleration) {
        if (cache.get(x, y, vx, vy)) {
          return;
        }
      }

      // collision check
      checkBBox.x = x;
      checkBBox.y = y;
      if (this.checkBBox(checkBBox, vy < 0)) {
        return;
      }

      // cost calculation
      const nextNode = new JumpPlanningNode(x, y, vx, vy);
      nextNode.prevNode = prevNode;
      nextNode.distCost = prevNode.distCost + nextNode.distanceFrom(prevNode);
      nextNode.cost = nextNode.distCost + nextNode.distanceFrom(endBBox) +
        nextNode.velocityCost(endBBox, scaledGravity);
      expandedBBox.x = x;
      expandedBBox.y = y;
      nextNode.cost += this.checkBBox(expandedBBox, vy < 0) ? 2 : 0;

      // misc
      nextNode.chainLength = prevNode.chainLength + 1;

      // add to frontier
      cache.add(nextNode);
      frontier.push(nextNode);
    };

    let cycles = 0;
    let finalNode = null;
    let bestNode = frontier.peek();
    while (frontier.peek() && cycles++ < 2000) {
      const nextNode = frontier.pop();
      if (nextNode.cost < bestNode.cost) {
        bestNode = nextNode;
      }
      checkBBox.x = nextNode.x;
      checkBBox.y = nextNode.y;
      if (checkBBox.containsPoint(endBBox)) {
        finalNode = nextNode;
        break;
      }
      const y = nextNode.y + nextNode.vy + scaledGravity;// * 0.5;
      const vy = nextNode.vy + scaledGravity;
      for (let dvx = -1; dvx <= 1; dvx++) {
        const x = nextNode.x + nextNode.vx + dvx * scaledXAccelleration;// * 0.5;
        const vx = nextNode.vx + dvx * scaledXAccelleration;
        expand(nextNode, x, y, vx, vy);
      }
    }

    if (!finalNode) {
      return null;
    }

    const nodePath = [];
    let node = finalNode;
    while (node !== null) {
      node.vx = node.vx / timeScale;
      node.vy = node.vy / timeScale;
      nodePath.push(node);
      node = node.prevNode;
    }

    nodePath.reverse();
    return nodePath;
  }
  getPossibleJumps(
    entityBBox,
    plotXSpread,
    plotYSpread,
    xAcceleration,
    maxJumpVelocity,
    gravity,
    jumpCache
  ) {
    const { grid, gridScale, gridWidth, gridHeight } = this;
    const { x: xStart, y: yStart, xSize, ySize } = entityBBox;

    // TODO: snap to grid centers
    let xMin = Math.max(
      0.5 * gridScale,
      entityBBox.x - plotXSpread
    );
    let xMax = Math.min(
      (this.gridWidth - 0.5) * this.gridScale,
      entityBBox.x + plotXSpread
    );
    let yMin = Math.max(
      0.5 * gridScale,
      entityBBox.y - plotYSpread
    );
    let yMax = Math.min(
      (this.gridHeight - 1.5) * this.gridScale,
      entityBBox.y // + plotYSpread
    );

    const jumps = [];

    const invGridScale = 1/ gridScale;
    for (let x = xMin; x <= xMax; x += gridScale) {
      for (let y = yMin; y < yMax; y += gridScale) {
        const gridX = Math.floor(x * invGridScale);
        const gridY = Math.floor(y * invGridScale);
        const topBlock = grid[gridX][gridY];
        const bottomBlock = grid[gridX][gridY + 1];
        let bottomLeftBlock = null;
        let bottomRightBlock = null;
        if (gridX >= 1) {
          bottomLeftBlock = grid[gridX - 1][gridY + 1];
        }
        if (gridX < gridWidth - 1) {
          bottomRightBlock = grid[gridX + 1][gridY + 1];
        }
        if (
          topBlock ||
          !bottomBlock ||
          (bottomLeftBlock && bottomRightBlock)
        ) {
          continue;
        }
        if (jumpCache.get(x, y)) {
          continue;
        }
        const jumpPlan = this.planJump(
          entityBBox,
          { x, y },
          { x: entityBBox.xSize, y: entityBBox.ySize },
          xAcceleration,
          maxJumpVelocity,
          gravity
        );
        if (jumpPlan) {
          jumps.push({ x, y, jumpPlan });
          jumpCache.add({ x, y });
        }
      }
    }

    return jumps;
  }
  planPath(
    start,
    end,
    size,
    xAcceleration,
    maxJumpVelocity,
    gravity
  ) {
    const { grid, gridScale, gridWidth, gridHeight } = this;

    // find the start point and end point in terms of grid location
    const startBBox = new CollisionBBox(size.x - 1, size.y - 1);
    const endBBox = new CollisionBBox(size.x - 1, size.y - 1);
    startBBox.x = start.x;
    startBBox.y = start.y;
    endBBox.x = end.x;
    endBBox.y = end.y;
    if (!this.fitBBoxIntoGrid(startBBox)) {
      return null;
    }
    if (!this.fitBBoxIntoGrid(endBBox)) {
      return null;
    }

    // create a bounding box for use in collision detection
    const planningBBox = startBBox.clone();

    // create start node
    const startNode = new NavPlanningNode(startBBox.x, startBBox.y, null);
    startNode.cost = startNode.distanceFrom(endBBox);

    // create the cache and expansion queue
    const planCache = new NavPlanningCache(gridScale);
    const jumpCache = new NavPlanningCache(gridScale);
    const frontier = new PriorityQueue([], (a, b) => a.cost - b.cost);

    frontier.push(startNode);

    const scaledGridWidth = gridWidth * gridScale;
    const scaledGridHeight = gridHeight * gridScale;
    const expand = (prevNode, x, y, action, actionPlan) => {

      // bounds check
      if (
        x < 0 ||
        x >= scaledGridWidth ||
        y < 0 ||
        y >= scaledGridHeight
      ) {
        return;
      }

      // check cache
      if (planCache.get(x, y)) {
        return;
      }

      const nextNode = new NavPlanningNode(x, y, action);
      nextNode.prevNode = prevNode;
      nextNode.distCost = prevNode.distCost + nextNode.distanceFrom(prevNode);
      nextNode.cost = nextNode.distCost + nextNode.distanceFrom(endBBox) * 0.1;
      nextNode.chainLength = prevNode.chainLength + 1;
      nextNode.actionPlan = actionPlan;
      planCache.add(nextNode);
      frontier.push(nextNode);
    };

    let cycles = 0;
    let finalNode = null;
    let bestNode = null;
    let bestNodeCost = Infinity;
    while (frontier.peek() && cycles++ < 2000) {
      const nextNode = frontier.pop();
      const { x, y } = nextNode;
      planningBBox.x = x;
      planningBBox.y = y;
      if (planningBBox.containsPoint(endBBox)) {
        finalNode = nextNode;
        break;
      }
      if (this.checkBBox(planningBBox, false)) {
        continue;
      }
      if (nextNode.cost < bestNodeCost) {
        bestNode = nextNode;
        bestNodeCost = nextNode.cost;
      }
      planningBBox.y = nextNode.y + gridScale;
      const onGround = this.checkBBox(planningBBox, false);
      if (onGround) {
        expand(nextNode, x - gridScale, y, WALK);
        expand(nextNode, x + gridScale, y, WALK);
        planningBBox.x = nextNode.x;
        planningBBox.y = nextNode.y;
        const jumps = this.getPossibleJumps(
          planningBBox,
          80,
          80,
          xAcceleration,
          maxJumpVelocity,
          gravity,
          jumpCache
        );
        jumps.forEach(jump => {
          expand(nextNode, jump.x, jump.y, JUMP, jump.jumpPlan);
        });
      }
      else {
        expand(nextNode, x, y + gridScale, FALL);
      }
    }

    if (!finalNode) {
      return null;
    }

    const nodePath = [];
    let node = finalNode;
    while (node !== null) {
      nodePath.push(node);
      node = node.prevNode;
    }

    nodePath.reverse();
    return nodePath;
  }
}

export function getNavGridForTileGrid(
  sourceGridArr,
  gridWidth,
  tileSize,
  tileset,
  useTileTypes=["ground", "oneWayPlatform"]
) {
  const gridHeight = sourceGridArr.length / gridWidth;

  // map tile definitions by ID for faster reference
  const tileDefsById = {};
  for (let ti = 0; ti < tileset.tiles.length; ti++) {
    const tileDef = tileset.tiles[ti];
    tileDefsById[tileDef.id] = tileDef;
  }

  // preprocess block lookup table
  const grid = [];
  for (let x = 0; x < gridWidth; x++) {
    grid[x] = [];
  }
  for (let bi = 0; bi < sourceGridArr.length; bi++) {
    const sourceVal = sourceGridArr[bi];
    const x = bi % gridWidth;
    const y = Math.floor(bi / gridWidth);
    const column = grid[x];
    if (!sourceVal) {
      column.push(null);
      continue;
    }
    const tileDef = tileDefsById[sourceVal - 1];
    if (!tileDef) {
      column.push(null);
      continue;
    }
    if (useTileTypes.includes(tileDef.type)) {
      const blockType = tileDef.type === "oneWayPlatform" ?
        ONE_WAY_PLATFORM :
        BLOCKED_SPACE;
      const block = new NavBlockage(tileSize, tileSize, blockType);
      block.x = (x + 0.5) * tileSize;
      block.y = (y + 0.5) * tileSize;
      column.push(block);
    }
    else {
      column.push(null);
    }
  }

  // swap relevant nulls for navigation nodes
  // for (let x = 0; x < gridWidth; x++) {
  //   const column = grid[x];
  //   for (let y = 0; y < gridHeight - 1; y++) {
  //     const block = column[y];
  //     const nextBlock = column[y + 1];
  //     if (nextBlock && !block) {
  //       column[y] = new NavNode(x * gridScale, y * gridScale);
  //     }
  //   }
  // }

  // stitch grid adjacencies
  // for (let x = 0; x < gridWidth - 1; x++) {
  //   const column = grid[x];
  //   const nextColumn = grid[x + 1];
  //   for (let y = 0; y < gridHeight - 1; y++) {
  //     const block = column[y];
  //     const rightBlock = nextColumn[y];
  //     if (
  //       !block ||
  //       !rightBlock ||
  //       !block.type !== NAV_NODE ||
  //       !rightBlock.type !== NAV_NODE
  //     ) {
  //       continue;
  //     }
  //   }
  // }

  // return a shiny new nagivation grid
  return new NavGrid(grid, tileSize, gridWidth, gridHeight);
}
