import { Header } from "./TourTooltip";

describe("Header", () => {
  it("renders plain text title when renderAsHtml is false", async () => {
    const el = await Header({
      title: "<strong>Bold Text</strong>",
      skipLabel: "Skip",
      renderAsHtml: false,
      onSkipClick: jest.fn(),
    });

    const h1 = el.querySelector("h1")!;

    expect(h1.innerHTML).toBe("&lt;strong&gt;Bold Text&lt;/strong&gt;");
    expect(h1.querySelector("strong")).toBeNull();
  });

  it("renders HTML title when renderAsHtml is true", async () => {
    const el = await Header({
      title: "<strong>Bold Text</strong>",
      skipLabel: "Skip",
      renderAsHtml: true,
      onSkipClick: jest.fn(),
    });

    const h1 = el.querySelector("h1")!;

    expect(h1.innerHTML).toBe("<strong>Bold Text</strong>");
    expect(h1.querySelector("strong")?.textContent).toBe("Bold Text");
  });
});
