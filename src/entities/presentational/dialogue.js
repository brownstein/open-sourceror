import { Vector3 } from "three";

import "./dialogue.less";

export class DialogueEntity {
  constructor(position, text = null) {
    this.engine = null;

    this.text = text || ["Hello World!", "Welcome to Open Sourceror."];

    this.hoverPosition = new Vector3(position.x, position.y, 0);

    let textDivs;
    if (Array.isArray(this.text)) {
      textDivs = this.text.map((t, i) => <div key={i}>{t}</div>);
    }
    else {
      textDivs = <div>{this.text}</div>;
    }
    this.hoverElement = <div className="dialogue">
      { textDivs }
    </div>;
  }
}

export class DisappearingDialogue {
  constructor(position) {
    this.engine = null;
  }
}
