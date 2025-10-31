import { determineAutoPosition } from "../tooltip/tooltipPosition";
import type { Offset } from "../../util/getOffset";

const mockViewport = { width: 1000, height: 800 };

const makeOffset = (
  left: number,
  top: number,
  width = 100,
  height = 50
): Offset => ({
  top,
  left,
  width,
  height,
  bottom: top + height,
  right: left + width,
  absoluteTop: top,
  absoluteLeft: left,
  absoluteBottom: top + height,
  absoluteRight: left + width,
});

describe("determineAutoPosition", () => {
  it("should return 'bottom-left-aligned' when there is enough space below", () => {
    const target = makeOffset(400, 200);
    const pos = determineAutoPosition(
      ["bottom", "top"],
      target,
      200,
      100,
      "bottom",
      mockViewport
    );
    expect(pos).toBe("bottom-left-aligned");
  });

  it("should return 'top-left-aligned' when there is no space below", () => {
    const target = makeOffset(400, 750);
    const pos = determineAutoPosition(
      ["bottom", "top"],
      target,
      200,
      100,
      "bottom",
      mockViewport
    );
    expect(pos).toBe("top-left-aligned");
  });

  it("should switch to 'left' when right side has no space", () => {
    const target = makeOffset(950, 400);
    const pos = determineAutoPosition(
      ["right", "left", "top", "bottom"],
      target,
      100,
      50,
      "right",
      mockViewport
    );
    expect(pos).toBe("left");
  });

  it("should fall back to 'floating' when no space anywhere", () => {
    const target = makeOffset(0, 0, 1200, 900);
    const pos = determineAutoPosition(
      ["top", "bottom", "left", "right"],
      target,
      200,
      100,
      "bottom",
      mockViewport
    );
    expect(pos).toBe("floating");
  });

  it("should respect desired alignment if possible", () => {
    const target = makeOffset(400, 200);
    const pos = determineAutoPosition(
      ["bottom", "top"],
      target,
      200,
      100,
      "bottom-right-aligned",
      mockViewport
    );
    expect(pos).toBe("bottom-right-aligned");
  });
});
