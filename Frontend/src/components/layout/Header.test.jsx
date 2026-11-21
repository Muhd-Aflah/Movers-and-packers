import { fireEvent, render, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  theme: "light",
  setTheme: vi.fn(),
  getAuthFromStorage: vi.fn(() => ({ token: null })),
}));

vi.mock("../../store/appContext", () => ({
  useApp: () => ({ theme: mocks.theme, setTheme: mocks.setTheme }),
}));

vi.mock("../../utils/auth", () => ({
  getAuthFromStorage: mocks.getAuthFromStorage,
  clearAuthStorage: vi.fn(),
}));

import { Header } from "./Header";

const renderHeader = () => render(
  <MemoryRouter>
    <Header />
  </MemoryRouter>,
);

describe("Header authentication actions", () => {
  beforeEach(() => {
    mocks.theme = "light";
    mocks.setTheme.mockClear();
  });

  it.each(["light", "dark"])("keeps the desktop buttons legible in %s theme", (theme) => {
    mocks.theme = theme;
    const { container } = renderHeader();
    const actions = container.querySelector("div.hidden.lg\\:flex");
    const signIn = within(actions).getByRole("link", { name: "Sign In" });
    const signUp = within(actions).getByRole("link", { name: "Sign Up" });

    expect(signIn.getAttribute("href")).toBe("/login");
    expect(signUp.getAttribute("href")).toBe("/signup");
    expect(signIn.className).toContain("bg-white");
    expect(signIn.className).toContain("text-blue-700");
    expect(signIn.className).toContain("dark:bg-white");
    expect(signIn.className).toContain("dark:text-blue-700");
    expect(signIn.className).toContain("hover:text-blue-800");
    expect(signIn.className).toContain("focus-visible:ring-2");
    expect(signUp.className).toContain("bg-blue-600");
    expect(signUp.className).toContain("text-white");
    expect(signUp.className).toContain("dark:text-white");
    expect(signUp.className).toContain("dark:hover:bg-blue-700");

    for (const className of ["min-h-11", "h-11", "rounded-control", "px-4", "py-2", "items-center"]) {
      expect(signIn.className).toContain(className);
      expect(signUp.className).toContain(className);
    }
  });

  it("keeps the mobile menu responsive and uses the same auth button styles", () => {
    const { container } = renderHeader();
    expect(container.querySelector("#mobile-navigation")).toBeNull();

    fireEvent.click(within(container).getByRole("button", { name: "Open navigation menu" }));
    const mobileMenu = container.querySelector("#mobile-navigation");
    expect(mobileMenu).not.toBeNull();
    expect(mobileMenu.className).toContain("lg:hidden");

    const mobileNav = within(mobileMenu);
    const [signIn] = mobileNav.getAllByRole("link", { name: "Sign In" });
    const [signUp] = mobileNav.getAllByRole("link", { name: "Sign Up" });
    expect(signIn.className).toContain("w-full");
    expect(signIn.className).toContain("bg-white");
    expect(signIn.className).toContain("text-blue-700");
    expect(signIn.className).toContain("hover:text-blue-800");
    expect(signUp.className).toContain("w-full");
    expect(signUp.className).toContain("bg-blue-600");
    expect(signUp.className).toContain("text-white");
    expect(signUp.className).toContain("focus-visible:ring-2");
  });
});
