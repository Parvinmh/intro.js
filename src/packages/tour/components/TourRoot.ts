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
  const stepReadySignal = tour.getStepReadySignal();
  const steps = tour.getSteps();

  const helperLayer = await HelperLayer({
    currentStep: currentStepSignal,
    steps,
    refreshes: refreshesSignal,
    stepReady: stepReadySignal,
    targetElement: tour.getTargetElement(),
    tourHighlightClass: tour.getOption("highlightClass"),
    overlayOpacity: tour.getOption("overlayOpacity"),
    helperLayerPadding: tour.getOption("helperElementPadding"),
  });

  const opacity = dom.state(0);
  let tooltipTransitionDuration = 0;

  const overlayLayer = await OverlayLayer({
    exitOnOverlayClick: tour.getOption("exitOnOverlayClick") === true,
    onExitTour: async () => tour.exit(),
  });

  // Placeholders that will be replaced later
  let referencePlaceholder: HTMLElement = div();
  let disableInteractionPlaceholder: HTMLElement = div();

  dom.derive(async () => {
    const currentIndex = currentStepSignal.val;
    if (currentIndex === undefined) return;
    const step = steps[currentIndex];
    if (!step) return;

    // Only proceed if step is ready (onBeforeChange has been called)
    if (!stepReadySignal.val) return;

    // --- ReferenceLayer ---
    const referenceLayer = await ReferenceLayer({
      step,
      targetElement: tour.getTargetElement(),
      refreshes: refreshesSignal,
      helperElementPadding: tour.getOption("helperElementPadding"),
      positionPrecedence: tour.getOption("positionPrecedence"),
      autoPosition: tour.getOption("autoPosition"),
      showStepNumbers: tour.getOption("showStepNumbers"),
      steps,
      currentStep: currentIndex,
      onBulletClick: (stepNumber: number) => tour.goToStep(stepNumber),
      bullets: tour.getOption("showBullets"),
      buttons: tour.getOption("showButtons"),
      nextLabel: tour.getOption("nextLabel"),
      onNextClick: async (e: any) => {
        if (!tour.isLastStep()) {
          await nextStep(tour);
        } else if (
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
        if (currentStep !== undefined && currentStep > 0) {
          await previousStep(tour);
        }
      },
      skipLabel: tour.getOption("skipLabel"),
      onSkipClick: async () => {
        if (tour.isLastStep()) {
          await tour
            .callback("complete")
            ?.call(tour, tour.getCurrentStep(), "skip");
        }

        await tour.callback("skip")?.call(tour, tour.getCurrentStep());

        await tour.exit();
      },
      buttonClass: tour.getOption("buttonClass"),
      nextToDone: tour.getOption("nextToDone"),
      doneLabel: tour.getOption("doneLabel"),
      hideNext: tour.getOption("hideNext"),
      hidePrev: tour.getOption("hidePrev"),
      className: step.tooltipClass || tour.getOption("tooltipClass"),
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
      text: step.title || step.intro,
      transitionDuration: tooltipTransitionDuration,
    });

    referencePlaceholder.replaceWith(
      referenceLayer ?? document.createElement("div")
    );
    referencePlaceholder = referenceLayer ?? document.createElement("div");

    // --- DisableInteraction ---
    const disableInteraction =
      step.disableInteraction === true
        ? await DisableInteraction({
            currentStep: currentStepSignal,
            steps,
            refreshes: refreshesSignal,
            targetElement: tour.getTargetElement(),
            helperElementPadding: tour.getOption("helperElementPadding"),
          })
        : div();

    disableInteractionPlaceholder.replaceWith(
      disableInteraction ?? document.createElement("div")
    );
    disableInteractionPlaceholder =
      disableInteraction ?? document.createElement("div");
  });

  // Root container
  const root = div(
    {
      className: "introjs-tour",
      style: () => style({ opacity: `${opacity.val}` }),
    },
    helperLayer,
    overlayLayer,
    referencePlaceholder,
    disableInteractionPlaceholder
  );

  dom.derive(() => {
    // to clean up the root element when the tour is done
    if (currentStepSignal.val === undefined) {
      opacity.val = 0;

      setTimeout(() => {
        root.remove();
      }, 250);
    }
  });

  setTimeout(() => {
    // fade in the root element
    opacity.val = 1;
  }, 1);

  return root;
};
