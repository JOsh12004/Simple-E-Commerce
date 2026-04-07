const AUTH_USER_KEY = "authUser";
const AUTH_TOKEN_KEY = "authToken";

export const saveAuthUser = (user) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const saveAuthSession = ({ user, token }) => {
  saveAuthUser(user);
  localStorage.setItem(AUTH_TOKEN_KEY, token || "");
};

export const getAuthUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAuthUser = () => {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || "";

export const isAdminUser = () => {
  const user = getAuthUser();
  return (user?.role || "").toLowerCase() === "admin";
};

export const getAuthHeaders = () => {
  const token = getAuthToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};
