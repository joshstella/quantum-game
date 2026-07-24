import { createFieldState } from "./state";
import { initApp } from "./ui";

// brief #0007: the stage matches the panel's rendered height rather than a
// fixed constant. Measuring .panel first is safe — body's align-items:flex-start
// (styles.css) means its height doesn't depend on the stage's, so there's no
// layout feedback loop. The canvas's width/height attributes (its backing-store
// size, and its on-screen size now that styles.css no longer fixes one) are set
// here, before createFieldState(), since FieldState.CELL is readonly and can
// only be derived from this size once, at construction.
// Rounded once, here: canvas width/height attributes truncate to an integer
// regardless, so rounding explicitly (rather than letting that truncation
// happen implicitly) keeps CELL's derivation and the canvas's actual
// rendered size based on the exact same number.
const panel = document.querySelector(".panel") as HTMLElement;
const stageSizePx = Math.round(panel.getBoundingClientRect().height);

const view = document.getElementById("view") as HTMLCanvasElement;
view.width = stageSizePx;
view.height = stageSizePx;

const state = createFieldState(stageSizePx);
initApp(state);
