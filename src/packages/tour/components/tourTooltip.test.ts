import {
  content,
  find,
  nextButton,
  prevButton,
  skipButton,
  tooltipText,
} from "../../../../tests/jest/helper";
import { getMockTourTooltipProps } from "../mock";
import { TourTooltip } from "./TourTooltip";
import { progressBarClassName, bulletsClassName } from "../classNames";

describe("TourTooltip", () => {
  let mockProps: ReturnType<typeof getMockTourTooltipProps>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockProps = getMockTourTooltipProps();
    document.body.innerHTML = ""; // Clear previous test DOM
  });

  test("should render correctly", async () => {
    const tooltip = TourTooltip(mockProps);
    document.body.appendChild(tooltip); 
  
    // Assert
    expect(content(tooltipText())).toBe(mockProps.step.intro);
    expect(content(skipButton())).toBe(mockProps.skipLabel);
    expect(content(nextButton())).toBe(mockProps.nextLabel);
  });

  test("should call onNextClick when next button is clicked", async () => {
    const tooltip = TourTooltip(mockProps);
    document.body.appendChild(tooltip);
  
    // Act
    nextButton().click();

    // Assert
    expect(mockProps.onNextClick).toBeCalledTimes(1);
  });

  test("should call onPrevClick when prev button is clicked", async () => {
    // Arrange
    mockProps.currentStep = 1;
    const tooltip = TourTooltip(mockProps);
    document.body.appendChild(tooltip);
  
    // Act
    prevButton().click();

    // Assert
    expect(mockProps.onPrevClick).toBeCalledTimes(1);
  });

  test("should call onSkipClick when skip button is clicked", async () => {
    // Arrange
    const tooltip = TourTooltip(mockProps);
    document.body.appendChild(tooltip);
  
    // Act
    skipButton().click();

    // Assert
    expect(mockProps.onSkipClick).toBeCalledTimes(1);
  });

  test("should toggle 'Don't Show Again' checkbox", async () => {
    // Arrange
    mockProps.dontShowAgain = true;
    const tooltip = TourTooltip(mockProps);
    document.body.appendChild(tooltip);
  
    // Act
    const checkbox = find(".introjs-dontShowAgain input");
    checkbox.click();

    // Assert
    expect(mockProps.onDontShowAgainChange).toBeCalledWith(true);
  });

  test("should not render 'Don't Show Again' checkbox if disabled", async () => {
    // Arrange
    mockProps.dontShowAgain = false;

    // Act
    const tooltip = TourTooltip(mockProps);
    document.body.appendChild(tooltip);
  
    // Assert
    expect(find(".introjs-dontShowAgain")).toBeNull();
  });

  test("should render bullets if enabled", async () => {
    // Arrange
    mockProps.bullets = true;

    // Act
    const tooltip = TourTooltip(mockProps);
    document.body.appendChild(tooltip);
  
    // Assert
    expect(find(`.${bulletsClassName}`)).not.toBeNull();
  });

  test("should call onBulletClick when a bullet is clicked", async () => {
    // Arrange
    mockProps.bullets = true;
    const tooltip = TourTooltip(mockProps);
    document.body.appendChild(tooltip);
  
    // Act
    const bullet = find(`.${bulletsClassName} a`);
    bullet.click();

    // Assert
    expect(mockProps.onBulletClick).toBeCalled();
  });

  test("should update progress bar correctly", async () => {
    // Arrange
    mockProps.progress = true;
    mockProps.currentStep = 1;
    mockProps.steps = getMockTourTooltipProps().steps;

    // Act
    const tooltip = TourTooltip(mockProps);
    document.body.appendChild(tooltip);
  
    // Assert
    const progressBar = find(`.${progressBarClassName}`);
    expect(progressBar).not.toBeNull();
    expect(progressBar.style.width).toBe("40%");
  });

  test("should highlight the target element", async () => {
    // Arrange
    const targetElement = document.createElement("div");
    targetElement.classList.add("target-element");
    document.body.appendChild(targetElement);

    mockProps.step = { ...mockProps.step, element: targetElement };

    // Act
    const tooltip = TourTooltip(mockProps);
    document.body.appendChild(tooltip);
  
    // Assert
    expect(targetElement.className).toContain("introjs-showElement");
  });
});
