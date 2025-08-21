import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

function getMockHint(container: HTMLElement) {
  let options: any = {};
  let hintsAddedCb: Function | null = null;
  let hintClickCb: Function | null = null;
  let hintCloseCb: Function | null = null;

  return {
    setOptions(opts: any) {
      options = opts;
      return this;
    },
    addHints() {
      if (!options.hints) return;
      options.hints.forEach((h: any, idx: number) => {
        const el =
          typeof h.element === "string"
            ? container.querySelector(h.element)
            : h.element;
        if (!el) return;

        // create mock hint element
        const hintEl = document.createElement("button");
        hintEl.setAttribute("data-hint-id", idx.toString());
        hintEl.setAttribute("aria-label", h.hint || "Hint");
        hintEl.textContent = "?";
        el.insertAdjacentElement("afterend", hintEl);

        hintEl.addEventListener("click", () => {
          if (hintClickCb) hintClickCb(hintEl, h, idx);
        });
      });
      if (hintsAddedCb) hintsAddedCb();
    },
    onhintsadded(cb: Function) {
      hintsAddedCb = cb;
    },
    onhintclick(cb: Function) {
      hintClickCb = cb;
    },
    onhintclose(cb: Function) {
      hintCloseCb = cb;
    },
    closeHint(stepId: number) {
      const el = container.querySelector(`[data-hint-id="${stepId}"]`);
      if (el) {
        el.remove();
        if (hintCloseCb) hintCloseCb(stepId);
      }
    },
    getHints() {
      return options.hints || [];
    },
  };
}

test("should have no accessibility violations for all hints", async () => {
  const container = document.createElement("main");
  container.setAttribute("role", "main");
  document.body.appendChild(container);

  // Mock target elements
  const btn = document.createElement("button");
  btn.id = "btn";
  btn.textContent = "Click me";
  container.appendChild(btn);

  const img = document.createElement("img");
  img.id = "img";
  img.src = "https://via.placeholder.com/100";
  img.alt = "Sample image";
  container.appendChild(img);

  // Create mock hint
  const mockHint = getMockHint(container);
  mockHint.setOptions({
    hints: [
      { element: "#btn", hint: "This is a button" },
      { element: "#img", hint: "This is an image" },
    ],
  });

  mockHint.onhintsadded(() => console.log("Hints added"));
  type HintOption = { element: string | HTMLElement; hint?: string };

  mockHint.onhintclick((item: HintOption, idx: number) =>
    console.log("Hint clicked", idx, item)
  );
  mockHint.onhintclose((idx: number) => console.log("Hint closed", idx));

  // Add hints
  mockHint.addHints();

  // Run accessibility test
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
