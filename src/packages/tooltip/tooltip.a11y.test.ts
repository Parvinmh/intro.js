import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Accessibility", () => {
  it("should have no a11y violations", async () => {
    const html = `
      <div role="">
        <button>Click me</button>
      </div>
    `;

    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
});
