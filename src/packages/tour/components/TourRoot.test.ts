import { TourRoot } from "./TourRoot";

jest.mock("./OverlayLayer", () => ({
  OverlayLayer: jest.fn(() => "OverlayLayer"),
}));
jest.mock("./DisableInteraction", () => ({
  DisableInteraction: jest.fn(() => "DisableInteraction"),
}));
jest.mock("./HelperLayer", () => ({
  HelperLayer: jest.fn(() => "HelperLayer"),
}));
jest.mock("./ReferenceLayer", () => ({
  ReferenceLayer: jest.fn(() => "ReferenceLayer"),
}));
jest.mock("../steps", () => ({ nextStep: jest.fn(), previousStep: jest.fn() }));

jest.useFakeTimers();

describe("TourRoot", () => {
  let tour: any;

  beforeEach(() => {
    tour = {
      getCurrentStepSignal: jest.fn(() => ({ val: 0 })),
      getRefreshesSignal: jest.fn(() => ({ val: 0 })),
      getStepReadySignal: jest.fn(() => ({ val: true })),
      getSteps: jest.fn(() => [
        {
          disableInteraction: false,
          element: document.createElement("div"),
          intro: "test",
        },
      ]),
      getTargetElement: jest.fn(() => document.createElement("div")),
      getOption: jest.fn((option: keyof typeof Option) => {
        const options = {
          highlightClass: "highlight",
          overlayOpacity: 0.5,
          helperElementPadding: 10,
          exitOnOverlayClick: true,
          positionPrecedence: ["top", "bottom"],
          autoPosition: true,
          showStepNumbers: true,
          showBullets: true,
          showButtons: true,
          tooltipClass: "tooltip",
          nextToDone: false,
          showProgress: true,
          scrollToElement: true,
          scrollPadding: 20,
          dontShowAgain: false,
        };
        return options[option];
      }),
      exit: jest.fn(),
      goToStep: jest.fn(),
      isLastStep: jest.fn(() => false),
      getCurrentStep: jest.fn(() => 0),
      callback: jest.fn(() => jest.fn()),
      setDontShowAgain: jest.fn(),
    };
  });

  it("renders correctly and initializes state", () => {
    // Arrange
    // Act
    const component = TourRoot({ tour });

    // Assert
    expect(component).toBeDefined();
  });
});
