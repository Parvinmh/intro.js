import dom from "../../dom";
import { tooltipReferenceLayerClassName } from "../classNames";
import { setPositionRelativeToStep } from "../position";
import { TourTooltip, TourTooltipProps } from "./TourTooltip";

const { div } = dom.tags;

export type ReferenceLayerProps = TourTooltipProps & {
  targetElement: HTMLElement;
  helperElementPadding: number;
};

export const ReferenceLayer = async ({
  targetElement,
  helperElementPadding,
  ...props
}: ReferenceLayerProps): Promise<HTMLElement | null> => {
  // Wait for tooltip to be ready (async)
  const tooltip = await TourTooltip(props);
  if (!tooltip) return null;

  const referenceLayer = div(
    { className: tooltipReferenceLayerClassName },
    tooltip
  );

  dom.derive(() => {
    // set the position of the reference layer if the refreshes signal changes
    if (props.refreshes.val == undefined) return;

    setPositionRelativeToStep(
      targetElement,
      referenceLayer,
      props.step,
      helperElementPadding
    );
  });

  return referenceLayer;
};
