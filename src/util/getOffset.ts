import getPropValue from "./getPropValue";
import isFixed from "./isFixed";

export type Offset = {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  absoluteTop: number;
  absoluteLeft: number;
  absoluteRight: number;
  absoluteBottom: number;
};

/**
 * Returns all scrollable parents up to document root
 */
function getScrollParents(el: HTMLElement): HTMLElement[] {
  const parents: HTMLElement[] = [];
  let parent = el.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    if (
      /auto|scroll/.test(style.overflow + style.overflowY + style.overflowX)
    ) {
      parents.push(parent);
    }
    parent = parent.parentElement;
  }
  return parents;
}

/**
 * Returns element offset relative to a container or document.
 * Handles scrollable containers, fixed/relative positioning and nested scrolls.
 */
export default function getOffset(
  element: HTMLElement,
  relativeEl?: HTMLElement
): Offset {
  const docEl = document.documentElement;
  const body = document.body;
  relativeEl = relativeEl || docEl || body;

  const rect = element.getBoundingClientRect();
  const relRect = relativeEl.getBoundingClientRect();
  const relPos = getPropValue(relativeEl, "position");

  // Default positions
  let top = 0;
  let left = 0;

  // Case 1: Fixed elements → use viewport-relative rect directly
  if (isFixed(element)) {
    top = rect.top;
    left = rect.left;
  }

  // Case 2: Relative or sticky container → position inside the container
  else if (
    relativeEl.tagName.toLowerCase() !== "body" &&
    (relPos === "relative" || relPos === "sticky")
  ) {
    top = rect.top - relRect.top;
    left = rect.left - relRect.left;

    // Add scroll offsets from parents until relativeEl
    const scrollParents = getScrollParents(element);
    for (const sp of scrollParents) {
      top += sp.scrollTop;
      left += sp.scrollLeft;
      if (sp === relativeEl) break;
    }
  }

  // Case 3: Normal document flow
  else {
    const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    const scrollLeft =
      window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
    top = rect.top + scrollTop;
    left = rect.left + scrollLeft;
  }

  return {
    top,
    left,
    width: rect.width,
    height: rect.height,
    bottom: top + rect.height,
    right: left + rect.width,
    absoluteTop: rect.top + window.pageYOffset,
    absoluteLeft: rect.left + window.pageXOffset,
    absoluteBottom: rect.bottom + window.pageYOffset,
    absoluteRight: rect.right + window.pageXOffset,
  };
}
