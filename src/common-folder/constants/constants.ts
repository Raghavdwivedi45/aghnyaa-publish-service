import { userRoleType, themeType, languageType, genreType } from "../types/types";

export const userRoleArray: userRoleType[] = ["READER", "AUTHOR", "ADMIN"];

export const themeArray: themeType[] = ["Default"];

export const languageArray: languageType[] = ["English"]

export const genreArray: genreType[] = ["Fiction", "Non-Fiction", "Poetry", "Biography", "Fantasy", "Mystery", "Romance", "Horror", "Self-Help", "Other"];

export const redisRateLimit = 5;
export const windowInSeconds = 60;