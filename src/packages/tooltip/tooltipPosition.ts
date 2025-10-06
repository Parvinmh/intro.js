import removeEntry from "../../util/removeEntry";
import { Offset } from "../../util/getOffset";

export type TooltipPosition =
  | "floating"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-right-aligned"
  | "top-left-aligned"
  | "top-middle-aligned"
  | "bottom-right-aligned"
  | "bottom-left-aligned"
  | "bottom-middle-aligned";

/**
 * Determine alignment for top/bottom positions
 * Respects viewport edges and explicitly requested alignment
 */
function determineAutoAlignment(
  offsetLeft: number,
  tooltipWidth: number,
  windowWidth: number,
  desiredAlignment: TooltipPosition[],
  requestedAlignment?: TooltipPosition
): TooltipPosition | null {
  const halfTooltipWidth = tooltipWidth / 2;
  const winWidth = Math.min(windowWidth, window.screen.width);
  const margin = 10;

  // Force requested alignment if explicitly set
  if (requestedAlignment && desiredAlignment.includes(requestedAlignment)) {
    return requestedAlignment;
  }

  // Only remove alignment if it really doesn't fit
  if (winWidth - (offsetLeft + halfTooltipWidth) < margin) {
    removeEntry(desiredAlignment, "top-middle-aligned");
    removeEntry(desiredAlignment, "bottom-middle-aligned");
  }

  if (offsetLeft + halfTooltipWidth < margin) {
    removeEntry(desiredAlignment, "top-middle-aligned");
    removeEntry(desiredAlignment, "bottom-middle-aligned");
  }

  if (offsetLeft + tooltipWidth - margin > winWidth) {
    removeEntry(desiredAlignment, "top-right-aligned");
    removeEntry(desiredAlignment, "bottom-right-aligned");
  }

  if (desiredAlignment.length) {
    return desiredAlignment[0];
  }

  return null;
}

/**
 * Determines the position of the tooltip based on available space and desired alignment
 */
export function determineAutoPosition(
  positionPrecedence: TooltipPosition[],
  targetOffset: Offset,
  tooltipWidth: number,
  tooltipHeight: number,
  desiredTooltipPosition: TooltipPosition,
  windowSize: { width: number; height: number }
): TooltipPosition {
  // Optional: reduce padding to prevent over-removal
  const tooltipWidthAdjusted = tooltipWidth + 10;
  const tooltipHeightAdjusted = tooltipHeight + 10;

  let possiblePositions = positionPrecedence.slice();
  let calculatedPosition: TooltipPosition = "floating";

  // Remove positions that won't fit
  if (targetOffset.absoluteBottom + tooltipHeightAdjusted > windowSize.height) {
    removeEntry(possiblePositions, "bottom");
  }
  if (targetOffset.absoluteTop - tooltipHeightAdjusted < 0) {
    removeEntry(possiblePositions, "top");
  }
  if (targetOffset.absoluteRight + tooltipWidthAdjusted > windowSize.width) {
    removeEntry(possiblePositions, "right");
  }
  if (targetOffset.absoluteLeft - tooltipWidthAdjusted < 0) {
    removeEntry(possiblePositions, "left");
  }

  // Strip alignment from desiredTooltipPosition
  const requestedBasePos = desiredTooltipPosition
    ? (desiredTooltipPosition.split("-")[0] as TooltipPosition)
    : undefined;

  if (possiblePositions.length) {
    calculatedPosition = possiblePositions.includes(requestedBasePos!)
      ? requestedBasePos!
      : possiblePositions[0];
  }

  // Handle optional alignments for top/bottom
  if (calculatedPosition === "top" || calculatedPosition === "bottom") {
    let defaultAlignment: TooltipPosition;
    let desiredAlignment: TooltipPosition[] = [];

    if (calculatedPosition === "top") {
      defaultAlignment = "top-middle-aligned";
      desiredAlignment = [
        "top-left-aligned",
        "top-middle-aligned",
        "top-right-aligned",
      ];
    } else {
      defaultAlignment = "bottom-middle-aligned";
      desiredAlignment = [
        "bottom-left-aligned",
        "bottom-middle-aligned",
        "bottom-right-aligned",
      ];
    }

    calculatedPosition =
      determineAutoAlignment(
        targetOffset.absoluteLeft,
        tooltipWidthAdjusted,
        windowSize.width,
        desiredAlignment,
        desiredTooltipPosition
      ) || defaultAlignment;
  }

  return calculatedPosition;
}
