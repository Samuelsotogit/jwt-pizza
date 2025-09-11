# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints | Database SQL |
| --------------------------------------------------- | ------------------ | ----------------- | ------------ |
| View home page                                      |    home.tsx        |       none        |     none     |
| Register new user<br/>(t@jwt.com, pw: test)         |    register.tsx    | [POST]/api/auth   |     `INSERT INTO user (name, email, password) VALUES (?, ?, ?)` <br/>`INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`             |
| Login new user<br/>(t@jwt.com, pw: test)            |         login.tsx <br/> breadcrumb.tsx          |      [GET]/api/user/me             |     `INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token`         |
| Order pizza                                         |     menu.tsx <br/> payment.tsx      |    [GET]/api/order/menu <br/> [POST]/api/order               |    `SELECT * FROM menu` <br/> `INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())` <br/> `INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)`         |
| Verify pizza                                        |      delivery.tsx              |        [GET]/api/order       |    `SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId=? LIMIT ${offset},${config.db.listPerPage}` <br/> `SELECT id, menuId, description, price FROM orderItem WHERE orderId=?`          |
| View profile page                                   |      dinerDashboard.tsx  <br/> pizzaService.ts      |       none           |      `SELECT userId FROM auth WHERE token=?`        |
| View franchise<br/>(as diner)                       |        franchiseDashboard.tsx            |      [GET]/api/franchise/:userId             |     `SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?` <br/> `SELECT id, name FROM franchise WHERE id in (${franchiseIds.join(',')})`         |
| Logout                                              |   logout.tsx  <br/> pizzaService.ts   |    [DELETE]/api/auth              |      `DELETE FROM auth WHERE token=?`        |
| View About page                                     |      about.tsx              |       none            |      none        |
| View History page                                   |         history.tsx           |       none            |      none        |
| Login as franchisee<br/>(f@jwt.com, pw: franchisee) |        login.tsx     |        [PUT]/api/user/:userId           |     `INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token`         |
| View franchise<br/>(as franchisee)                  |       franchiseDashboard.tsx             |        [GET]/api/franchise/:userId           |      `SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?`        |
| Create a store                                      |         createStore.tsx           |       [POST]/api/franchise/:franchiseId/store            |     `INSERT INTO store (franchiseId, name) VALUES (?, ?)`         |
| Close a store                                       |       closeStore.tsx             |       [DELETE]/api/franchise/:franchiseId/store/:storeId            |       `DELETE FROM store WHERE franchiseId=? AND id=?`       |
| Login as admin<br/>(a@jwt.com, pw: admin)           |         login.tsx           |        [PUT]/api/user/:userId           |       `INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token`       |
| View Admin page                                     |         adminDashboard.tsx           |        [GET]/api/user/me           |       `SELECT id, name FROM franchise WHERE name LIKE ? LIMIT ${limit + 1} OFFSET ${offset}`       |
| Create a franchise for t@jwt.com                    |       createFranchise.tsx             |         [POST]/api/franchise/:franchiseId/store          |    `INSERT INTO store (franchiseId, name) VALUES (?, ?)`          |
| Close the franchise for t@jwt.com                   |         closeFranchise.tsx           |        [DELETE]/api/franchise/:franchiseId/store/:storeId           |      `DELETE FROM store WHERE franchiseId=? AND id=?`        |
