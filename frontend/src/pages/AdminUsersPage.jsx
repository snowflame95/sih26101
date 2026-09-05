import { useEffect, useState } from "react";

import adminApi from "../api/adminApi";


export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] =
    useState(null);


  const loadUsers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await adminApi.getUsers();

      setUsers(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load users."
      );
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    loadUsers();
  }, []);


  // ========================================================
  // ROLE UPDATE
  // ========================================================

  const handleRoleChange = async (
    userId,
    role
  ) => {
    setMessage("");
    setError("");
    setUpdatingUserId(userId);

    try {
      await adminApi.updateUserRole(
        userId,
        role
      );

      setMessage(
        "User role updated successfully."
      );

      await loadUsers();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update user role."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };


  // ========================================================
  // ACTIVE / INACTIVE STATUS
  // ========================================================

  const handleStatusChange = async (
    userId,
    isActive
  ) => {
    setMessage("");
    setError("");
    setUpdatingUserId(userId);

    try {
      await adminApi.updateUserStatus(
        userId,
        isActive
      );

      setMessage(
        isActive
          ? "User account activated successfully."
          : "User account disabled successfully."
      );

      await loadUsers();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update user status."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };


  return (
    <div>
      <h1>
        User Management
      </h1>

      <p style={styles.subtitle}>
        View platform users and manage
        their roles and access status.
      </p>


      {/* ====================================================
          FEEDBACK
      ===================================================== */}

      {message && (
        <div style={styles.success}>
          {message}
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}


      {/* ====================================================
          PRIVILEGED ACCOUNT INFORMATION
      ===================================================== */}

      <div style={styles.infoCard}>
        <strong>
          Privileged account provisioning
        </strong>

        <p style={styles.infoText}>
          New Trainer and Admin accounts are
          provisioned through the protected
          backend registration flow. The special
          registration key is intentionally never
          exposed to the frontend.
        </p>

        <p style={styles.infoText}>
          Administrators can manage existing user
          roles and platform access from this page.
        </p>
      </div>


      {/* ====================================================
          USERS
      ===================================================== */}

      <div style={styles.card}>
        <div style={styles.tableHeader}>
          <h2>
            Platform Users
          </h2>

          <button
            type="button"
            onClick={loadUsers}
            disabled={isLoading}
            style={styles.refreshButton}
          >
            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>


        {isLoading ? (
          <p>
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p>
            No users found.
          </p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    ID
                  </th>

                  <th style={styles.th}>
                    Email
                  </th>

                  <th style={styles.th}>
                    Role
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>

                  <th style={styles.th}>
                    Profile
                  </th>

                  <th style={styles.th}>
                    Actions
                  </th>
                </tr>
              </thead>


              <tbody>
                {users.map((item) => {
                  const isUpdating =
                    updatingUserId ===
                    item.id;

                  return (
                    <tr key={item.id}>
                      {/* ID */}
                      <td style={styles.td}>
                        {item.id}
                      </td>


                      {/* EMAIL */}
                      <td style={styles.td}>
                        <strong>
                          {item.email}
                        </strong>
                      </td>


                      {/* ROLE */}
                      <td style={styles.td}>
                        <select
                          value={
                            item.role
                          }
                          disabled={
                            isUpdating
                          }
                          onChange={(
                            event
                          ) =>
                            handleRoleChange(
                              item.id,
                              event.target
                                .value
                            )
                          }
                          style={
                            styles.select
                          }
                        >
                          <option value="learner">
                            Learner
                          </option>

                          <option value="tester">
                            Tester
                          </option>

                          <option value="trainer">
                            Trainer
                          </option>

                          <option value="admin">
                            Admin
                          </option>
                        </select>
                      </td>


                      {/* STATUS */}
                      <td style={styles.td}>
                        <span
                          style={
                            item.is_active
                              ? styles.activeBadge
                              : styles.inactiveBadge
                          }
                        >
                          {item.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>


                      {/* PROFILE */}
                      <td style={styles.td}>
                        {item.profile ? (
                          <div>
                            <strong>
                              {
                                item
                                  .profile
                                  .full_name
                              }
                            </strong>

                            {item
                              .profile
                              .designation && (
                              <div
                                style={
                                  styles.small
                                }
                              >
                                {
                                  item
                                    .profile
                                    .designation
                                }
                              </div>
                            )}

                            {item
                              .profile
                              .department && (
                              <div
                                style={
                                  styles.small
                                }
                              >
                                {
                                  item
                                    .profile
                                    .department
                                }
                              </div>
                            )}

                            {item
                              .profile
                              .experience_years !==
                              null &&
                              item
                                .profile
                                .experience_years !==
                                undefined && (
                                <div
                                  style={
                                    styles.small
                                  }
                                >
                                  Experience:{" "}
                                  {
                                    item
                                      .profile
                                      .experience_years
                                  }{" "}
                                  years
                                </div>
                              )}
                          </div>
                        ) : (
                          <span
                            style={
                              styles.muted
                            }
                          >
                            Not completed
                          </span>
                        )}
                      </td>


                      {/* ACTIONS */}
                      <td style={styles.td}>
                        <div
                          style={
                            styles.actions
                          }
                        >
                          {/* ROLE STATUS */}
                          <span
                            style={
                              styles.actionLabel
                            }
                          >
                            Role
                          </span>


                          {/* ENABLE / DISABLE */}
                          <button
                            type="button"
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              handleStatusChange(
                                item.id,
                                !item.is_active
                              )
                            }
                            style={
                              item.is_active
                                ? styles.disableButton
                                : styles.enableButton
                            }
                          >
                            {isUpdating
                              ? "Updating..."
                              : item.is_active
                              ? "Disable"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


const styles = {
  subtitle: {
    color: "#64748b",
    marginBottom: "1rem",
  },

  infoCard: {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    padding: "1rem",
    borderRadius: "10px",
    marginBottom: "1rem",
  },

  infoText: {
    color: "#475569",
    marginBottom: "0.5rem",
  },

  card: {
    background: "#ffffff",
    padding: "1.25rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },

  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1rem",
  },

  refreshButton: {
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    padding: "0.6rem 0.9rem",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "0.75rem",
    borderBottom:
      "2px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "0.75rem",
    borderBottom:
      "1px solid #e2e8f0",
    verticalAlign: "top",
  },

  select: {
    padding: "0.5rem",
    border:
      "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "#ffffff",
    cursor: "pointer",
  },

  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    minWidth: "110px",
  },

  actionLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontWeight: 700,
  },

  disableButton: {
    border:
      "1px solid #dc2626",
    background: "#ffffff",
    color: "#dc2626",
    padding: "0.5rem 0.7rem",
    borderRadius: "6px",
    fontWeight: 700,
    cursor: "pointer",
  },

  enableButton: {
    border:
      "1px solid #15803d",
    background: "#ffffff",
    color: "#15803d",
    padding: "0.5rem 0.7rem",
    borderRadius: "6px",
    fontWeight: 700,
    cursor: "pointer",
  },

  activeBadge: {
    display: "inline-block",
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "0.75rem",
    fontWeight: 700,
  },

  inactiveBadge: {
    display: "inline-block",
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "0.75rem",
    fontWeight: 700,
  },

  small: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "0.15rem",
  },

  muted: {
    color: "#64748b",
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
};