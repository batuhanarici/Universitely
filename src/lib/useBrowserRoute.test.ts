import { describe, expect, it } from "vitest";
import { resolveRoutePath } from "./useBrowserRoute";

describe("resolveRoutePath", () => {
  const studentRoutes = ["/student/dashboard", "/student/analysis"] as const;

  it("geçerli pathname’i korur", () => {
    expect(resolveRoutePath("/student/analysis", studentRoutes, "/student/dashboard")).toBe("/student/analysis");
  });

  it("geçersiz pathname’de güvenli fallback’e döner", () => {
    expect(resolveRoutePath("/unknown", studentRoutes, "/student/dashboard")).toBe("/student/dashboard");
  });

  it("panel dışı path’i role paneline taşımaz", () => {
    expect(resolveRoutePath("/coach/dashboard", studentRoutes, "/student/dashboard")).toBe("/student/dashboard");
  });
});
