import { languageArray, themeArray, userRoleArray } from "../constants/constants";
import { userRoleType } from "../types/types";

export interface IUser {
    username: string;
    email: string;
    contact: {
        countryCode: string;
        phone: string;
    };
    role: typeof userRoleArray[number];
    isBlocked: boolean;
    avatar: string;
    emailVerified: boolean;
    otp: {
        value: string;
        generatedAt: Date;
        expiresAt: Date;
    } | null;
    contactVerified: boolean;
    password: string;
    lastLogin: Date | null;
    preferences: {
        theme: typeof themeArray[number];
        language: typeof languageArray[number];
    };
    refreshToken: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserMethods {
    generateAccessToken(): string;
    generateRefreshToken(): string;
    isPasswordCorrect(password: string): Promise<boolean>;
}

export interface IAuthPayload {
    _id: string;
    role: userRoleType;
}

export interface IRefreshTokenPayload {
    _id: string;
}