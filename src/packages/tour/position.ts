import { setPositionRelativeTo } from "../../util/positionRelativeTo";
import { TourStep } from "./steps";

/**
 * Sets the position of the element relative to the TourStep
 * @api private
 */
export const setPositionRelativeToStep = (
  relativeElement: HTMLElement,
  element: HTMLElement,
  step: TourStep,
  padding: number
) => {
  //setTimeout(() => {
  setPositionRelativeTo(
    relativeElement,
    element,
    step.element as HTMLElement,
    step.position === "floating" ? 0 : padding
  );
  //}, 0);
};
