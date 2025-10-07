import { Page } from "@playwright/test";
import { test, expect } from "playwright-test-coverage";
import { Role, User } from "../src/service/pizzaService";
import { Route } from "react-router-dom";

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
    "d@jwt.com": {
      id: "3",
      name: "Kai Chen",
      email: "d@jwt.com",
      password: "a",
      roles: [{ role: Role.Diner }],
    },
    "a@jwt.com": {
      id: "1",
      name: "Admin User",
      email: "a@jwt.com",
      password: "Admin",
      roles: [{ role: Role.Admin }],
    },
  };

  // Authorize login for the given user
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = route.request().postDataJSON();
    const user = validUsers[loginReq.email];
    if (!user || user.password !== loginReq.password) {
      await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
      return;
    }
    loggedInUser = validUsers[loginReq.email];
    const loginRes = {
      user: loggedInUser,
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    await route.fulfill({ json: loginRes });
  });

  // Return the currently logged in user
  await page.route("*/**/api/user/me", async (route) => {
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: loggedInUser });
  });

  // A standard menu
  await page.route("*/**/api/order/menu", async (route) => {
    const menuRes = [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
      {
        id: 2,
        title: "Pepperoni",
        image: "pizza2.png",
        price: 0.0042,
        description: "Spicy treat",
      },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: menuRes });
  });

  // Standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: "LotaPizza",
          stores: [
            { id: 4, name: "Lehi" },
            { id: 5, name: "Springville" },
            { id: 6, name: "American Fork" },
          ],
        },
        { id: 3, name: "PizzaCorp", stores: [{ id: 7, name: "Spanish Fork" }] },
        { id: 4, name: "topSpot", stores: [] },
      ],
    };
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: franchiseRes });
  });

  // Order a pizza.
  await page.route("*/**/api/order", async (route) => {
    const orderReq = route.request().postDataJSON();
    const orderRes = {
      order: { ...orderReq, id: 23 },
      jwt: "eyJpYXQ",
    };
    expect(route.request().method()).toBe("POST");
    await route.fulfill({ json: orderRes });
  });

  await page.goto("/");
}

async function basicInit2(page: Page) {
  page.on("request", (req) => {
    if (req.url().includes("/api/franchise")) {
      console.log(">>", req.method(), req.url());
    }
  });
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
    "d@jwt.com": {
      id: "3",
      name: "Kai Chen",
      email: "d@jwt.com",
      password: "a",
      roles: [{ role: Role.Diner }],
    },
    "a@jwt.com": {
      id: "1",
      name: "Admin User",
      email: "a@jwt.com",
      password: "Admin",
      roles: [{ role: Role.Admin }],
    },
    "f@jwt.com": {
      id: "4",
      name: "Franchise Owner",
      email: "f@jwt.com",
      password: "franchise",
      roles: [{ role: Role.Franchisee }],
    },
  };

  // Authorize login for the given user
  // In your basicInit2 function, update the auth route:
  await page.route("*/**/api/auth", async (route) => {
    const method = route.request().method();

    if (method === "PUT") {
      // Handle login (existing code)
      const loginReq = route.request().postDataJSON();
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
        return;
      }
      loggedInUser = validUsers[loginReq.email];
      const loginRes = {
        user: loggedInUser,
        token: "abcdef",
      };
      await route.fulfill({ json: loginRes });
    } else if (method === "POST") {
      // Handle registration
      const registerReq = route.request().postDataJSON();
      const newUser = {
        id: "999",
        name: registerReq.name,
        email: registerReq.email,
        roles: [{ role: Role.Diner }],
      };

      // Add to valid users for future logins
      validUsers[registerReq.email] = {
        ...newUser,
        password: registerReq.password,
      };

      loggedInUser = newUser;

      await route.fulfill({
        json: {
          user: newUser,
          token: "registration-token",
        },
      });
    }
  });

  // Return the currently logged in user
  await page.route("*/**/api/user/me", async (route) => {
    console.log("Serving /api/user/me with user:", loggedInUser);
    expect(route.request().method()).toBe("GET");
    if (loggedInUser) {
      await route.fulfill({ json: loggedInUser });
    } else {
      await route.fulfill({ status: 401, json: { error: "Not logged in" } });
    }
  });

  // A standard menu
  await page.route("*/**/api/order/menu", async (route) => {
    const menuRes = [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
      {
        id: 2,
        title: "Pepperoni",
        image: "pizza2.png",
        price: 0.0042,
        description: "Spicy treat",
      },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: menuRes });
  });

  // 1️⃣ Most specific: /api/franchise/me
  await page.route(/\/api\/franchise\/me$/, async (route) => {
    console.log("[HANDLER C] GET /api/franchise/me");
    if (loggedInUser) {
      await route.fulfill({
        json: [
          {
            id: 2,
            name: "LotaPizza",
            admins: [{ id: 4, name: "Franchise Owner", email: "f@jwt.com" }],
            stores: [{ id: 4, name: "SLC", totalRevenue: 0 }],
          },
        ],
      });
    } else {
      await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
    }
  });

  // 2️⃣ Next: /api/franchise/:id and /api/franchise/:id/store
  await page.route(
    /\/api\/franchise\/\d+(\/store(\/\d+)?)?$/,
    async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      console.log("[HANDLER A]", method, url);

      // Match /api/franchise/:id/store (POST)
      if (method === "POST" && url.match(/\/api\/franchise\/\d+\/store$/)) {
        const storeReq = route.request().postDataJSON();
        await route.fulfill({
          json: {
            id: 99,
            name: storeReq.name,
            totalRevenue: 0,
          },
        });
        return;
      }

      // Match /api/franchise/:id/store/:id (DELETE)
      if (
        method === "DELETE" &&
        url.match(/\/api\/franchise\/\d+\/store\/\d+$/)
      ) {
        await route.fulfill({ json: { message: "store deleted" } });
        return;
      }
      // Match /api/franchise/:id (GET, DELETE)
      const idMatch = url.match(/\/api\/franchise\/(\d+)$/);
      const franchiseId = idMatch ? parseInt(idMatch[1]) : null;

      if (!method) {
        await route.continue();
        return;
      }

      if (method === "GET") {
        if (
          loggedInUser?.id !== undefined &&
          parseInt(loggedInUser.id) === franchiseId
        ) {
          await route.fulfill({
            json: [
              {
                id: 2,
                name: "LotaPizza",
                admins: [
                  {
                    id: parseInt(loggedInUser.id),
                    name: loggedInUser.name,
                    email: loggedInUser.email,
                  },
                ],
                stores: [{ id: 4, name: "SLC", totalRevenue: 0 }],
              },
            ],
          });
        } else {
          await route.fulfill({ json: [] });
        }
      } else if (method === "DELETE") {
        await route.fulfill({ json: { message: "franchise deleted" } });
      }
    }
  );

  // 3️⃣ Finally: /api/franchise (broad list & create)
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    console.log("[HANDLER B]", method, url);

    if (method === "GET") {
      // GET /api/franchise - list all franchises
      const franchiseRes = {
        franchises: [
          {
            id: 2,
            name: "LotaPizza",
            stores: [{ id: 4, name: "SLC", totalRevenue: 0 }],
          },
          {
            id: 3,
            name: "PizzaCorp",
            stores: [{ id: 5, name: "Provo", totalRevenue: 0 }],
          },
          {
            id: 4,
            name: "topSpot",
            stores: [{ id: 6, name: "Lehi", totalRevenue: 0 }],
          },
        ],
      };
      await route.fulfill({ json: franchiseRes });
    } else if (method === "POST") {
      // POST /api/franchise - create franchise
      const franchiseReq = route.request().postDataJSON();
      const newFranchise = {
        id: 99,
        name: franchiseReq.name,
        admins: [{ email: "f@jwt.com", id: 4, name: franchiseReq.name }],
        stores: [{ id: 7, name: "Pleasant Grove", totalRevenue: 0 }],
      };
      await route.fulfill({ json: newFranchise });
    }
  });

  // Order a pizza.
  // In basicInit2, add this route for GET orders:
  await page.route("*/**/api/order", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      // Handle GET /api/order - get user's order history
      if (loggedInUser) {
        await route.fulfill({
          json: {
            dinerId: parseInt(loggedInUser.id ?? "0"),
            orders: [
              {
                id: 1,
                franchiseId: 2,
                storeId: 4,
                date: "2024-10-07T12:00:00.000Z",
                items: [
                  { id: 1, menuId: 1, description: "Veggie", price: 0.0038 },
                  { id: 2, menuId: 2, description: "Pepperoni", price: 0.0042 },
                ],
              },
            ],
            page: 1,
          },
        });
      } else {
        await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
      }
    } else if (method === "POST") {
      // Handle POST /api/order - create order (existing code)
      const orderReq = route.request().postDataJSON();
      const orderRes = {
        order: { ...orderReq, id: 23 },
        jwt: "eyJpYXQ",
      };
      await route.fulfill({ json: orderRes });
    }
  });

  await page.goto("/");
}

test("login", async ({ page }) => {
  await basicInit(page);
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: "KC" })).toBeVisible();
});

test("purchase with login", async ({ page }) => {
  await basicInit(page);

  // Go to order page
  await page.getByRole("button", { name: "Order now" }).click();

  // Create order
  await expect(page.locator("h2")).toContainText("Awesome is a click away");
  await page.getByRole("combobox").selectOption("4");
  await page.getByRole("link", { name: "Image Description Veggie A" }).click();
  await page.getByRole("link", { name: "Image Description Pepperoni" }).click();
  await expect(page.locator("form")).toContainText("Selected pizzas: 2");
  await page.getByRole("button", { name: "Checkout" }).click();

  // Login
  await page.getByPlaceholder("Email address").click();
  await page.getByPlaceholder("Email address").fill("d@jwt.com");
  await page.getByPlaceholder("Email address").press("Tab");
  await page.getByPlaceholder("Password").fill("a");
  await page.getByRole("button", { name: "Login" }).click();

  // Pay
  await expect(page.getByRole("main")).toContainText(
    "Send me those 2 pizzas right now!"
  );
  await expect(page.locator("tbody")).toContainText("Veggie");
  await expect(page.locator("tbody")).toContainText("Pepperoni");
  await expect(page.locator("tfoot")).toContainText("0.008 ₿");
  await page.getByRole("button", { name: "Pay now" }).click();

  // Check balance
  await expect(page.getByText("0.008")).toBeVisible();
});

test("register new user", async ({ page }) => {
  // ask about why t appears as the top right link and why it does not pass the expect check
  await basicInit2(page);
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("testUser");
  await page.getByRole("textbox", { name: "Email address" }).fill("t@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("t");
  await page.getByRole("button", { name: "Register" }).click();
});

test("logout", async ({ page }) => {
  await basicInit2(page);

  // Login first
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: "KC" })).toBeVisible();

  await page.getByRole("link", { name: "Logout" }).click();

  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

  await expect(page.getByRole("link", { name: "KC" })).not.toBeVisible();
});

test("create franchise", async ({ page }) => {
  await basicInit2(page);
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("Admin");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: "AU" })).toBeVisible();
  await page.getByRole("link", { name: "Admin" }).click();
  await page.getByRole("button", { name: "Add Franchise" }).click();
  await page.getByRole("textbox", { name: "franchise name" }).click();
  await page.getByRole("textbox", { name: "franchise name" }).fill("pizza");
  await page.getByRole("textbox", { name: "franchise name" }).press("CapsLock");
  await page.getByRole("textbox", { name: "franchise name" }).fill("pizzaP");
  await page.getByRole("textbox", { name: "franchise name" }).press("CapsLock");
  await page
    .getByRole("textbox", { name: "franchise name" })
    .fill("pizzaPocket");
  await page.getByRole("textbox", { name: "franchisee admin email" }).click();
  await page
    .getByRole("textbox", { name: "franchisee admin email" })
    .fill("f@jwt.com");
  await page.getByRole("button", { name: "Create" }).click();
  // ask why after clicking on create a franchise nothing happens
});

test("delete franchise", async ({ page }) => {
  await basicInit2(page); // Make sure this includes the DELETE handler above

  // Login as admin
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("Admin");
  await page.getByRole("button", { name: "Login" }).click();

  // Navigate to admin/franchise page
  await page.getByRole("link", { name: "Admin" }).click();

  // Find and delete a franchise (adjust selectors based on your UI)
  await page.getByRole("button", { name: "Close" }).first().click();

  // Confirm deletion if there's a confirmation dialog
  await page.getByRole("button", { name: "Close" }).click();
  // ask why after closing a franchise the frontend still shows the three franchises
});

test("create store", async ({ page }) => {
  // ask why the franchise link takes you to a relogin page.
  await basicInit2(page);

  // Login as franchisee
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("franchise");
  await page.getByRole("button", { name: "Login" }).click();

  // Verify login successful
  // await expect(page.getByRole("link", { name: "FO" })).toBeVisible();

  // Navigate to franchise page (remove the second login!)
  await page
    .getByLabel("Global")
    .getByRole("link", { name: "Franchise" })
    .click();

  // Now continue with store creation
  await page.getByRole("button", { name: "Create store" }).click(); // Adjust selector as needed
  await page.getByRole("textbox", { name: "Store name" }).fill("New Store");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("button", { name: "Create store" }).click();

  await page.getByRole("textbox", { name: "store name" }).click();
  await page.getByRole("textbox", { name: "store name" }).press("CapsLock");
  await page.getByRole("textbox", { name: "store name" }).fill("C");
  await page.getByRole("textbox", { name: "store name" }).press("CapsLock");
  await page.getByRole("textbox", { name: "store name" }).fill("Cedar");
  await page.getByRole("textbox", { name: "store name" }).press("CapsLock");
  await page.getByRole("textbox", { name: "store name" }).fill("Cedar ");
  await page.getByRole("textbox", { name: "store name" }).press("CapsLock");
  await page.getByRole("textbox", { name: "store name" }).press("CapsLock");
  await page.getByRole("textbox", { name: "store name" }).fill("Cedar H");
  await page.getByRole("textbox", { name: "store name" }).press("CapsLock");
  await page.getByRole("textbox", { name: "store name" }).fill("Cedar Hills");
  await page.getByRole("button", { name: "Create" }).click();
});

test("close store", async ({ page }) => {
  await basicInit2(page);

  // Login as franchisee
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("franchise");
  await page.getByRole("button", { name: "Login" }).click();

  // Navigate to franchise page
  await page
    .getByLabel("Global")
    .getByRole("link", { name: "Franchise" })
    .click();

  // Find and close a store (adjust selector based on your actual UI)
  await page.getByRole("button", { name: "Close" }).first().click();

  if (await page.getByRole("button", { name: "Confirm" }).isVisible()) {
    await page.getByRole("button", { name: "Close" }).click();
  }
});

test("about page", async ({ page }) => {
  await basicInit2(page);
  await page.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/.*about.*/);
  await expect(page.getByText("The secret sauce")).toBeVisible();
});

test("history page", async ({ page }) => {
  await basicInit2(page);

  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "History" }).click();
  await expect(page).toHaveURL(/.*history.*/);
  await expect(page.getByText("Mama Rucci, my my")).toBeVisible();
});

test("diner dashboard", async ({ page }) => {
  await basicInit2(page);

  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("link", { name: "KC" })).toBeVisible();

  await page.getByRole("link", { name: "KC" }).click();
  await expect(page).toHaveURL(/.*diner-dashboard.*/);
  await expect(page.getByText("Your pizza kitchen")).toBeVisible();
  await expect(page.getByText("Kai Chen")).toBeVisible();
  await expect(page.getByText("d@jwt.com")).toBeVisible();
  await expect(page.getByText("Here is your history of all")).toBeVisible();
});
