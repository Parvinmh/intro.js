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

export const TourRoot = ({ tour }: TourRootProps) => {
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
    // helperLayer should not be re-rendered when the state changes for the transition to work
    helperLayer,
    () => {
      // do not remove this check, it is necessary for this state-binding to work
      // and render the entire section every time the state changes
      if (currentStepSignal.val === undefined) {
        return null;
      }

      const step = dom.derive(() =>
        currentStepSignal.val !== undefined
          ? steps[currentStepSignal.val]
          : null
      );

      if (!step.val) {
        return null;
      }

      const exitOnOverlayClick = tour.getOption("exitOnOverlayClick") === true;
      const overlayLayer = OverlayLayer({
        exitOnOverlayClick,
        onExitTour: async () => {
          return tour.exit();
        },
      });

      const referenceLayer = ReferenceLayer({
        step: step.val,
        targetElement: tour.getTargetElement(),
        refreshes: refreshesSignal,
        helperElementPadding: tour.getOption("helperElementPadding"),

        transitionDuration: tooltipTransitionDuration,

        positionPrecedence: tour.getOption("positionPrecedence"),
        autoPosition: tour.getOption("autoPosition"),
        showStepNumbers: tour.getOption("showStepNumbers"),

        steps: tour.getSteps(),
        currentStep: currentStepSignal.val,

        onBulletClick: (stepNumber: number) => {
          tour.goToStep(stepNumber);
        },

        bullets: tour.getOption("showBullets"),

        buttons: tour.getOption("showButtons"),
        nextLabel: "Next",
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
        className: tour.getOption("tooltipClass"),
        progress: tour.getOption("showProgress"),
        progressBarAdditionalClass: tour.getOption(
          "progressBarAdditionalClass"
        ),

        stepNumbers: tour.getOption("showStepNumbers"),
        stepNumbersOfLabel: tour.getOption("stepNumbersOfLabel"),

        scrollToElement: tour.getOption("scrollToElement"),
        scrollPadding: tour.getOption("scrollPadding"),

        dontShowAgain: tour.getOption("dontShowAgain"),
        onDontShowAgainChange: (checked: boolean) => {
          tour.setDontShowAgain(checked);
        },
        dontShowAgainLabel: tour.getOption("dontShowAgainLabel"),
      });

      const disableInteraction = step.val.disableInteraction
        ? DisableInteraction({
            currentStep: currentStepSignal,
            steps: tour.getSteps(),
            refreshes: refreshesSignal,
            targetElement: tour.getTargetElement(),
            helperElementPadding: tour.getOption("helperElementPadding"),
          })
        : null;

      // wait for the helper layer to be rendered before showing the tooltip
      // this is to prevent the tooltip from flickering when the helper layer is transitioning
      // the 300ms delay is coming from the helper layer transition duration
      tooltipTransitionDuration = 300;

      return div(overlayLayer, referenceLayer, disableInteraction);
    }
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
