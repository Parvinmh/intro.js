import dom from "../../dom";
import { ReferenceLayer } from "./ReferenceLayer";
import { HelperLayer } from "./HelperLayer";
import { Tour } from "../tour";
import { DisableInteraction } from "./DisableInteraction";
import { OverlayLayer } from "./OverlayLayer";
import { nextStep, previousStep } from "../steps";
import { doneButtonClassName } from "../classNames";
import { style } from "../../../util/style";

const { div } = dom.tags;

export type TourRootProps = {
  tour: Tour;
};

export const TourRoot = async ({
  tour,
}: TourRootProps): Promise<HTMLElement> => {
  const currentStepSignal = tour.getCurrentStepSignal();
  const refreshesSignal = tour.getRefreshesSignal();
  const steps = tour.getSteps();

  const helperLayer = HelperLayer({
    currentStep: currentStepSignal,
    steps,
    refreshes: refreshesSignal,
    targetElement: tour.getTargetElement(),
    tourHighlightClass: tour.getOption("highlightClass"),
    overlayOpacity: tour.getOption("overlayOpacity"),
    helperLayerPadding: tour.getOption("helperElementPadding"),
  });

  const opacity = dom.state(0);
  // render the tooltip immediately when the tour starts
  // but we reset the transition duration to 300ms when the tooltip is rendered for the first time
  let tooltipTransitionDuration = 0;

  const root = div(
    {
      className: "introjs-tour",
      style: () => style({ opacity: `${opacity.val}` }),
    },
    helperLayer
  );

  const dynamicSection = div();
  root.appendChild(dynamicSection);

  // Watch for step changes
  dom.derive(async () => {
    const stepVal =
      currentStepSignal.val !== undefined ? steps[currentStepSignal.val] : null;
    if (!stepVal) {
      dynamicSection.innerHTML = "";
      return;
    }

    // Overlay layer
    const overlayLayer = OverlayLayer({
      exitOnOverlayClick: tour.getOption("exitOnOverlayClick") === true,
      onExitTour: async () => tour.exit(),
    });

    // Disable interaction
    const disableInteractionEl = stepVal.disableInteraction
      ? DisableInteraction({
          currentStep: currentStepSignal,
          steps,
          refreshes: refreshesSignal,
          targetElement: tour.getTargetElement(),
          helperElementPadding: tour.getOption("helperElementPadding"),
        })?.()
      : null;

    // Placeholder for async tooltip
    const referencePlaceholder = div();

    // Clear and append overlay + placeholder first
    dynamicSection.innerHTML = "";
    dynamicSection.append(overlayLayer, referencePlaceholder);
    if (disableInteractionEl) dynamicSection.append(disableInteractionEl);

    // Wait for tooltip creation before replacing placeholder
    const referenceLayer = await ReferenceLayer({
      step: stepVal,
      targetElement: tour.getTargetElement(),
      refreshes: refreshesSignal,
      helperElementPadding: tour.getOption("helperElementPadding"),
      transitionDuration: tooltipTransitionDuration,
      positionPrecedence: tour.getOption("positionPrecedence"),
      autoPosition: tour.getOption("autoPosition"),
      showStepNumbers: tour.getOption("showStepNumbers"),
      steps,
      currentStep: currentStepSignal.val!,
      onBulletClick: (stepNumber: number) => tour.goToStep(stepNumber),
      bullets: tour.getOption("showBullets"),
      buttons: tour.getOption("showButtons"),
      nextLabel: tour.getOption("nextLabel"),
      onNextClick: async (e: any) => {
        if (!tour.isLastStep()) await nextStep(tour);
        else if (
          new RegExp(doneButtonClassName, "gi").test(
            (e.target as HTMLElement).className
          )
        ) {
          await tour
            .callback("complete")
            ?.call(tour, tour.getCurrentStep(), "done");
          await tour.exit();
        }
      },
      prevLabel: tour.getOption("prevLabel"),
      onPrevClick: async () => {
        const currentStep = tour.getCurrentStep();
        if (currentStep !== undefined && currentStep > 0)
          await previousStep(tour);
      },
      skipLabel: tour.getOption("skipLabel"),
      onSkipClick: async () => {
        if (tour.isLastStep())
          await tour
            .callback("complete")
            ?.call(tour, tour.getCurrentStep(), "skip");
        await tour.callback("skip")?.call(tour, tour.getCurrentStep());
        await tour.exit();
      },
      buttonClass: tour.getOption("buttonClass"),
      nextToDone: tour.getOption("nextToDone"),
      doneLabel: tour.getOption("doneLabel"),
      hideNext: tour.getOption("hideNext"),
      hidePrev: tour.getOption("hidePrev"),
      className: stepVal.tooltipClass || tour.getOption("tooltipClass"),
      progress: tour.getOption("showProgress"),
      progressBarAdditionalClass: tour.getOption("progressBarAdditionalClass"),
      stepNumbers: tour.getOption("showStepNumbers"),
      stepNumbersOfLabel: tour.getOption("stepNumbersOfLabel"),
      scrollToElement: tour.getOption("scrollToElement"),
      scrollPadding: tour.getOption("scrollPadding"),
      dontShowAgain: tour.getOption("dontShowAgain"),
      onDontShowAgainChange: (checked: boolean) =>
        tour.setDontShowAgain(checked),
      dontShowAgainLabel: tour.getOption("dontShowAgainLabel"),
      renderAsHtml: tour.getOption("tooltipRenderAsHtml"),
      text: stepVal.title || stepVal.intro,
    });

    if (referenceLayer) {
      referencePlaceholder.replaceWith(referenceLayer);
    }
  });

  // Fade-in root
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      opacity.val = 1;
      resolve();
    }, tooltipTransitionDuration);
  });

  console.log("TourRoot added");
  return root;
};
