import dom from "../dom";

const { div } = dom.tags;

export type tooltipContentProps = {
  text: string;
  className: string;
  tooltipRenderAsHtml?: boolean;
};

export const TooltipContent = ({
  text,
  tooltipRenderAsHtml,
  className,
}: tooltipContentProps) => {
  const container = div({
    className,
  });

  dom.derive(() => {
    const el = container as HTMLElement;
    if (!el) return;

    // Clear existing content
    el.innerHTML = "";

    if (tooltipRenderAsHtml && text) {
      const fragment = document.createRange().createContextualFragment(text);
      el.appendChild(fragment);
    } else {
      el.textContent = text;
    }
  });

  return container;
};
