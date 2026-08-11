import type { Role } from "../api/types";

export function homePath(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "PLATFORM_ADMIN":
      return "/platform";
    case "TEACHER":
      return "/dashboard";
  }
}
