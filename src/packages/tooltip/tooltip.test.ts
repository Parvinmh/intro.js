import dom from "../dom";
import { Tooltip, TooltipProps } from "./tooltip";
import { axe, toHaveNoViolations } from "jest-axe";
import { appendMockSteps, getMockSteps, getMockTour } from "../tour/mock";

expect.extend(toHaveNoViolations);

describe("Tour Tooltip", () => {
  it("should set the correct class name", () => {
    // Arrange
    const stubClassName = "custom-tooltip";
    const props: TooltipProps = {
      className: stubClassName,
      element: document.createElement("div"),
      position: "top",
      refreshes: dom.state(0),
      showStepNumbers: true,
      autoPosition: false,
      positionPrecedence: ["top", "bottom"],
      hintMode: false,
    };

    // Act
    const tooltip = Tooltip(props);

    // Assert
    expect(tooltip.className).toContain(stubClassName);
  });

  let container: HTMLElement;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.setTimeout(50000);
    container = document.createElement("main");
    container.setAttribute("role", "main");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test("should have no accessibility violations across all tour tooltips", async () => {
    // Arrange: append mock elements
    appendMockSteps(container);

    // Arrange: initialize mock tour with steps
    const mockTour = getMockTour(container);
    mockTour.setOptions({
      steps: getMockSteps(),
    });

    // Act: start the tour
    await mockTour.start();

    // Assert: check accessibility for each tooltip step
    for (let i = 0; i < mockTour.getSteps().length; i++) {
      const results = await axe(document.body);
      expect(results).toHaveNoViolations();

      if (i < mockTour.getSteps().length - 1) {
        await mockTour.nextStep();
      }
    }
  });
});
