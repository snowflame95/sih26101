const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

const TOKEN_STORAGE_KEY = "sih_access_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return;
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function buildApiUrl(path) {
  const normalizedBaseUrl = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text ? text : null;
}

async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    auth = false,
    includeCredentials = false,
  } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  /*
   * FormData is used for file uploads.
   *
   * When body is FormData:
   * - Do NOT set Content-Type manually.
   * - Do NOT JSON.stringify() it.
   * The browser automatically sets the correct
   * multipart/form-data Content-Type with its boundary.
   */
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && body !== null && !isFormData) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const token = getStoredToken();

  if (auth && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: requestHeaders,
    ...(includeCredentials
      ? {
          credentials: "include",
        }
      : {}),
  };

  if (body !== undefined && body !== null) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(buildApiUrl(path), config);

  const payload = await parseResponse(response);

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object"
        ? payload.detail ||
          payload.message ||
          payload.error ||
          "Request failed"
        : payload || `Request failed with status ${response.status}`;

    throw new Error(
      typeof errorMessage === "string"
        ? errorMessage
        : JSON.stringify(errorMessage)
    );
  }

  return payload;
}

export const apiClient = {
  get(path, options = {}) {
    return request(path, {
      ...options,
      method: "GET",
    });
  },

  post(path, body, options = {}) {
    return request(path, {
      ...options,
      method: "POST",
      body,
    });
  },

  put(path, body, options = {}) {
    return request(path, {
      ...options,
      method: "PUT",
      body,
    });
  },

  patch(path, body, options = {}) {
    return request(path, {
      ...options,
      method: "PATCH",
      body,
    });
  },

  delete(path, options = {}) {
    return request(path, {
      ...options,
      method: "DELETE",
    });
  },
};

export default apiClient;