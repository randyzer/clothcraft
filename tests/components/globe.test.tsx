import { render, waitFor } from "@testing-library/react";
import { Globe } from "@/components/globe";
import createGlobe from "cobe";

vi.mock("cobe", () => ({
  default: vi.fn(() => ({
    destroy: vi.fn(),
  })),
}));

describe("Globe", () => {
  const getContext = HTMLCanvasElement.prototype.getContext;

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = getContext;
    vi.clearAllMocks();
  });

  it("does not initialize cobe when WebGL is unavailable", async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as typeof getContext;

    render(<Globe />);

    await waitFor(() => {
      expect(createGlobe).not.toHaveBeenCalled();
    });
  });
});
