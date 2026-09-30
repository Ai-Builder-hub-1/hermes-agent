import type { Page } from "@playwright/test";

export async function mockDashboardBackend(page: Page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === "/api/auth/me") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          user_id: "dashboard-test-user",
          email: "",
          display_name: "",
          provider: "test",
          provider_display_name: "Test",
        }),
      });
      return;
    }

    if (url.pathname === "/api/dashboard/plugins") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
      return;
    }

    if (url.pathname === "/api/profiles") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ profiles: [] }),
      });
      return;
    }

    if (url.pathname === "/api/profiles/active") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ active: "default", exists: true }),
      });
      return;
    }

    if (url.pathname === "/api/dashboard/themes") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ themes: [] }),
      });
      return;
    }

    if (url.pathname === "/api/dashboard/font") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ font: "system" }),
      });
      return;
    }

    if (url.pathname === "/api/status") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          gateway: { enabled: false, connected: false },
          sessions: { active: 0 },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: null,
        items: [],
        generatedAt: new Date("2026-09-29T00:00:00.000Z").toISOString(),
      }),
    });
  });
}
