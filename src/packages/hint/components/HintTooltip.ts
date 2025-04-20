import { Tooltip, TooltipProps } from "../../tooltip/tooltip";
import dom from "../../dom";
import { tooltipTextClassName } from "../className";
import { HintItem } from "../hintItem";
import { TooltipContent } from "../../tooltip/tooltipContent";

const { a, p, div } = dom.tags;

export type HintTooltipProps = Omit<
  TooltipProps,
  "hintMode" | "element" | "position"
> & {
  hintItem: HintItem;
  closeButtonEnabled: boolean;
  closeButtonOnClick: (hintItem: HintItem) => void;
  closeButtonLabel: string;
  closeButtonClassName: string;
  className?: string;
  renderAsHtml?: boolean;
};

export const HintTooltip = ({
  hintItem,
  closeButtonEnabled,
  closeButtonOnClick,
  closeButtonLabel,
  closeButtonClassName,
  className,
  renderAsHtml,
  ...props
}: HintTooltipProps) => {
  const text = hintItem.hint;

  return Tooltip(
    {
      ...props,
      element: hintItem.hintTooltipElement as HTMLElement,
      position: hintItem.position,
      hintMode: true,
      onClick: (e: Event) => {
        //IE9 & Other Browsers
        if (e.stopPropagation) {
          e.stopPropagation();
        }
        //IE8 and Lower
        else {
          e.cancelBubble = true;
        }
      },
    },
    [
      div(
        { className: `${tooltipTextClassName} ${className || ""}` },
        TooltipContent({
          text: text || "",
          tooltipRenderAsHtml: renderAsHtml,
          className: tooltipTextClassName,
        }),
        p(hintItem.hint || ""),
        closeButtonEnabled
          ? a(
              {
                className: closeButtonClassName,
                role: "button",
                onclick: () => closeButtonOnClick(hintItem),
              },
              closeButtonLabel
            )
          : null
      ),
    ]
  );
};
