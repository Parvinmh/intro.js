import dom from "../dom";
import { Tooltip } from "./tooltip";
import { axe, toHaveNoViolations } from "jest-axe";
import { appendMockSteps, getMockSteps, getMockTour } from "../tour/mock";

expect.extend(toHaveNoViolations);

describe("Tour Tooltip", () => {
  let container: HTMLElement;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.setTimeout(50000);
    document.body.innerHTML = "";
    container = document.createElement("main");
    container.setAttribute("role", "main");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  beforeAll(() => {
    Object.defineProperty(global, "navigator", {
      value: { language: "en-US" },
      writable: true,
    });
  });

  test("all tooltips should have the correct class name", async () => {
    // Arrange: append mock elements
    const container = document.createElement("div");
    document.body.appendChild(container);
    appendMockSteps(container);

    // Arrange: initialize mock tour with steps
    const mockTour = getMockTour(container);
    mockTour.setOptions({
      steps: getMockSteps(),
    });

    // Act: start the tour
    await mockTour.start();

    // Assert: check tooltip class for each step
    for (let i = 0; i < mockTour.getSteps().length; i++) {
      const step = mockTour.getStep(i);

      const tooltip = await Tooltip({
        className: "custom-tooltip",
        element: step.element as HTMLElement,
        position: step.position,
        refreshes: dom.state(0),
        showStepNumbers: true,
        autoPosition: false,
        positionPrecedence: ["top", "bottom"],
        hintMode: false,
        text: step.title || step.intro,
      });

      expect(tooltip.className).toContain("custom-tooltip");

      if (i < mockTour.getSteps().length - 1) {
        await mockTour.nextStep();
      }
    }
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
