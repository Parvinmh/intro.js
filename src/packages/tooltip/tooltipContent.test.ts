import { TooltipContent } from "./tooltipContent";

describe("TooltipContent", () => {
  it("renders plain text when tooltipRenderAsHtml is false", () => {
    const el = TooltipContent({
      text: "<strong>Bold Text</strong>",
      tooltipRenderAsHtml: false,
      className: "tooltip-text",
    });

    expect(el.innerHTML).toBe("&lt;strong&gt;Bold Text&lt;/strong&gt;");
    expect(el.querySelector("strong")).toBeNull();
  });

  it("renders HTML content when tooltipRenderAsHtml is true", () => {
    const el = TooltipContent({
      text: "<strong>Bold Text</strong>",
      tooltipRenderAsHtml: true,
      className: "tooltip-text",
    });

    expect(el.innerHTML).toBe("<strong>Bold Text</strong>");
    expect(el.querySelector("strong")?.textContent).toBe("Bold Text");
  });

  it("applies a custom class when provided", () => {
    const el = TooltipContent({
      text: "Custom class test",
      className: "my-custom-tooltip",
    });

    expect(el.className).toBe("my-custom-tooltip");
    expect(el.textContent).toBe("Custom class test");
  });
});
