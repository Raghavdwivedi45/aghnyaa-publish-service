import { userRoleType, themeType, languageType, genreType } from "../types/types";

export const userRoleArray: userRoleType[] = ["READER", "AUTHOR", "ADMIN"];

export const themeArray: themeType[] = ["Default"];

export const languageArray: languageType[] = ["English"]

export const genreArray: genreType[] = ["Fiction", "Non-Fiction", "Poetry", "Biography", "Fantasy", "Mystery", "Romance", "Horror", "Self-Help", "Other"];

export const redisRateLimit = 5;
export const windowInSeconds = 60;

// In production the API and the frontend sit on different domains, so auth cookies must be
// cross-site: sameSite "none", which browsers only accept together with secure. Locally both
// run on localhost, where "strict" works and secure would block the cookie over plain http.
const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "strict",
} as const;

export const refreshTokenCookiePath = "/v1/auth/refresh-token";