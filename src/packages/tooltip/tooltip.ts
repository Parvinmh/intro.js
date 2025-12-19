import getOffset, { Offset } from "../../util/getOffset";
import getWindowSize from "../../util/getWindowSize";
import dom, { ChildDom, State } from "../dom";
import { arrowClassName, tooltipClassName } from "../tour/classNames";
import {
  determineAutoPosition,
  TooltipPosition,
  TooltipBasePosition,
} from "./tooltipPosition";

const { div } = dom.tags;

export const TooltipArrow = (props: {
  tooltipPosition: State<TooltipPosition>;
  tooltipBottomOverflow: State<boolean>;
}) => {
  const classNames = dom.derive(() => {
    const classNames = [arrowClassName];

    switch (props.tooltipPosition.val) {
      case "top-right-aligned":
        classNames.push("bottom-right");
        break;

      case "top-middle-aligned":
        classNames.push("bottom-middle");
        break;

      case "top-left-aligned":
      // top-left-aligned is the same as the default top
      case "top":
        classNames.push("bottom");
        break;
      case "right":
        if (props.tooltipBottomOverflow.val) {
          classNames.push("left-bottom");
        } else {
          classNames.push("left");
        }
        break;
      case "left":
        if (props.tooltipBottomOverflow.val) {
          classNames.push("right-bottom");
        } else {
          classNames.push("right");
        }

        break;
      case "floating":
        // no arrow element for floating tooltips
        break;
      case "bottom-right-aligned":
        classNames.push("top-right");
        break;

      case "bottom-middle-aligned":
        classNames.push("top-middle");
        break;

      // case 'bottom-left-aligned':
      // Bottom-left-aligned is the same as the default bottom
      // case 'bottom':
      // Bottom going to follow the default behavior
      default:
        classNames.push("top");
    }

    return classNames;
  });

  return div({
    className: () => classNames.val?.filter(Boolean).join(" "),
    style: () =>
      `display: ${
        props.tooltipPosition.val === "floating" ? "none" : "block"
      };`,
  });
};

/**
 * @return boolean true, if tooltipLayerStyleLeft is ok.  false, otherwise.
 */
function checkRight(
  targetOffset: {
    top: number;
    left: number;
    width: number;
    height: number;
  },
  windowSize: {
    width: number;
    height: number;
  },
  tooltipLayerStyleLeft: number,
  tooltipWidth: number,
  tooltipLeft: State<string>
): boolean {
  // check left edge
  if (targetOffset.left + tooltipLayerStyleLeft < 0) {
    tooltipLeft.val = `${-targetOffset.left}px`;
    return false;
  }

  // check right edge
  if (
    targetOffset.left + tooltipLayerStyleLeft + tooltipWidth >
    windowSize.width
  ) {
    // off the right side of the window
    const adjustedLeft = windowSize.width - tooltipWidth - targetOffset.left;
    // Make sure adjustment doesn't cause negative left
    tooltipLeft.val = `${Math.max(adjustedLeft, -targetOffset.left)}px`;
    return false;
  }

  tooltipLeft.val = `${tooltipLayerStyleLeft}px`;
  return true;
}

const alignTooltip = (
  position: TooltipPosition,
  targetOffset: { width: number; height: number; left: number; top: number },
  windowSize: { width: number; height: number },
  tooltipWidth: number,
  tooltipHeight: number,
  tooltipTop: State<string>,
  tooltipBottom: State<string>,
  tooltipLeft: State<string>,
  tooltipRight: State<string>,
  tooltipMarginLeft: State<string>,
  tooltipMarginTop: State<string>,
  tooltipBottomOverflow: State<boolean>,
  showStepNumbers: boolean,
  hintMode: boolean
) => {
  tooltipTop.val = "auto";
  tooltipBottom.val = "auto";
  tooltipLeft.val = "auto";
  tooltipRight.val = "auto";
  tooltipMarginLeft.val = "0";
  tooltipMarginTop.val = "0";

  let tooltipLayerStyleLeftRight = targetOffset.width / 2 - tooltipWidth / 2;

  switch (position) {
    case "top-right-aligned":
      // Align tooltip's right edge with element's right edge
      let tooltipLayerStyleRight = 0;

      // Check if it would go off left edge of viewport
      if (targetOffset.left + targetOffset.width - tooltipWidth < 0) {
        // Align to left edge of viewport instead
        tooltipLeft.val = `0px`;
      } else {
        // Use right alignment
        tooltipRight.val = `${tooltipLayerStyleRight}px`;
      }

      tooltipBottom.val = `${targetOffset.height + 20}px`;
      break;

    case "top-middle-aligned":
      // Center the tooltip horizontally relative to the target element
      tooltipLayerStyleLeftRight = targetOffset.width / 2 - tooltipWidth / 2;

      // a fix for middle aligned hints
      if (hintMode) {
        tooltipLayerStyleLeftRight += 5;
      }

      // Check if centered position would overflow viewport
      const topMiddleOverflowLeft =
        targetOffset.left + tooltipLayerStyleLeftRight < 0;
      const topMiddleOverflowRight =
        targetOffset.left + tooltipLayerStyleLeftRight + tooltipWidth >
        windowSize.width;

      if (topMiddleOverflowLeft) {
        // Align to left edge of viewport
        tooltipLeft.val = `0px`;
      } else if (topMiddleOverflowRight) {
        // Align to right edge of viewport
        tooltipLeft.val = `${
          windowSize.width - tooltipWidth - targetOffset.left
        }px`;
      } else {
        // Use centered position
        tooltipLeft.val = `${tooltipLayerStyleLeftRight}px`;
      }

      tooltipBottom.val = `${targetOffset.height + 20}px`;
      break;

    case "top-left-aligned":
    // top-left-aligned is the same as the default top
    case "top":
      let tooltipLayerStyleLeft = hintMode ? 0 : 15;

      // Check if it would go off left edge
      if (targetOffset.left + tooltipLayerStyleLeft < 0) {
        tooltipLayerStyleLeft = -targetOffset.left;
      }

      checkRight(
        targetOffset,
        windowSize,
        tooltipLayerStyleLeft,
        tooltipWidth,
        tooltipLeft
      );
      tooltipBottom.val = `${targetOffset.height + 20}px`;
      break;
    case "right":
      // Check if there's enough space on the right
      const rightSpaceNeeded = targetOffset.width + 20 + tooltipWidth;
      if (targetOffset.left + rightSpaceNeeded > windowSize.width) {
        // Not enough space on right, fallback to bottom position
        // Check if tooltip would overflow left edge when at bottom
        if (targetOffset.left < 0) {
          tooltipLeft.val = `${-targetOffset.left}px`;
        } else if (targetOffset.left + tooltipWidth > windowSize.width) {
          // Tooltip wider than remaining space, align to right edge of viewport
          tooltipLeft.val = `${
            windowSize.width - tooltipWidth - targetOffset.left
          }px`;
        } else {
          tooltipLeft.val = "0px";
        }
        tooltipTop.val = `${targetOffset.height + 20}px`;
      } else {
        // Normal right positioning - but still check for left edge overflow
        const normalRightLeft = targetOffset.width + 20;
        if (targetOffset.left + normalRightLeft < 0) {
          // Would overflow left, clamp to viewport
          tooltipLeft.val = `${-targetOffset.left}px`;
        } else {
          tooltipLeft.val = `${normalRightLeft}px`;
        }

        if (tooltipBottomOverflow.val) {
          // In this case, right would have fallen below the bottom of the screen.
          // Modify so that the bottom of the tooltip connects with the target
          tooltipTop.val = `-${tooltipHeight - targetOffset.height - 20}px`;
        }
      }
      break;
    case "left":
      // Check if there's enough space on the left
      if (targetOffset.left - 20 - tooltipWidth < 0) {
        // Not enough space on left, fallback to bottom with left edge protection
        if (targetOffset.left < 0) {
          tooltipLeft.val = `${-targetOffset.left}px`;
        } else {
          tooltipLeft.val = "0px";
        }
        tooltipTop.val = `${targetOffset.height + 20}px`;
      } else {
        // Normal left positioning
        if (!hintMode && showStepNumbers === true) {
          tooltipTop.val = "15px";
        }

        if (tooltipBottomOverflow.val) {
          // In this case, left would have fallen below the bottom of the screen.
          // Modify so that the bottom of the tooltip connects with the target
          tooltipTop.val = `-${tooltipHeight - targetOffset.height - 20}px`;
        }
        tooltipRight.val = `${targetOffset.width + 20}px`;
      }
      break;
    case "floating":
      //we have to adjust the top and left of layer manually for intro items without element
      tooltipLeft.val = "50%";
      tooltipTop.val = "50%";
      tooltipMarginLeft.val = `-${tooltipWidth / 2}px`;
      tooltipMarginTop.val = `-${tooltipHeight / 2}px`;

      break;
    case "bottom-right-aligned":
      // Align tooltip's right edge with element's right edge
      tooltipLayerStyleRight = 0;

      // Check if it would go off left edge of viewport
      if (targetOffset.left + targetOffset.width - tooltipWidth < 0) {
        // Align to left edge of viewport instead
        tooltipLeft.val = `0px`;
      } else {
        // Use right alignment
        tooltipRight.val = `${tooltipLayerStyleRight}px`;
      }

      tooltipTop.val = `${targetOffset.height + 20}px`;
      break;

    case "bottom-middle-aligned":
      // Center the tooltip horizontally relative to the target element
      tooltipLayerStyleLeftRight = targetOffset.width / 2 - tooltipWidth / 2;

      // a fix for middle aligned hints
      if (hintMode) {
        tooltipLayerStyleLeftRight += 5;
      }

      // Check if centered position would overflow viewport
      const bottomMiddleOverflowLeft =
        targetOffset.left + tooltipLayerStyleLeftRight < 0;
      const bottomMiddleOverflowRight =
        targetOffset.left + tooltipLayerStyleLeftRight + tooltipWidth >
        windowSize.width;

      if (bottomMiddleOverflowLeft) {
        // Align to left edge of viewport
        tooltipLeft.val = `0px`;
      } else if (bottomMiddleOverflowRight) {
        // Align to right edge of viewport
        tooltipLeft.val = `${
          windowSize.width - tooltipWidth - targetOffset.left
        }px`;
      } else {
        // Use centered position
        tooltipLeft.val = `${tooltipLayerStyleLeftRight}px`;
      }

      tooltipTop.val = `${targetOffset.height + 20}px`;
      break;

    case "bottom-left-aligned":
      // Align left edge of tooltip with left edge of element
      const bottomLeftStyleLeft = hintMode ? 0 : 0;
      checkRight(
        targetOffset,
        windowSize,
        bottomLeftStyleLeft,
        tooltipWidth,
        tooltipLeft
      );
      tooltipTop.val = `${targetOffset.height + 20}px`;
      break;

    // case 'bottom':
    // Bottom going to follow the default behavior
    default:
      checkRight(targetOffset, windowSize, 0, tooltipWidth, tooltipLeft);
      tooltipTop.val = `${targetOffset.height + 20}px`;
  }

  // Final safety net: ensure tooltips never go off viewport edges
  // This catches any edge cases not handled by position-specific logic

  // Protection for left-positioned tooltips (using CSS left property)
  if (tooltipLeft.val && tooltipLeft.val !== "auto") {
    const leftVal = parseFloat(tooltipLeft.val);
    if (!isNaN(leftVal)) {
      const absoluteLeft = targetOffset.left + leftVal;

      // Prevent left edge overflow - CRITICAL: ensure absolute position >= 0
      if (absoluteLeft < 0) {
        // Calculate the adjustment needed to make absoluteLeft = 0
        const adjustment = -absoluteLeft; // This is how much we need to add
        tooltipLeft.val = `${leftVal + adjustment}px`;
      }

      // Re-calculate with potentially adjusted value
      const finalLeftVal = parseFloat(tooltipLeft.val);
      const finalAbsoluteLeft = targetOffset.left + finalLeftVal;

      // Prevent right edge overflow
      const absoluteRight = finalAbsoluteLeft + tooltipWidth;
      if (absoluteRight > windowSize.width) {
        const overflow = absoluteRight - windowSize.width;
        const adjustedLeft = finalLeftVal - overflow;
        // Clamp: never go below zero absolute position
        const minLeft = -targetOffset.left;
        tooltipLeft.val = `${Math.max(adjustedLeft, minLeft, 0)}px`;
      }

      // FINAL ABSOLUTE GUARANTEE: One last check
      const veryFinalLeft = parseFloat(tooltipLeft.val);
      const veryFinalAbsolute = targetOffset.left + veryFinalLeft;
      if (veryFinalAbsolute < 0) {
        // Force to 0 absolute position no matter what
        tooltipLeft.val = `${-targetOffset.left}px`;
      }
    }
  }

  // Protection for right-positioned tooltips (using CSS right property)
  if (tooltipRight.val && tooltipRight.val !== "auto") {
    const rightVal = parseFloat(tooltipRight.val);
    if (!isNaN(rightVal)) {
      // Calculate absolute right edge position
      const absoluteRight = targetOffset.left + targetOffset.width - rightVal;

      // Calculate what the left position would be
      const impliedLeft = absoluteRight - tooltipWidth;

      // If implied left would be negative, adjust to clamp at left edge
      // but try to maintain as much right-alignment as possible
      if (impliedLeft < 0) {
        // Switch to left positioning clamped at 0
        tooltipRight.val = "auto";
        tooltipLeft.val = "0px";
      }

      // Also check if right edge would overflow viewport right side
      if (absoluteRight > windowSize.width) {
        // Adjust the right value to fit
        const overflow = absoluteRight - windowSize.width;
        tooltipRight.val = `${rightVal + overflow}px`;
      }
    }
  }
};

export type TooltipProps = {
  position: TooltipPosition;
  element: HTMLElement;
  refreshes: State<number>;
  hintMode: boolean;
  showStepNumbers: boolean;

  transitionDuration?: number;

  // auto-alignment properties
  autoPosition: boolean;
  positionPrecedence: TooltipBasePosition[];

  onClick?: (e: any) => void;
  className?: string;
  text: string;
};

export const Tooltip = (
  {
    position: initialPosition,
    element,
    refreshes,
    hintMode = false,
    showStepNumbers = false,

    transitionDuration = 0,

    // auto-alignment properties
    positionPrecedence = [],
    className,
    autoPosition = true,
    text,
    onClick,
  }: TooltipProps,
  children?: ChildDom[]
) => {
  const top = dom.state<string>("auto");
  const right = dom.state<string>("auto");
  const bottom = dom.state<string>("auto");
  const left = dom.state<string>("auto");
  const marginLeft = dom.state<string>("0");
  const marginTop = dom.state<string>("0");
  const opacity = dom.state<number>(0);
  // setting a default height for the tooltip instead of 0 to avoid flickering
  // this default is coming from the CSS class and is overridden after the tooltip is rendered
  const tooltipHeight = dom.state<number>(250);
  // max width of the tooltip according to its CSS class
  // this default is coming from the CSS class and is overridden after the tooltip is rendered
  const tooltipWidth = dom.state<number>(300);
  const position = dom.state<TooltipPosition>(initialPosition);
  // windowSize can change if the window is resized
  const windowSize = dom.state(getWindowSize());
  const targetOffset = dom.state<Offset>(getOffset(element));
  const tooltipBottomOverflow = dom.derive<boolean>(
    () => targetOffset.val!.top + tooltipHeight.val! > windowSize.val!.height
  );

  dom.derive(() => {
    // set the new windowSize and targetOffset if the refreshes signal changes
    if (refreshes.val !== undefined) {
      windowSize.val = getWindowSize();
      targetOffset.val = getOffset(element);
    }
  });

  // auto-align tooltip based on position precedence and target offset
  dom.derive(() => {
    if (
      position.val !== undefined &&
      initialPosition !== "floating" &&
      autoPosition &&
      tooltipWidth.val &&
      tooltipHeight.val &&
      targetOffset.val &&
      windowSize.val
    ) {
      position.val = determineAutoPosition(
        positionPrecedence,
        targetOffset.val,
        tooltipWidth.val,
        tooltipHeight.val,
        initialPosition,
        windowSize.val
      );
    }
  });

  // align tooltip based on position and target offset
  dom.derive(() => {
    if (
      tooltipWidth.val !== undefined &&
      tooltipHeight.val !== undefined &&
      tooltipBottomOverflow.val !== undefined &&
      position.val !== undefined &&
      targetOffset.val !== undefined &&
      windowSize.val !== undefined
    ) {
      alignTooltip(
        position.val,
        targetOffset.val,
        windowSize.val,
        tooltipWidth.val,
        tooltipHeight.val,
        top,
        bottom,
        left,
        right,
        marginLeft,
        marginTop,
        tooltipBottomOverflow,
        showStepNumbers,
        hintMode
      );

      // SYNCHRONOUS POST-ALIGNMENT CHECK: Force viewport-absolute positioning
      // Check ALL positioning properties and ensure no negative absolute positions
      if (targetOffset.val) {
        // Handle left-based positioning
        if (left.val && left.val !== "auto") {
          const leftVal = parseFloat(left.val);
          if (!isNaN(leftVal)) {
            const absoluteLeft = targetOffset.val.left + leftVal;
            if (absoluteLeft < 0) {
              // Force to viewport left edge
              left.val = `${-targetOffset.val.left}px`;
              right.val = "auto";
            }
          }
        }

        // Handle right-based positioning
        if (right.val && right.val !== "auto" && tooltipWidth.val) {
          const rightVal = parseFloat(right.val);
          if (!isNaN(rightVal)) {
            // Calculate implied absolute left position
            const impliedLeft =
              targetOffset.val.left +
              targetOffset.val.width -
              rightVal -
              tooltipWidth.val;
            if (impliedLeft < 0) {
              // Switch to left-based positioning at viewport edge
              right.val = "auto";
              left.val = `${-targetOffset.val.left}px`;
            }
          }
        }
      }
    }
  });

  const tooltip = div(
    {
      style: () =>
        `top: ${top.val}; right: ${right.val}; bottom: ${bottom.val}; left: ${left.val}; margin-left: ${marginLeft.val}; margin-top: ${marginTop.val};opacity: ${opacity.val}`,
      className: () =>
        `${tooltipClassName} introjs-${position.val} ${className || ""}`,
      role: "dialog",
      "aria-label": text,
      onclick: onClick ?? null,
    },
    [
      TooltipArrow({
        tooltipPosition: position,
        tooltipBottomOverflow: tooltipBottomOverflow,
      }),
      [children],
    ]
  );

  // apply the transition effect
  setTimeout(() => {
    opacity.val = 1;
  }, transitionDuration);

  setTimeout(() => {
    // set the correct height and width of the tooltip after it has been rendered
    tooltipHeight.val = tooltip.offsetHeight;
    tooltipWidth.val = tooltip.offsetWidth;

    // CRITICAL FIX: Check actual rendered position and fix if negative
    const rect = tooltip.getBoundingClientRect();
    if (rect.left < 0) {
      // Tooltip is off-screen left, need to shift it right
      const adjustment = -rect.left; // How much we need to move right

      // Update the reactive state, not just the DOM
      if (left.val && left.val !== "auto") {
        const currentLeftVal = parseFloat(left.val);
        left.val = `${currentLeftVal + adjustment}px`;
      } else {
        // Force left positioning
        left.val = "0px";
        right.val = "auto";
      }
    }
  }, 1);

  return tooltip;
};
