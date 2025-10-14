import React from "react";
import View from "./view";
import { useNavigate } from "react-router-dom";
import NotFound from "./notFound";
import Button from "../components/button";
import { pizzaService } from "../service/service";
import {
  Franchise,
  FranchiseList,
  Role,
  Store,
  User,
  UserList,
} from "../service/pizzaService";
import { TrashIcon } from "../icons";

interface Props {
  user: User | null;
}

export default function AdminDashboard(props: Props) {
  const navigate = useNavigate();
  const [franchiseList, setFranchiseList] = React.useState<FranchiseList>({
    franchises: [],
    more: false,
  });
  const [franchisePage, setFranchisePage] = React.useState(0);
  const filterFranchiseRef = React.useRef<HTMLInputElement>(null);
  // Add user state after your existing state
  const [userList, setUserList] = React.useState<UserList>({
    users: [],
    total: 0,
    page: 0,
  });
  const [userPage, setUserPage] = React.useState(0);
  const [userLoading, setUserLoading] = React.useState(false);
  const filterUserRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    (async () => {
      setFranchiseList(await pizzaService.getFranchises(franchisePage, 3, "*"));
    })();
  }, [props.user, franchisePage]);

  // Add this useEffect after your existing useEffect
  React.useEffect(() => {
    console.log("🚀 USER EFFECT RUNNING", { user: props.user, userPage });
    (async () => {
      setUserLoading(true);
      try {
        const result = await pizzaService.getUsers(userPage, 10, "*");
        setUserList(result);
      } catch (error) {
        console.error("❌ Failed to fetch users:", error);
      } finally {
        setUserLoading(false);
      }
    })();
  }, [props.user, userPage]);

  // Simplify your handlers to just update state
  const handlePrevPage = () => {
    if (userPage > 0) {
      setUserPage(userPage - 1); // useEffect will trigger automatically
    }
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(userList.total / 10);
    if (userPage < totalPages - 1) {
      setUserPage(userPage + 1); // useEffect will trigger automatically
    }
  };

  function createFranchise() {
    navigate("/admin-dashboard/create-franchise");
  }

  async function closeFranchise(franchise: Franchise) {
    navigate("/admin-dashboard/close-franchise", {
      state: { franchise: franchise },
    });
  }

  async function closeStore(franchise: Franchise, store: Store) {
    navigate("/admin-dashboard/close-store", {
      state: { franchise: franchise, store: store },
    });
  }

  async function filterFranchises() {
    setFranchiseList(
      await pizzaService.getFranchises(
        franchisePage,
        10,
        `*${filterFranchiseRef.current?.value}*`
      )
    );
  }

  // Add these functions after your existing functions
  async function filterUsers() {
    setUserLoading(true);
    try {
      const searchValue = filterUserRef.current?.value || "";
      console.log(`🔍 FRONTEND SEARCH: "${searchValue}"`);
      setUserList(
        await pizzaService.getUsers(
          0,
          10,
          `*${filterUserRef.current?.value || ""}*`
        )
      );
      setUserPage(0);
    } catch (error) {
      console.error("Failed to filter users:", error);
    } finally {
      setUserLoading(false);
    }
  }

  const formatRole = (role: { role: string }) => {
    return role.role.charAt(0).toUpperCase() + role.role.slice(1);
  };

  let response = <NotFound />;
  if (Role.isRole(props.user, Role.Admin)) {
    response = (
      <View title="Mama Ricci's kitchen">
        <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
          <h3 className="text-neutral-100 text-xl">Franchises</h3>
          <div className="bg-neutral-100 overflow-clip my-4">
            <div className="flex flex-col">
              <div className="-m-1.5 overflow-x-auto">
                <div className="p-1.5 min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                        <tr>
                          {[
                            "Franchise",
                            "Franchisee",
                            "Store",
                            "Revenue",
                            "Action",
                          ].map((header) => (
                            <th
                              key={header}
                              scope="col"
                              className="px-6 py-3 text-center text-xs font-medium"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      {franchiseList.franchises.map((franchise, findex) => {
                        return (
                          <tbody
                            key={findex}
                            className="divide-y divide-gray-200"
                          >
                            <tr className="border-neutral-500 border-t-2">
                              <td className="text-start px-2 whitespace-nowrap text-l font-mono text-orange-600">
                                {franchise.name}
                              </td>
                              <td
                                className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800"
                                colSpan={3}
                              >
                                {franchise.admins
                                  ?.map((o) => o.name)
                                  .join(", ")}
                              </td>
                              <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                <button
                                  type="button"
                                  className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400  hover:border-orange-800 hover:text-orange-800"
                                  onClick={() => closeFranchise(franchise)}
                                >
                                  <TrashIcon />
                                  Close
                                </button>
                              </td>
                            </tr>

                            {franchise.stores.map((store, sindex) => {
                              return (
                                <tr key={sindex} className="bg-neutral-100">
                                  <td
                                    className="text-end px-2 whitespace-nowrap text-sm text-gray-800"
                                    colSpan={3}
                                  >
                                    {store.name}
                                  </td>
                                  <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800">
                                    {store.totalRevenue?.toLocaleString()} ₿
                                  </td>
                                  <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                    <button
                                      type="button"
                                      className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800"
                                      onClick={() =>
                                        closeStore(franchise, store)
                                      }
                                    >
                                      <TrashIcon />
                                      Close
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        );
                      })}
                      <tfoot>
                        <tr>
                          <td className="px-1 py-1">
                            <input
                              type="text"
                              ref={filterFranchiseRef}
                              name="filterFranchise"
                              placeholder="Filter franchises"
                              className="px-2 py-1 text-sm border border-gray-300 rounded-lg"
                            />
                            <button
                              type="submit"
                              className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800"
                              onClick={filterFranchises}
                            >
                              Submit
                            </button>
                          </td>
                          <td
                            colSpan={4}
                            className="text-end text-sm font-medium"
                          >
                            <button
                              className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300 "
                              onClick={() =>
                                setFranchisePage(franchisePage - 1)
                              }
                              disabled={franchisePage <= 0}
                            >
                              «
                            </button>
                            <button
                              className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300"
                              onClick={() =>
                                setFranchisePage(franchisePage + 1)
                              }
                              disabled={!franchiseList.more}
                            >
                              »
                            </button>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Button
            className="w-36 text-xs sm:text-sm sm:w-64"
            title="Add Franchise"
            onPress={createFranchise}
          />
        </div>
        <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
          <h3 className="text-neutral-100 text-xl">User Management</h3>
          <div className="bg-neutral-100 overflow-clip my-4">
            <div className="flex flex-col">
              <div className="-m-1.5 overflow-x-auto">
                <div className="p-1.5 min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                        <tr>
                          {["Name", "Email", "Role"].map((header) => (
                            <th
                              key={header}
                              scope="col"
                              className="px-6 py-3 text-center text-xs font-medium"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {userLoading ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="text-center py-8 text-gray-600"
                            >
                              Loading users...
                            </td>
                          </tr>
                        ) : userList.users.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="text-center py-8 text-gray-600"
                            >
                              No users found
                            </td>
                          </tr>
                        ) : (
                          userList.users.map((user) => (
                            <tr key={user.id} className="bg-neutral-100">
                              <td className="text-start px-6 py-2 whitespace-nowrap text-sm font-mono text-orange-600">
                                {user.name}
                              </td>
                              <td className="text-start px-6 py-2 whitespace-nowrap text-sm text-gray-800">
                                {user.email}
                              </td>
                              <td className="text-start px-6 py-2 whitespace-nowrap text-sm text-gray-800">
                                {user.roles &&
                                  user.roles.map((role, index) => (
                                    <span key={index}>
                                      {index === 0 ? "" : ", "}{" "}
                                      {formatRole(role)}
                                    </span>
                                  ))}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="px-1 py-1">
                            <input
                              type="text"
                              ref={filterUserRef}
                              name="filterUser"
                              placeholder="Filter users"
                              className="px-2 py-1 text-sm border border-gray-300 rounded-lg"
                            />
                            <button
                              type="submit"
                              className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800"
                              onClick={filterUsers}
                              disabled={userLoading}
                            >
                              Search
                            </button>
                          </td>
                          <td
                            colSpan={2}
                            className="text-end text-sm font-medium"
                          >
                            <span className="mr-4 text-sm text-gray-600">
                              Page {userPage + 1} ({userList.total} total users)
                            </span>
                            <button
                              className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300"
                              onClick={handlePrevPage}
                              disabled={userPage <= 0 || userLoading}
                              data-testid="user-prev-page"
                            >
                              «
                            </button>
                            <button
                              className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300"
                              onClick={handleNextPage}
                              disabled={
                                userPage >=
                                  Math.ceil(userList.total / 10) - 1 ||
                                userLoading
                              }
                              data-testid="user-next-page"
                            >
                              »
                            </button>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </View>
    );
  }

  return response;
}
