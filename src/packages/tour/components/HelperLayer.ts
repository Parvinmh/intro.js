import { style } from "../../../util/style";
import dom, { State } from "../../dom";
import { helperLayerClassName } from "../classNames";
import { setPositionRelativeToStep } from "../position";
import { TourStep } from "../steps";

const { div } = dom.tags;

const getClassName = ({
  step,
  tourHighlightClass,
}: {
  step: State<TourStep | null>;
  tourHighlightClass: string;
}) => {
  let highlightClass = helperLayerClassName;

  // check for a current step highlight class
  if (step.val && typeof step.val.highlightClass === "string") {
    highlightClass += ` ${step.val.highlightClass}`;
  }

  // check for options highlight class
  if (typeof tourHighlightClass === "string") {
    highlightClass += ` ${tourHighlightClass}`;
  }

  return highlightClass;
};

export type HelperLayerProps = {
  currentStep: State<number | undefined>;
  steps: TourStep[];
  refreshes: State<number>;
  targetElement: HTMLElement;
  tourHighlightClass: string;
  overlayOpacity: number;
  helperLayerPadding: number;
};

export const HelperLayer = ({
  currentStep,
  steps,
  refreshes,
  targetElement,
  tourHighlightClass,
  overlayOpacity,
  helperLayerPadding,
}: HelperLayerProps) => {
  const step = dom.derive(() =>
    currentStep.val !== undefined ? steps[currentStep.val] : null
  );

  const helperLayer = div({
    className: () => getClassName({ step, tourHighlightClass }),
    style: style({
      // the inner box shadow is the border for the highlighted element
      // the outer box shadow is the overlay effect
      "box-shadow": `0 0 1px 2px rgba(33, 33, 33, 0.8), rgba(33, 33, 33, ${overlayOpacity.toString()}) 0 0 0 5000px`,
    }),
  });

  dom.derive(() => {
    // set the new position if the step or refreshes change
    if (!step.val || refreshes.val === undefined) return;

    setPositionRelativeToStep(
      targetElement,
      helperLayer,
      step.val,
      helperLayerPadding
    );
  });

  return helperLayer;
};
