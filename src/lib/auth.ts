// File: lib/auth.ts
export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }
  
  export function isAuthenticated(): boolean {
    return !!getToken();
  }
  
  export function logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }
  