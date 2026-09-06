import { IAuthorInfo } from "../interfaces/article.interfaces";
import { ApiError } from "../common-folder/utils/apiError";
import { URLGenerator } from "./helperFunctions";

const servertToServerHeader = {
    headers: {
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN ?? ""}`
    }
}

export const isUserVerified = async (userId: string) => {
    const response = await fetch(URLGenerator("USER", `/v1/service/auth/${userId}/status`), servertToServerHeader);
    if (!response.ok) {
        throw new ApiError(response?.status || 404, "Unable to contact User Service");
    }

    const body = await response.json();
    const data = body?.data;
    if (data?.isBlocked || (!data.emailVerified && !data.contactVerified)) {
        return false;
    }

    return true;
};

export const fetchAuthorInfo = async (userIds: string[], nameOnly: boolean = false) => {
    if (!userIds?.length) return []; // no authors to look up -> skip the round trip
    const params = new URLSearchParams({ userIds: userIds.join(","), nameOnly: String(nameOnly) });
    const response = await fetch(URLGenerator("USER", `/v1/service/auth?${params?.toString()}`), servertToServerHeader); // 1. Use URLSearchParams Instead of manually constructing the query string:
    if (!response.ok) {
        throw new ApiError(response?.status || 404, "Unable to contact User Service");
    }

    const body = await response.json();
    const data = body?.data as IAuthorInfo[];
    return data;
};

export const updateUserHistory = async (userId: string, slug: string = "", type: "article-read" | "draft-article-created" | "draft-article-edited" | "article-published" | "published-article-edited") => {
    if (!userId || (type === "article-read" && !slug) || !type || !["article-read", "draft-article-created", "draft-article-edited", "article-published", "published-article-edited"].includes(type)) {
        return null;
    }
    const response = await fetch(URLGenerator("USER", `/v1/service/auth/${userId}/performance`), {
        headers: {
            ...servertToServerHeader.headers,
            "Content-Type": "application/json",
        },
        method: "PATCH",
        body: JSON.stringify({ type, slug })
    });
    if (!response.ok) {
        return null;
    }

    const body = await response.json();
    const message = body?.message;
    return message;
};
