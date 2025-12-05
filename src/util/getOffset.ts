import getPropValue from "./getPropValue";
import isFixed from "./isFixed";

/**
 * Represents the position and dimensions of an element
 * @property width - Element width in pixels
 * @property height - Element height in pixels
 * @property left - Left position relative to container
 * @property right - Right position relative to container
 * @property top - Top position relative to container
 * @property bottom - Bottom position relative to container
 * @property absoluteTop - Top position relative to document
 * @property absoluteLeft - Left position relative to document
 * @property absoluteRight - Right position relative to document
 * @property absoluteBottom - Bottom position relative to document
 */
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
 * Checks if an element or its parent has scrollable overflow
 * @param style - Computed style of the element
 * @returns True if element is scrollable
 */
function isScrollable(style: CSSStyleDeclaration): boolean {
  const overflowValues = style.overflow + style.overflowY + style.overflowX;
  return /auto|scroll/.test(overflowValues);
}

/**
 * Collects all scrollable parent elements up to the document root
 * @param element - Starting element to search from
 * @returns Array of scrollable parent elements
 */
function getScrollParents(element: HTMLElement): HTMLElement[] {
  const scrollableParents: HTMLElement[] = [];
  let currentParent = element.parentElement;

  while (currentParent) {
    const style = getComputedStyle(currentParent);
    if (isScrollable(style)) {
      scrollableParents.push(currentParent);
    }
    currentParent = currentParent.parentElement;
  }

  return scrollableParents;
}

/**
 * Calculates position for fixed-position elements
 * Fixed elements are positioned relative to the viewport
 * @param elementRect - Element's bounding rectangle
 * @returns Top and left positions
 */
function calculateFixedPosition(elementRect: DOMRect): {
  top: number;
  left: number;
} {
  return {
    top: elementRect.top,
    left: elementRect.left,
  };
}

/**
 * Calculates position for elements inside a relative/sticky container
 * Accounts for scroll offsets of all scrollable parents
 * @param element - Target element
 * @param elementRect - Element's bounding rectangle
 * @param containerRect - Container's bounding rectangle
 * @param container - Container element
 * @returns Top and left positions
 */
function calculateRelativePosition(
  element: HTMLElement,
  elementRect: DOMRect,
  containerRect: DOMRect,
  container: HTMLElement
): { top: number; left: number } {
  let top = elementRect.top - containerRect.top;
  let left = elementRect.left - containerRect.left;

  // Accumulate scroll offsets from all scrollable parents up to the container
  const scrollableParents = getScrollParents(element);
  for (const scrollParent of scrollableParents) {
    top += scrollParent.scrollTop;
    left += scrollParent.scrollLeft;
    // Stop when we reach the relative container
    if (scrollParent === container) break;
  }

  return { top, left };
}

/**
 * Calculates position for elements in normal document flow
 * Uses page scroll offsets for absolute positioning
 * @param elementRect - Element's bounding rectangle
 * @returns Top and left positions
 */
function calculateDocumentPosition(elementRect: DOMRect): {
  top: number;
  left: number;
} {
  const documentElement = document.documentElement;
  const body = document.body;

  const scrollTop =
    window.pageYOffset || documentElement.scrollTop || body.scrollTop;
  const scrollLeft =
    window.pageXOffset || documentElement.scrollLeft || body.scrollLeft;

  return {
    top: elementRect.top + scrollTop,
    left: elementRect.left + scrollLeft,
  };
}

/**
 * Calculates comprehensive offset information for an element
 *
 * Handles three positioning scenarios:
 * 1. Fixed elements - Positioned relative to viewport
 * 2. Relative/Sticky containers - Positioned within container with scroll offset handling
 * 3. Normal document flow - Positioned relative to document with page scroll
 *
 * @param element - Target element to calculate offset for
 * @param relativeContainer - Optional container to calculate position relative to (defaults to document)
 * @returns Complete offset information including position, dimensions, and absolute coordinates
 *
 * @example
 * ```typescript
 * const offset = getOffset(myElement);
 * console.log(offset.top, offset.left);
 *
 * // With custom container
 * const relativeOffset = getOffset(myElement, containerElement);
 * ```
 */
export default function getOffset(
  element: HTMLElement,
  relativeContainer?: HTMLElement
): Offset {
  const documentElement = document.documentElement;
  const body = document.body;
  const container = relativeContainer || documentElement || body;

  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const containerPosition = getPropValue(container, "position");

  let top: number;
  let left: number;

  // Determine positioning strategy based on element and container properties
  if (isFixed(element)) {
    // Case 1: Fixed positioning - use viewport coordinates
    ({ top, left } = calculateFixedPosition(elementRect));
  } else if (
    container.tagName.toLowerCase() !== "body" &&
    (containerPosition === "relative" || containerPosition === "sticky")
  ) {
    // Case 2: Relative/sticky container - calculate position within container
    ({ top, left } = calculateRelativePosition(
      element,
      elementRect,
      containerRect,
      container
    ));
  } else {
    // Case 3: Normal document flow - use document coordinates
    ({ top, left } = calculateDocumentPosition(elementRect));
  }

  // Return complete offset information
  return {
    // Relative positions
    top,
    left,
    width: elementRect.width,
    height: elementRect.height,
    bottom: top + elementRect.height,
    right: left + elementRect.width,

    // Absolute positions (relative to document)
    absoluteTop: elementRect.top + window.pageYOffset,
    absoluteLeft: elementRect.left + window.pageXOffset,
    absoluteBottom: elementRect.bottom + window.pageYOffset,
    absoluteRight: elementRect.right + window.pageXOffset,
  };
}
