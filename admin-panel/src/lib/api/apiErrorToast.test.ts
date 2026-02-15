import { describe, it, expect, beforeEach } from "vitest";
import {
  shouldShowApiErrorOnce,
  resetApiErrorToastCooldownForTests,
} from "./apiErrorToast";

describe("apiErrorToast", () => {
  beforeEach(() => {
    resetApiErrorToastCooldownForTests();
  });

  describe("خطای شبکه (network)", () => {
    it("اولین بار خطای شبکه را نشان می‌دهد", () => {
      expect(shouldShowApiErrorOnce("خطا در دریافت پاسخ از سرور")).toBe(true);
    });

    it("دومین بار همان خطای شبکه را در cooldown نشان نمی‌دهد", () => {
      expect(shouldShowApiErrorOnce("خطا در دریافت پاسخ از سرور")).toBe(true);
      expect(shouldShowApiErrorOnce("خطا در دریافت پاسخ از سرور")).toBe(false);
    });

    it("پیام fetch failed را به‌عنوان شبکه می‌شناسد", () => {
      expect(shouldShowApiErrorOnce("Failed to fetch")).toBe(true);
      expect(shouldShowApiErrorOnce("Failed to fetch")).toBe(false);
    });

    it("پیام خطای اتصال را به‌عنوان شبکه می‌شناسد", () => {
      expect(shouldShowApiErrorOnce("خطای اتصال به سرور")).toBe(true);
      expect(shouldShowApiErrorOnce("خطای اتصال به سرور")).toBe(false);
    });
  });

  describe("خطای نت ملی", () => {
    it("اولین بار خطای نت ملی را نشان می‌دهد", () => {
      expect(shouldShowApiErrorOnce("خطای نت ملی")).toBe(true);
    });

    it("دومین بار همان خطای نت ملی را در cooldown نشان نمی‌دهد", () => {
      expect(shouldShowApiErrorOnce("خطای نت ملی")).toBe(true);
      expect(shouldShowApiErrorOnce("خطای نت ملی")).toBe(false);
    });

    it("پیام «نت ملی» با فاصله را می‌شناسد", () => {
      expect(shouldShowApiErrorOnce("اتصال به نت ملی قطع است")).toBe(true);
      expect(shouldShowApiErrorOnce("اتصال به نت ملی قطع است")).toBe(false);
    });
  });

  describe("خطای ۵۰۰ سرور", () => {
    it("اولین بار خطای ۵۰۰ را نشان می‌دهد", () => {
      expect(shouldShowApiErrorOnce("Internal Server Error", 500)).toBe(true);
    });

    it("دومین بار همان خطای ۵۰۰ را در cooldown نشان نمی‌دهد", () => {
      expect(shouldShowApiErrorOnce("خطا در سرور (500)", 500)).toBe(true);
      expect(shouldShowApiErrorOnce("خطای دیگر سرور (500)", 500)).toBe(false);
    });

    it("از متن (500) کد را استخراج می‌کند و به‌عنوان ۵xx می‌شناسد", () => {
      expect(shouldShowApiErrorOnce("خطا در دریافت پاسخ از سرور (500)")).toBe(true);
      expect(shouldShowApiErrorOnce("خطا در دریافت پاسخ از سرور (500)")).toBe(false);
    });

    it("۵۰۲ و ۵۰۳ را به‌عنوان ۵xx می‌شناسد", () => {
      expect(shouldShowApiErrorOnce("Bad Gateway", 502)).toBe(true);
      expect(shouldShowApiErrorOnce("Service Unavailable", 503)).toBe(true);
      expect(shouldShowApiErrorOnce("Bad Gateway", 502)).toBe(false);
    });
  });

  describe("خطای ۴xx (همیشه نشان بده)", () => {
    it("خطای ۴۰۴ هر بار نشان داده می‌شود", () => {
      expect(shouldShowApiErrorOnce("صفحه یافت نشد", 404)).toBe(true);
      expect(shouldShowApiErrorOnce("صفحه یافت نشد", 404)).toBe(true);
    });

    it("خطای ۴۰۳ هر بار نشان داده می‌شود", () => {
      expect(shouldShowApiErrorOnce("دسترسی غیرمجاز", 403)).toBe(true);
      expect(shouldShowApiErrorOnce("دسترسی غیرمجاز", 403)).toBe(true);
    });
  });

  describe("بعد از reset", () => {
    it("بعد از reset دوباره همان خطا نشان داده می‌شود", () => {
      expect(shouldShowApiErrorOnce("خطای نت ملی")).toBe(true);
      expect(shouldShowApiErrorOnce("خطای نت ملی")).toBe(false);
      resetApiErrorToastCooldownForTests();
      expect(shouldShowApiErrorOnce("خطای نت ملی")).toBe(true);
    });
  });
});
