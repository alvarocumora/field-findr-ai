import { describe, expect, it } from "vitest";
import { fixedProjectRule, formatCLPCommission, isFixedBrokerProject } from "./fixedProjectRule";

const HUALANE = "761e73ed-cc0d-5605-a06a-4a4348523b4b";
const LICANTEN = "b4363fda-e99f-400d-ae95-2cbc8244b770";
const rules = [
  { scope: "default", project_id: null, is_active: true,
    fixed_sale_amount: null, referral_fixed_amount: 200000 },
  { scope: "project", project_id: HUALANE, is_active: true,
    fixed_sale_amount: 750000, referral_fixed_amount: 200000 },
  { scope: "project", project_id: LICANTEN, is_active: true,
    fixed_sale_amount: 1000000, referral_fixed_amount: 350000 },
];

describe("project commission terms", () => {
  it("displays separate CLP amounts for Hualañé", () => {
    expect(fixedProjectRule(rules, HUALANE)).toEqual({ seller: 750000, captador: 200000 });
  });
  it("displays separate CLP amounts for Licantén", () => {
    expect(fixedProjectRule(rules, LICANTEN)).toEqual({ seller: 1000000, captador: 350000 });
  });
  it("does not present the global fallback as a fixed project agreement", () => {
    expect(fixedProjectRule(rules, "other-project")).toBeNull();
  });
  it("does not display inactive, missing, or malformed amounts", () => {
    expect(fixedProjectRule([{ ...rules[1], is_active: false }], HUALANE)).toBeNull();
    expect(fixedProjectRule([{ ...rules[1], fixed_sale_amount: undefined }], HUALANE)).toBeNull();
    expect(fixedProjectRule([{ ...rules[1], fixed_sale_amount: NaN }], HUALANE)).toBeNull();
    expect(fixedProjectRule([{ ...rules[1], referral_fixed_amount: null }], HUALANE)).toEqual({
      seller: 750000, captador: null,
    });
  });
  it("routes fixed projects through verified broker closing", () => {
    expect(isFixedBrokerProject(HUALANE)).toBe(true);
    expect(isFixedBrokerProject(LICANTEN)).toBe(true);
    expect(isFixedBrokerProject("another-project")).toBe(false);
    expect(isFixedBrokerProject(null)).toBe(false);
  });
  it("formats real amounts in Chilean pesos", () => {
    expect(formatCLPCommission(1000000)).toContain("1.000.000");
  });
});
