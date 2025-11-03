import { setPositionRelativeTo } from "../../../util/positionRelativeTo";
import dom, { State } from "../../dom";
import {
  hintReferenceClassName,
  tooltipReferenceLayerClassName,
} from "../className";
import { dataStepAttribute } from "../dataAttributes";
import { HintTooltip, HintTooltipProps } from "./HintTooltip";

const { div } = dom.tags;

export type ReferenceLayerProps = HintTooltipProps & {
  activeHintSignal: State<number | undefined>;
  targetElement: HTMLElement;
  helperElementPadding: number;
};

export const ReferenceLayer = async ({
  activeHintSignal,
  targetElement,
  helperElementPadding,
  ...props
}: ReferenceLayerProps): Promise<HTMLElement | null> => {
  const initialActiveHintSignal = activeHintSignal.val;

  if (
    activeHintSignal.val == undefined ||
    initialActiveHintSignal !== activeHintSignal.val
  ) {
    return null;
  }

  const tooltip = await HintTooltip(props);

  const referenceLayer = div(
    {
      [dataStepAttribute]: activeHintSignal.val,
      className: `${tooltipReferenceLayerClassName} ${hintReferenceClassName}`,
    },
    tooltip
  );

  setTimeout(() => {
    setPositionRelativeTo(
      targetElement,
      referenceLayer,
      props.hintItem.hintTooltipElement as HTMLElement,
      helperElementPadding
    );
  }, 1);

  return referenceLayer;
};
