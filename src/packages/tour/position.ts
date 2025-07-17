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
  setPositionRelativeTo(
    relativeElement,
    element,
    step.element as HTMLElement,
    step.position === "floating" ? 0 : padding
  );
};

/**
 * Waits for the target element to be visible in viewport, then sets tooltip position.
 */
export const waitAndSetPositionRelativeToStep = (
  relativeElement: HTMLElement,
  tooltipLayer: HTMLElement,
  step: TourStep,
  padding: number
) => {
  const target = step.element as HTMLElement;

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];

      if (entry.isIntersecting) {
        observer.disconnect();

        setPositionRelativeToStep(
          relativeElement,
          tooltipLayer,
          step,
          padding
        );
      }
    },
    {
      threshold: 0.1,
    }
  );

  observer.observe(target);
};
