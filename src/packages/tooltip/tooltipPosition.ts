import { Offset } from "../../util/getOffset";

export type TooltipBasePosition =
  | "floating"
  | "top"
  | "bottom"
  | "left"
  | "right";
export type TooltipAlignment =
  | "top-left-aligned"
  | "top-middle-aligned"
  | "top-right-aligned"
  | "bottom-left-aligned"
  | "bottom-middle-aligned"
  | "bottom-right-aligned";
export type TooltipPosition = TooltipBasePosition | TooltipAlignment;

/**
 * Tooltip spacing buffer includes:
 * - Arrow size (10px): extends beyond tooltip box
 * - Safety margin (2px): prevents touching viewport edges
 */
const TOOLTIP_SPACING_BUFFER = 12;

/**
 * Minimum margin between tooltip and viewport edge when auto-positioning
 */
const VIEWPORT_MARGIN = 8;

/**
 * All possible aligned tooltip positions
 */
const ALIGNED_POSITIONS: TooltipAlignment[] = [
  "top-left-aligned",
  "top-middle-aligned",
  "top-right-aligned",
  "bottom-left-aligned",
  "bottom-middle-aligned",
  "bottom-right-aligned",
];

/**
 * Calculate the center point coordinates of an element
 * @param offset - Element's offset dimensions
 * @returns Object containing centerX and centerY coordinates
 */
function getCenterFromOffset(offset: Offset) {
  return {
    centerX: offset.left + offset.width / 2,
    centerY: offset.top + offset.height / 2,
  };
}

/**
 * Determines the best horizontal alignment for top/bottom positioned tooltips
 *
 * Priority order:
 * 1. Use requested alignment if it fits
 * 2. Try middle-aligned (centered)
 * 3. Try right-aligned
 * 4. Try left-aligned
 * 5. Return null if none fit
 *
 * @param centerX - Horizontal center position of target element
 * @param tooltipWidth - Width of tooltip including buffer
 * @param viewportWidth - Width of viewport/container
 * @param desiredAlignments - Available alignments for current position (top/bottom)
 * @param requestedAlignment - Optional specific alignment requested by user
 * @returns Best fitting alignment or null if none fit
 */
function determineAutoAlignment(
  centerX: number,
  tooltipWidth: number,
  viewportWidth: number,
  desiredAlignments: TooltipAlignment[],
  requestedAlignment?: TooltipAlignment
): TooltipAlignment | null {
  const halfWidth = tooltipWidth / 2;

  // If user requested specific alignment and it's valid, honor it
  if (requestedAlignment && desiredAlignments.includes(requestedAlignment)) {
    return requestedAlignment;
  }

  const spaceLeft = centerX;
  const spaceRight = viewportWidth - centerX;

  // Calculate if each alignment type can fit within viewport
  // Middle-aligned: Tooltip centered below/above element, needs half width on each side
  const canFitMiddleAligned =
    spaceLeft >= halfWidth + VIEWPORT_MARGIN &&
    spaceRight >= halfWidth + VIEWPORT_MARGIN;

  // Left-aligned: Tooltip starts at left edge of element, extends right
  const canFitLeftAligned = spaceRight >= tooltipWidth + VIEWPORT_MARGIN;

  // Right-aligned: Tooltip ends at right edge of element, extends left
  const canFitRightAligned = spaceLeft >= tooltipWidth + VIEWPORT_MARGIN;

  // Try each alignment in priority order
  for (const alignment of desiredAlignments) {
    if (alignment.endsWith("middle-aligned") && canFitMiddleAligned)
      return alignment;
    if (alignment.endsWith("left-aligned") && canFitLeftAligned)
      return alignment;
    if (alignment.endsWith("right-aligned") && canFitRightAligned)
      return alignment;
  }

  // Fallback: Return best available option even if it doesn't perfectly fit
  if (canFitMiddleAligned)
    return desiredAlignments.find((d) => d.endsWith("middle-aligned"))!;
  if (canFitRightAligned)
    return desiredAlignments.find((d) => d.endsWith("right-aligned"))!;
  if (canFitLeftAligned)
    return desiredAlignments.find((d) => d.endsWith("left-aligned"))!;

  return null;
}

/**
 * Determines the optimal tooltip position and alignment based on available space
 *
 * This function:
 * 1. Calculates which base positions (top/bottom/left/right) have enough space
 * 2. For top/bottom positions, determines the best horizontal alignment
 * 3. Falls back to "floating" position if no space is available
 *
 * @param positionPrecedence - Ordered list of preferred base positions
 * @param target - Target element's offset and dimensions
 * @param tooltipWidth - Width of tooltip element
 * @param tooltipHeight - Height of tooltip element
 * @param desiredTooltipPosition - User's desired position (may be overridden if no space)
 * @param containerOrWindow - Optional container element or window dimensions
 * @returns The best tooltip position that fits in available space
 */
export function determineAutoPosition(
  positionPrecedence: TooltipBasePosition[],
  target: Offset,
  tooltipWidth: number,
  tooltipHeight: number,
  desiredTooltipPosition: TooltipPosition,
  containerOrWindow?: HTMLElement | { width: number; height: number }
): TooltipPosition {
  // Get viewport/container dimensions
  const viewportWidth =
    "clientWidth" in (containerOrWindow ?? document.documentElement)
      ? (containerOrWindow as HTMLElement).clientWidth
      : (containerOrWindow as { width: number; height: number }).width;
  const viewportHeight =
    "clientHeight" in (containerOrWindow ?? document.documentElement)
      ? (containerOrWindow as HTMLElement).clientHeight
      : (containerOrWindow as { width: number; height: number }).height;

  // Add spacing buffer to account for arrow and margins
  const tooltipWidthWithBuffer = tooltipWidth + TOOLTIP_SPACING_BUFFER;
  const tooltipHeightWithBuffer = tooltipHeight + TOOLTIP_SPACING_BUFFER;

  // Filter out positions that don't have enough space
  let possiblePositions = positionPrecedence.slice();

  if (target.bottom + tooltipHeightWithBuffer > viewportHeight)
    possiblePositions = possiblePositions.filter((p) => p !== "bottom");
  if (target.top - tooltipHeightWithBuffer < 0)
    possiblePositions = possiblePositions.filter((p) => p !== "top");
  if (target.right + tooltipWidthWithBuffer > viewportWidth)
    possiblePositions = possiblePositions.filter((p) => p !== "right");
  if (target.left - tooltipWidthWithBuffer < 0)
    possiblePositions = possiblePositions.filter((p) => p !== "left");

  // No space available anywhere - use floating position
  if (!possiblePositions.length) return "floating";

  // Parse user's desired position
  let baseRequested: TooltipBasePosition | undefined;
  let requestedAlignment: TooltipAlignment | undefined;

  if (ALIGNED_POSITIONS.includes(desiredTooltipPosition as TooltipAlignment)) {
    requestedAlignment = desiredTooltipPosition as TooltipAlignment;
    // Extract base position (e.g., "bottom" from "bottom-middle-aligned")
    baseRequested = desiredTooltipPosition.split("-")[0] as TooltipBasePosition;
  } else {
    baseRequested = desiredTooltipPosition as TooltipBasePosition;
  }

  // Choose base position: prefer requested if possible, otherwise use first available
  const chosenBasePosition: TooltipBasePosition =
    baseRequested && possiblePositions.includes(baseRequested)
      ? baseRequested
      : possiblePositions[0];

  // For top/bottom positions, determine horizontal alignment
  if (chosenBasePosition === "top" || chosenBasePosition === "bottom") {
    const desiredAlignments: TooltipAlignment[] =
      chosenBasePosition === "top"
        ? ["top-left-aligned", "top-middle-aligned", "top-right-aligned"]
        : [
            "bottom-left-aligned",
            "bottom-middle-aligned",
            "bottom-right-aligned",
          ];

    const { centerX } = getCenterFromOffset(target);

    const alignment =
      determineAutoAlignment(
        centerX,
        tooltipWidthWithBuffer,
        viewportWidth,
        desiredAlignments,
        requestedAlignment
      ) ??
      (chosenBasePosition === "top"
        ? "top-middle-aligned"
        : "bottom-middle-aligned");

    return alignment;
  }

  // For left/right positions, return the base position
  return chosenBasePosition;
}
