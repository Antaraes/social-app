import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle expired access token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = Cookies.get("refreshToken");
        if (!refreshToken) throw new Error("No refresh token available");

        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken } = res.data;
        Cookies.set("accessToken", accessToken, { expires: 0.01 }); // short-lived
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        handleLogout(); // 🔴 force logout if refresh fails
        return Promise.reject(err);
      }
    }

    // Handle profile not found (404)
    if (
      error.response?.status === 404 &&
      originalRequest.url.includes("/users/profile")
    ) {
      handleLogout(); // 🔴 force logout if user profile not found
    }

    return Promise.reject(error);
  }
);

// 🔒 Shared logout helper
const handleLogout = () => {
  Cookies.remove("accessToken");
  Cookies.remove("refreshToken");
  localStorage.removeItem("auth-user");
  window.location.href = "/auth?login";
};

export default api;
