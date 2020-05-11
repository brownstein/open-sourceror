import clipping from "polygon-clipping";

const ANGLE_TOLERANCE = 0.05;
const DISTANCE_TOLERANCE = 1;

export function loadTileset (tilesetSrc) {
  const { tilewidth, tileheight } = tilesetSrc;
  const tileSquare = [[
    [0, 0],
    [tilewidth, 0],
    [tilewidth, tileheight],
    [0, tileheight]
  ]];
  const tiles = tilesetSrc.tiles.map(tileSrc => {
    const { id, type, objectgroup = null } = tileSrc;
    const tile = { id, type, sides: null, sideMapping: null };
    if (objectgroup && objectgroup.objects[0].polygon) {
      const object = objectgroup.objects[0];
      const rawPolygon = object.polygon.map(v => ([
        v.x + object.x,
        v.y + object.y
      ]));
      const clippedPolygons = clipping.intersection(tileSquare, [rawPolygon]);
      const clippedPolygon = clippedPolygons[0][0];
      const clippedPolygonLength = clippedPolygon.length - 1;
      const sides = [];
      const sideMapping = {};
      for (let vi = 0; vi < clippedPolygonLength; vi++) {
        const v0 = clippedPolygon[vi];
        const v1 = clippedPolygon[(vi + 1) % clippedPolygonLength];
        const side = {
          x: v0[0],
          y: v0[1],
          dx: v1[0] - v0[0],
          dy: v1[1] - v0[1],
          name: vi
        };
        if (Math.abs(side.dy / side.dx) < ANGLE_TOLERANCE) {
          if (Math.abs(side.y) < DISTANCE_TOLERANCE) {
            side.name = "top";
            sideMapping.top = "top";
          }
          else if (Math.abs(side.y - tileheight) < DISTANCE_TOLERANCE) {
            side.name = "bottom";
            sideMapping.bottom = "bottom";
          }
        }
        else if (Math.abs(side.dx / side.dy) < ANGLE_TOLERANCE) {
          if (Math.abs(side.x) < DISTANCE_TOLERANCE) {
            side.name = "left";
            sideMapping.left = "left";
          }
          else if (Math.abs(side.x - tilewidth) < DISTANCE_TOLERANCE) {
            side.name = "right";
            sideMapping.right = "right";
          }
        }
        sides.push(side);
      }

      tile.sides = sides;
      tile.sideMapping = sideMapping;

      if (!sideMapping.top) {
        let closestSide = null;
        let minCost = Infinity;
        sides.forEach(side => {
          const pointCost = Math.min(side.y, side.y + side.dy);
          const sideLen = Math.sqrt(side.dx * side.dx + side.dy * side.dy);
          let angleCost = Math.abs(side.dy / sideLen);
          if (side.dx <= 0) {
            angleCost = Infinity;
          }
          const cost = pointCost + angleCost * sideLen;
          if (cost < minCost) {
            closestSide = side;
            minCost = cost;
          }
        });
        sideMapping.top = closestSide.name;
      }
      if (!sideMapping.bottom) {
        let closestSide = null;
        let minCost = Infinity;
        sides.forEach(side => {
          const pointCost = Math.min(-side.y, -side.y - side.dy);
          const sideLen = Math.sqrt(side.dx * side.dx + side.dy * side.dy);
          let angleCost = Math.abs(side.dy / sideLen);
          if (side.dx >= 0) {
            angleCost = Infinity;
          }
          const cost = pointCost + angleCost * sideLen;
          if (cost < minCost) {
            closestSide = side;
            minCost = cost;
          }
        });
        sideMapping.bottom = closestSide.name;
      }
      if (!sideMapping.left) {
        let closestSide = null;
        let minCost = Infinity;
        sides.forEach(side => {
          const pointCost = Math.min(side.x, side.x + side.dx);
          const sideLen = Math.sqrt(side.dx * side.dx + side.dy * side.dy);
          let angleCost = Math.abs(side.dx / sideLen);
          if (side.dy >= 0) {
            angleCost = Infinity;
          }
          const cost = pointCost + angleCost * sideLen;
          if (cost < minCost) {
            closestSide = side;
            minCost = cost;
          }
        });
        sideMapping.left = closestSide.name;
      }
      if (!sideMapping.right) {
        let closestSide = null;
        let minCost = Infinity;
        sides.forEach(side => {
          const pointCost = Math.min(-side.x, -side.x - side.dx);
          const sideLen = Math.sqrt(side.dx * side.dx + side.dy * side.dy);
          let angleCost = Math.abs(side.dx / sideLen);
          if (side.dy <= 0) {
            angleCost = Infinity;
          }
          const cost = pointCost + angleCost * sideLen;
          if (cost < minCost) {
            closestSide = side;
            minCost = cost;
          }
        });
        sideMapping.right = closestSide.name;
      }
    }
    return tile;
  });

  return {
    tiles,
    tilewidth,
    tileheight
  };
}
