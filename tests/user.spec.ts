import { test, expect } from "playwright-test-coverage";

async function basicInitAdmin(page: any) {
  let loggedInUser: any = undefined;

  await page.goto("/");

  // Catch all API calls to debug
  await page.route("**/api/**", async (route: any) => {
    console.log(
      `🌐 ALL API: ${route.request().method()} ${route.request().url()}`
    );
    await route.continue();
  });

  // More specific auth mock
  await page.route("**/api/auth*", async (route: any) => {
    const method = route.request().method();
    console.log(`🔍 AUTH: ${method} ${route.request().url()}`);

    if (method === "PUT") {
      const loginReq = route.request().postDataJSON();
      if (loginReq.email === "a@jwt.com" && loginReq.password === "Admin") {
        loggedInUser = {
          id: "1",
          name: "Admin User",
          email: "a@jwt.com",
          roles: [{ role: "admin" }],
        };
        await route.fulfill({
          json: {
            user: loggedInUser,
            token: "mock-admin-token",
          },
        });
      } else {
        await route.fulfill({ status: 401 });
      }
    } else if (method === "DELETE") {
      loggedInUser = undefined;
      await route.fulfill({ json: { message: "logout successful" } });
    }
  });

  // Mock user list endpoint - ADD ASTERISK TO MATCH QUERY PARAMS
  await page.route("**/api/user*", async (route: any) => {
    const method = route.request().method();
    console.log(`✅ USER MOCK: ${method} ${route.request().url()}`);

    if (method === "GET") {
      const url = new URL(route.request().url());
      const pageNum = parseInt(url.searchParams.get("page") || "0");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const nameFilter = url.searchParams.get("name") || "*";

      console.log(
        `📊 PARAMS: page=${pageNum}, limit=${limit}, filter="${nameFilter}"`
      );

      // Your 12 users
      const allUsers = [
        {
          id: "1",
          name: "Admin User",
          email: "a@jwt.com",
          roles: [{ role: "admin" }],
        },
        {
          id: "2",
          name: "Franchise Owner",
          email: "f@jwt.com",
          roles: [{ role: "franchisee" }],
        },
        {
          id: "3",
          name: "Kai Chen",
          email: "d@jwt.com",
          roles: [{ role: "diner" }],
        },
        {
          id: "4",
          name: "John Doe",
          email: "john@jwt.com",
          roles: [{ role: "diner" }],
        },
        {
          id: "5",
          name: "Jane Smith",
          email: "jane@jwt.com",
          roles: [{ role: "diner" }],
        },
        {
          id: "6",
          name: "Mike Johnson",
          email: "mike@jwt.com",
          roles: [{ role: "diner" }],
        },
        {
          id: "7",
          name: "Sarah Wilson",
          email: "sarah@jwt.com",
          roles: [{ role: "diner" }],
        },
        {
          id: "8",
          name: "Tom Brown",
          email: "tom@jwt.com",
          roles: [{ role: "diner" }],
        },
        {
          id: "9",
          name: "Lisa Davis",
          email: "lisa@jwt.com",
          roles: [{ role: "diner" }],
        },
        {
          id: "10",
          name: "Chris Miller",
          email: "chris@jwt.com",
          roles: [{ role: "diner" }],
        },
        {
          id: "11",
          name: "Amy Taylor",
          email: "amy@jwt.com",
          roles: [{ role: "diner" }],
        },
        {
          id: "12",
          name: "David Garcia",
          email: "david@jwt.com",
          roles: [{ role: "diner" }],
        },
      ];

      // Filter logic - handle the asterisks properly
      let filteredUsers = allUsers;
      if (nameFilter && nameFilter !== "*") {
        // Remove asterisks and search
        const searchTerm = nameFilter.replace(/\*/g, "").toLowerCase();
        console.log(`🔍 SEARCHING FOR: "${searchTerm}"`);

        if (searchTerm) {
          filteredUsers = allUsers.filter(
            (user) =>
              user.name.toLowerCase().includes(searchTerm) ||
              user.email.toLowerCase().includes(searchTerm)
          );
        }
      }

      console.log(`📋 FILTERED: ${filteredUsers.length} users found`);

      // Pagination
      const startIndex = pageNum * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      console.log(
        `📤 RETURNING: page ${pageNum}, users ${startIndex}-${
          endIndex - 1
        }, total: ${filteredUsers.length}`
      );
      console.log(
        `👥 USER NAMES:`,
        paginatedUsers.map((u) => u.name)
      );

      await route.fulfill({
        json: {
          users: paginatedUsers,
          total: filteredUsers.length,
          page: pageNum,
        },
      });
    }
  });

  // Mock franchise endpoints - ALSO ADD ASTERISK
  await page.route("**/api/franchise*", async (route: any) => {
    console.log(
      `🏢 FRANCHISE: ${route.request().method()} ${route.request().url()}`
    );
    await route.fulfill({
      json: { franchises: [], more: false },
    });
  });
}

// Add your admin user list tests
test("admin can view user list", async ({ page }) => {
  await basicInitAdmin(page);

  // Add this to check what URL is being used
  await page.addInitScript(() => {
    window.localStorage.setItem("debug", "true");
    console.log(
      "🌍 VITE_PIZZA_SERVICE_URL:",
      import.meta.env.VITE_PIZZA_SERVICE_URL
    );
  });

  // Login as admin
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("Admin");
  await page.getByRole("button", { name: "Login" }).click();

  // Navigate to admin page
  await page.getByRole("link", { name: "Admin" }).click();

  // Wait and check what's happening
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("User Management")).toBeVisible();

  // Wait longer for async calls
  await page.waitForTimeout(2000);

  await expect(page.getByText("Admin User")).toBeVisible();
});

test("admin can search users", async ({ page }) => {
  await basicInitAdmin(page);

  // Login as admin
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("Admin");
  await page.getByRole("button", { name: "Login" }).click();

  // Navigate to admin page
  await page.getByRole("link", { name: "Admin" }).click();

  // Search for specific user
  await page.getByPlaceholder("Filter users").fill("John");
  await page.getByRole("button", { name: "Search" }).click();

  // Verify filtered results
  await expect(page.getByText("John Doe")).toBeVisible();
  await expect(page.getByText("Mike Johnson")).toBeVisible();
  await expect(page.getByText("Admin User")).not.toBeVisible();
});

test("admin can navigate user pages", async ({ page }) => {
  await basicInitAdmin(page);

  // Login as admin
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("Admin");
  await page.getByRole("button", { name: "Login" }).click();

  // Navigate to admin page
  await page.getByRole("link", { name: "Admin" }).click();

  // Verify first page
  await expect(page.getByText("Page 1")).toBeVisible();
  await expect(page.getByText("Admin User")).toBeVisible();

  await page.getByTestId("user-next-page").click();

  // Wait for the API call to complete
  await page.waitForTimeout(1000);

  // Verify second page
  await expect(page.getByText("Page 2")).toBeVisible();
  await expect(page.getByText("Amy Taylor")).toBeVisible();
  await expect(page.getByText("David Garcia")).toBeVisible();
  await expect(page.getByText("Admin User")).not.toBeVisible();
});

test("updateUser", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("pizza diner");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();

  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza diner");

  // Open the edit user modal and close it without making changes
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.getByRole("button", { name: "Update" }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });

  // Open the edit user modal, make changes, and save
  await expect(page.getByRole("main")).toContainText("pizza diner");
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.getByRole("textbox").first().fill("pizza dinerx");
  await page.getByRole("button", { name: "Update" }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });

  await expect(page.getByRole("main")).toContainText("pizza dinerx");

  // Logout and log back in to verify changes persisted
  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();

  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza dinerx");
});

test("update email and password", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("pizza diner");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();
  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza diner");
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");

  await page.locator('input[type="email"]').fill("new" + email);
  await page.locator("#password").fill("newdiner");
  await page.getByRole("button", { name: "Update" }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });

  await expect(page.getByRole("main")).toContainText("pizza diner");
  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();

  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("new" + email);
  await page.getByRole("textbox", { name: "Password" }).fill("newdiner");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza diner");
});
