"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "../lib/axios";
import { User, LoginCredentials, RegisterCredentials } from "../types";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    credentials: RegisterCredentials & {
      confirmPassword: string;
      avatar?: File;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: {
    name?: string;
    bio?: string;
    avatar?: File;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await api.get("/users/profile");
      return data;
    },
    enabled: !!Cookies.get("accessToken"),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = localStorage.getItem("auth-user");
        if (userData) {
          setUser(JSON.parse(userData));
        } else if (Cookies.get("accessToken")) {
          const response = await api.get("/users/profile");
          const profileData = response.data;
          const user: User = {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            createdAt: profileData.createdAt,
            bio: profileData.bio,
            avatar: profileData.avatar,
            postsCount: profileData.postsCount,
            commentsCount: profileData.commentsCount,
            reactionsCount: profileData.reactionsCount,
          };
          setUser(user);
          localStorage.setItem("auth-user", JSON.stringify(user));
        }
      } catch (error: any) {
        console.error("Failed to fetch profile:", error);
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        localStorage.removeItem("auth-user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { user, accessToken, refreshToken } = response.data;
      Cookies.set("accessToken", accessToken, {
        expires: 1 / 24, // 1 hour
        sameSite: "Strict",
      });
      Cookies.set("refreshToken", refreshToken, {
        expires: 7, // 7 days
        sameSite: "Strict",
      });
      // Ensure user includes counts (default to 0 if not provided)
      const fullUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        bio: user.bio,
        avatar: user.avatar,
        postsCount: user.postsCount || 0,
        commentsCount: user.commentsCount || 0,
        reactionsCount: user.reactionsCount || 0,
      };
      localStorage.setItem("auth-user", JSON.stringify(fullUser));
      setUser(fullUser);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.push("/");
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (
    credentials: RegisterCredentials & {
      confirmPassword: string;
      avatar?: File;
    }
  ) => {
    try {
      const { name, email, password, confirmPassword, avatar } = credentials;
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);
      if (avatar) {
        formData.append("avatar", avatar);
      }

      const response = await api.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { user, accessToken, refreshToken } = response.data;
      Cookies.set("accessToken", accessToken, {
        expires: 1 / 24, // 1 hour
        sameSite: "Strict",
      });
      Cookies.set("refreshToken", refreshToken, {
        expires: 7, // 7 days
        sameSite: "Strict",
      });
      // Ensure user includes counts (default to 0 for new users)
      const fullUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        bio: user.bio,
        avatar: user.avatar,
        postsCount: user.postsCount || 0,
        commentsCount: user.commentsCount || 0,
        reactionsCount: user.reactionsCount || 0,
      };
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      localStorage.setItem("auth-user", JSON.stringify(fullUser));

      setUser(fullUser);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.push("/");
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const updateProfile = async ({
    name,
    bio,
    avatar,
  }: {
    name?: string;
    bio?: string;
    avatar?: File;
  }) => {
    try {
      const formData = new FormData();
      if (name) formData.append("name", name);
      if (bio) formData.append("bio", bio);
      if (avatar) formData.append("avatar", avatar);

      const response = await api.post("/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updatedUser = response.data;
      const fullUser: User = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        postsCount: updatedUser.postsCount || 0,
        commentsCount: updatedUser.commentsCount || 0,
        reactionsCount: updatedUser.reactionsCount || 0,
      };
      localStorage.setItem("auth-user", JSON.stringify(fullUser));
      setUser(fullUser);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Profile update failed";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      localStorage.removeItem("auth-user");
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.push("/auth");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
