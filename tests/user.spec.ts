import { test, expect } from "playwright-test-coverage";
import { Dialog } from "@playwright/test";

let loggedInUser: any = undefined;
let deletedUserIds: string[] = [];
let registeredUsers: any[] = [];

async function basicInitAdmin(page: any) {
  await page.goto("/");

  // Enhanced auth mock with registration support
  await page.route("**/api/auth*", async (route: any) => {
    const method = route.request().method();
    const url = route.request().url();
    console.log(`🔍 AUTH: ${method} ${url}`);

    if (method === "PUT") {
      // Login
      const loginReq = route.request().postDataJSON();

      // Check for admin login
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
      }
      // Check for registered test users
      else {
        const foundUser = registeredUsers.find(
          (u) => u.email === loginReq.email && u.password === loginReq.password
        );

        if (foundUser) {
          loggedInUser = foundUser;
          await route.fulfill({
            json: {
              user: foundUser,
              token: "mock-user-token",
            },
          });
        } else {
          await route.fulfill({
            status: 401,
            json: { message: "unknown user" },
          });
        }
      }
    } else if (method === "POST") {
      // Registration
      const registerReq = route.request().postDataJSON();
      console.log(`📝 REGISTERING: ${registerReq.name} <${registerReq.email}>`);

      // Check if user already exists
      const existingUser = registeredUsers.find(
        (u) => u.email === registerReq.email
      );
      if (existingUser) {
        await route.fulfill({
          status: 409,
          json: { message: "User already exists" },
        });
        return;
      }

      // Create new user
      const newUser = {
        id: (registeredUsers.length + 100).toString(), // Start IDs at 100 to avoid conflicts
        name: registerReq.name,
        email: registerReq.email,
        password: registerReq.password,
        roles: [{ role: "diner" }],
      };

      registeredUsers.push(newUser);
      loggedInUser = newUser;

      await route.fulfill({
        json: {
          user: newUser,
          token: "mock-new-user-token",
        },
      });
    } else if (method === "DELETE") {
      // Logout
      loggedInUser = undefined;
      await route.fulfill({ json: { message: "logout successful" } });
    }
  });

  // Your existing user route stays the same, but add registered users to the list
  await page.route(/\/api\/user(\?|\/)/, async (route: any) => {
    const method = route.request().method();
    const url = route.request().url();
    console.log(`🎯 USER ROUTE INTERCEPTED: ${method} ${url}`);

    let allUsers = [
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
        name: "Mike Johnson",
        email: "mike@jwt.com",
        roles: [{ role: "diner" }],
      },
      {
        id: "6",
        name: "Sophia Lee",
        email: "sophia@jwt.com",
        roles: [{ role: "diner" }],
      },
      {
        id: "7",
        name: "Chris Evans",
        email: "chris@jwt.com",
        roles: [{ role: "diner" }],
      },
      {
        id: "8",
        name: "Olivia Brown",
        email: "olivia@jwt.com",
        roles: [{ role: "diner" }],
      },
      {
        id: "9",
        name: "Liam Wilson",
        email: "liam@jwt.com",
        roles: [{ role: "diner" }],
      },
      {
        id: "10",
        name: "Emma Martinez",
        email: "emma@jwt.com",
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

    if (method === "GET") {
      const url = new URL(route.request().url());
      const pageNum = parseInt(url.searchParams.get("page") || "0");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const nameFilter = url.searchParams.get("name") || "*";

      // Add registered users to the list
      allUsers = [...allUsers, ...registeredUsers];

      // Filter out deleted users
      allUsers = allUsers.filter(
        (user) => !deletedUserIds.includes(user.id.toString())
      );

      // Your existing filtering and pagination logic stays the same
      let filteredUsers = allUsers;
      if (nameFilter && nameFilter !== "*") {
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
    } else if (method === "DELETE") {
      // Your existing DELETE logic stays the same
      console.log(`🗑️ DELETE INTERCEPTED!`);
      const pathParts = url.split("/");
      const userId = pathParts[pathParts.length - 1].toString();

      console.log(`🗑️ DELETING USER: ${userId}`);

      // Remove from registered users too
      registeredUsers = registeredUsers.filter((u) => u.id !== userId);
      deletedUserIds.push(userId);

      await route.fulfill({
        status: 204,
        json: { message: "204 No Content" },
      });
    } else if (method === "PUT") {
      // Handle update user
      const pathParts = url.split("/");
      const userId = pathParts[pathParts.length - 1].toString();
      const body = await route.request().postDataJSON();
      const { name, email, password } = body;

      // Find user in registeredUsers or static users
      let user =
        registeredUsers.find((u) => u.id === userId) ||
        allUsers.find((u) => u.id === userId);

      if (!user) {
        await route.fulfill({
          status: 404,
          json: { message: "User not found" },
        });
        return;
      }

      // Update only provided fields
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (password !== undefined && password !== "") user.password = password;

      // Update in registeredUsers or allUsers
      const regIdx = registeredUsers.findIndex((u) => u.id === userId);
      if (regIdx !== -1) {
        registeredUsers[regIdx] = user;
      } else {
        const allIdx = allUsers.findIndex((u) => u.id === userId);
        if (allIdx !== -1) allUsers[allIdx] = user;
      }

      await route.fulfill({
        json: {
          user: { ...user, password: undefined },
          token: "mock-updated-token",
        },
      });
    }
  });

  // Your existing franchise mock stays the same
  await page.route("**/api/franchise*", async (route: any) => {
    console.log(
      `🏢 FRANCHISE: ${route.request().method()} ${route.request().url()}`
    );
    await route.fulfill({
      json: { franchises: [], more: false },
    });
  });
}

test("updateUser", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  registeredUsers = [];
  deletedUserIds = [];
  loggedInUser = undefined;
  await basicInitAdmin(page);
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
  await basicInitAdmin(page);
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

// Pure mock test for user deletion
test("admin can delete users (mocked)", async ({ page }) => {
  page.on("request", (req) => {
    console.log("➡️", req.method(), req.url());
  });
  // Set up all API mocks
  await basicInitAdmin(page);

  // Login as admin (mocked)
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("Admin");
  await page.getByRole("button", { name: "Login" }).click();

  // Go to admin dashboard
  await page.getByRole("link", { name: "Admin" }).click();
  await page.waitForLoadState("networkidle");

  // Confirm user is present before deletion
  await expect(page.getByText("John Doe")).toBeVisible();

  // Handle confirmation dialog
  let dialogShown = false;
  page.once("dialog", (dialog: Dialog) => {
    expect(dialog.message()).toContain(
      'Are you sure you want to delete user "John Doe"?'
    );
    dialogShown = true;
    dialog.accept();
  });
  // Click delete button for John Doe (id: 4 in your mock)
  await page.getByTestId("delete-user-4").click();

  // Wait for UI update
  await page.waitForTimeout(500);

  // Verify dialog was shown
  expect(dialogShown).toBe(true);

  // Verify user is removed from the UI
  await expect(page.getByRole("cell", { name: "John Doe" })).not.toBeVisible();

  // Optionally, check that other users are still present
  await expect(page.getByText("Admin User")).toBeVisible();
});
