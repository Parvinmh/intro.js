import { Tooltip, TooltipProps } from "../../tooltip/tooltip";
import dom from "../../dom";
import { tooltipTextClassName } from "../className";
import { HintItem } from "../hintItem";
import { TooltipContent } from "../../tooltip/tooltipContent";

const { a, div } = dom.tags;

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

export const HintTooltip = async ({
  hintItem,
  closeButtonEnabled,
  closeButtonOnClick,
  closeButtonLabel,
  closeButtonClassName,
  className,
  renderAsHtml,
  ...props
}: HintTooltipProps): Promise<HTMLElement> => {
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
          container: div({ className: tooltipTextClassName }),
        }),
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
