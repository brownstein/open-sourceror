import {
  useState,
  useEffect
} from "react";
import {
  Box3,
  Box2,
  WebGLRenderer,
  Camera,
  OrthographicCamera,
  Scene,
  Vector3,
  Vector2
} from "three";

import "./item-grid.less";

export default function ItemGrid({
  slots = 64,
  width = 8
}) {

  const gridItems = [];
  for (let i = 0; i < slots; i++) {
    gridItems.push(
      <div key={i} className="grid-item">
        {i}
      </div>
    );
  }

  return (
    <div className="item-grid">
      {gridItems}
    </div>
  );
}
