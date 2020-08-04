import { useContext, useState, useEffect } from "react";
import { ControllerContext } from "src/components/controller";
import ItemGrid from "./item-grid";

import "./pause-menu.less";

export default function PauseMenu () {
  const ctx = useContext(ControllerContext);
  const { running, unPause } = ctx;

  // when pausing, detect use of the escape key to un-pause
  useEffect(() => {
    const unPauseListener = e => {
      if (e.key === "Escape") {
        unPause();
      }
    };
    window.addEventListener("keyup", unPauseListener);
    return () => window.removeEventListener("keyup", unPauseListener);
  }, [running]);

  if (running) {
    return null;
  }
  return (
    <div className="pause-overlay">
      <div className="pause-menu">
        <h2>Paused</h2>
        <div className="content">
          <div>
            <button onClick={unPause}>resume</button>
          </div>
          <ItemGrid/>
        </div>
      </div>
    </div>
  );
}
