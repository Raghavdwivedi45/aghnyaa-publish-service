import { Model } from "mongoose";
import { IUser, IUserMethods } from "../interfaces/interfaces";

export type userRoleType = "READER" | "AUTHOR" | "ADMIN";

export type themeType = "Default";

export type languageType = "English"

export type genreType = "Fiction" | "Non-Fiction" | "Poetry" | "Biography" | "Fantasy" | "Mystery" | "Romance" | "Horror" | "Self-Help" | "Other";

export type UserModel = Model<IUser, {}, IUserMethods>;