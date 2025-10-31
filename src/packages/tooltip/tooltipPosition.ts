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
 * Get the center from a given offset
 */
function getCenterFromOffset(offset: Offset) {
  return {
    centerX: offset.left + offset.width / 2,
    centerY: offset.top + offset.height / 2,
  };
}

/**
 * Determines top/bottom alignment
 */
function determineAutoAlignment(
  centerX: number,
  tooltipWidth: number,
  viewportWidth: number,
  desiredAlignments: TooltipAlignment[],
  requestedAlignment?: TooltipAlignment
): TooltipAlignment | null {
  const halfWidth = tooltipWidth / 2;
  const margin = 8;

  if (requestedAlignment && desiredAlignments.includes(requestedAlignment)) {
    return requestedAlignment;
  }

  const spaceLeft = centerX;
  const spaceRight = viewportWidth - centerX;

  const canMiddle =
    spaceLeft >= halfWidth + margin && spaceRight >= halfWidth + margin;
  const canLeft = spaceLeft >= tooltipWidth / 2 + margin;
  const canRight = spaceRight >= tooltipWidth / 2 + margin;

  for (const a of desiredAlignments) {
    if (a.endsWith("middle-aligned") && canMiddle) return a;
    if (a.endsWith("left-aligned") && canLeft) return a;
    if (a.endsWith("right-aligned") && canRight) return a;
  }

  if (canMiddle)
    return desiredAlignments.find((d) => d.endsWith("middle-aligned"))!;
  if (canRight)
    return desiredAlignments.find((d) => d.endsWith("right-aligned"))!;
  if (canLeft)
    return desiredAlignments.find((d) => d.endsWith("left-aligned"))!;
  return null;
}

/**
 * Determines the best tooltip position and alignment
 */
export function determineAutoPosition(
  positionPrecedence: TooltipBasePosition[],
  target: Offset,
  tooltipWidth: number,
  tooltipHeight: number,
  desiredTooltipPosition: TooltipPosition,
  containerOrWindow?: HTMLElement | { width: number; height: number }
): TooltipPosition {
  const viewportWidth =
    "clientWidth" in (containerOrWindow ?? document.documentElement)
      ? (containerOrWindow as HTMLElement).clientWidth
      : (containerOrWindow as { width: number; height: number }).width;
  const viewportHeight =
    "clientHeight" in (containerOrWindow ?? document.documentElement)
      ? (containerOrWindow as HTMLElement).clientHeight
      : (containerOrWindow as { width: number; height: number }).height;
  const tW = tooltipWidth + 12;
  const tH = tooltipHeight + 12;

  let possible = positionPrecedence.slice();

  if (target.bottom + tH > viewportHeight)
    possible = possible.filter((p) => p !== "bottom");
  if (target.top - tH < 0) possible = possible.filter((p) => p !== "top");
  if (target.right + tW > viewportWidth)
    possible = possible.filter((p) => p !== "right");
  if (target.left - tW < 0) possible = possible.filter((p) => p !== "left");

  if (!possible.length) return "floating";

  let baseRequested: TooltipBasePosition | undefined;
  let requestedAlignment: TooltipAlignment | undefined;

  if (desiredTooltipPosition.includes("-")) {
    const [base, align, side] = desiredTooltipPosition.split("-");
    baseRequested = base as TooltipBasePosition;
    if (align && side)
      requestedAlignment = `${base}-${align}-${side}` as TooltipAlignment;
  } else {
    baseRequested = desiredTooltipPosition as TooltipBasePosition;
  }

  const chosenBase: TooltipBasePosition =
    baseRequested && possible.includes(baseRequested)
      ? baseRequested
      : possible[0];

  if (chosenBase === "top" || chosenBase === "bottom") {
    const desiredAlignments: TooltipAlignment[] =
      chosenBase === "top"
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
        tW,
        viewportWidth,
        desiredAlignments,
        requestedAlignment
      ) ??
      (chosenBase === "top" ? "top-middle-aligned" : "bottom-middle-aligned");

    return alignment;
  }

  return chosenBase;
}
