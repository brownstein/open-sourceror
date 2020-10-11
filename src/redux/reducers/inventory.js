import shortId from "shortid";
import {
  ADD_ITEM_TO_INVENTORY,
  REMOVE_ITEM_FROM_INVENTORY,
  MOVE_ITEM_IN_INVENTORY,
  ASSIGN_HOTKEY_TO_ITEM,
  USE_ITEM
} from "../constants/inventory";
import {
  SAVE_SCRIPT
} from "../constants/scripts";
import { LOAD_GAME } from "../constants/save-state";

import helloWorld from "raw-loader!src/in-game-scripts/hello-world.js";
import demo from "raw-loader!src/in-game-scripts/demo.js";
import laserDemo from "raw-loader!src/in-game-scripts/laser-demo.js";
import iceDemo from "raw-loader!src/in-game-scripts/ice-demo.js";

const INITIAL_STATE = {
  inventorySize: 20,
  inventory: [
    {
      id: shortId(),
      itemName: "Scroll",
      itemData: {
        color: "#ffa",
        scriptId: shortId(),
        scriptName: "demo",
        scriptContents: demo
      }
    },
    {
      id: shortId(),
      itemName: "Scroll",
      itemData: {
        color: "#acf",
        scriptId: shortId(),
        scriptName: "hello world",
        scriptContents: helloWorld
      }
    },
    {
      id: shortId(),
      itemName: "Scroll",
      itemData: {
        color: "#f00",
        scriptId: shortId(),
        scriptName: "laser demo",
        scriptContents: laserDemo
      }
    },
    {
      id: shortId(),
      itemName: "Scroll",
      itemData: {
        color: "#0af",
        scriptId: shortId(),
        scriptName: "ice demo",
        scriptContents: iceDemo
      }
    },
    { id: shortId(), itemName: "Medkit" },
    { id: shortId(), itemName: "Medkit" },
  ],
  numericHotkeyMap: {}
};

INITIAL_STATE.numericHotkeyMap['1'] = INITIAL_STATE.inventory[0].id;
INITIAL_STATE.numericHotkeyMap['2'] = INITIAL_STATE.inventory[1].id;
INITIAL_STATE.numericHotkeyMap['3'] = INITIAL_STATE.inventory[2].id;
INITIAL_STATE.numericHotkeyMap['4'] = INITIAL_STATE.inventory[3].id;

/**
 * Reducer for the player's inventory system
 */
export default function reduceInventory(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ADD_ITEM_TO_INVENTORY: {
      const itemName = action.itemName;
      const inventorySize = state.inventorySize;
      const inventory = [...state.inventory];
      for (let i = 0; i < inventorySize; i++) {
        if (!inventory[i]) {
          inventory[i] = {
            id: shortId(),
            itemName
          };
          break;
        }
      }
      return {
        ...state,
        inventory
      };
    }
    case REMOVE_ITEM_FROM_INVENTORY: {
      const { itemName, itemSlot } = action;
      const inventory = [...state.inventory];
      let removedItem = null;
      if (itemSlot) {
        removedItem = inventory[itemSlot];
        inventory[itemSlot] = null;
      }
      else {
        for (let i = 0; i < inventorySize; i++) {
          if (inventory[i] === itemName) {
            removedItem = inventory[i];
            inventory[i] = null;
            break;
          }
        }
      }
      const updatedHotkeyMap = { ...state.numericHotkeyMap };
      if (removedItem) {
        Object.keys(updatedHotkeyMap).forEach(hotkey => {
          const itemId = updatedHotkeyMap[hotkey];
          if (itemId === removedItem.id) {
            delete updatedHotkeyMap[hotkey];
          }
        });
      }
      return {
        ...state,
        inventory,
        numericHotkeyMap: updatedHotkeyMap
      };
    }
    case MOVE_ITEM_IN_INVENTORY: {
      const newInventory = [...state.inventory];
      const a = newInventory[action.fromSlot];
      const b = newInventory[action.toSlot] || null;
      newInventory[action.fromSlot] = null;
      newInventory.splice(action.toSlot, 0, a);
      let shift = 0;
      for (let i = 0; i < newInventory.length; i++) {
        if (newInventory[i] === undefined) {
          newInventory[i] = null;
        }
        if (newInventory[i] === null) {
          shift++;
        }
        // slide items left
        if (shift && newInventory[i]) {
          newInventory[i - shift] = newInventory[i];
          newInventory[i] = null;
        }
      }
      return {
        ...state,
        inventory: newInventory
      };
    }
    case ASSIGN_HOTKEY_TO_ITEM: {
      const item = state.inventory[action.currentInventorySlot];
      const itemId = item ? item.id : null;
      return {
        ...state,
        numericHotkeyMap: {
          ...state.numericHotkeyMap,
          [action.hotkey]: itemId
        }
      };
    }
    case SAVE_SCRIPT: {
      const scriptItem = {
        id: shortId(),
        itemName: "Scroll",
        itemData: {
          color: "#aff",
          isScript: true,
          scriptId: action.id,
          scriptContents: action.scriptContents
        }
      };
      if (action.replace) {
        let itemIndex = 0;
        for (itemIndex = 0; itemIndex < state.inventory.length; itemIndex++) {
          const item = state.inventory[itemIndex];
          if (item.itemData && item.itemData.scriptId === action.id) {
            scriptItem.id = item.id;
            break;
          }
        }
        if (itemIndex < state.inventory.length) {
          const newInventory = state.inventory
            .slice(0, itemIndex)
            .concat([scriptItem])
            .concat(state.inventory.slice(itemIndex + 1,
              state.inventory.length));
          return {
            ...state,
            inventory: newInventory
          };
        }
      }
      const newInventory = [...state.inventory, scriptItem];
      return {
        ...state,
        inventory: newInventory
      };
    }
    case USE_ITEM: {
      return {
        ...state,
        inventory: state.inventory.map(item => {
          if (!item) {
            return item;
          }
          if (item.id === action.itemId) {
            return {
              ...item,
              lastUsedAt: new Date().getTime()
            };
          }
          return item;
        })
      }
    }
    default:
      return state;
  }
}
