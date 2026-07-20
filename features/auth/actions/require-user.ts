"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// get user from clerk and check is user present in prisma and return user

import { appCache, CACHE_TTL } from "@/lib/cache";

// get user from clerk and check is user present in prisma and return user

export async function requireUser() {
    const { userId } = await auth.protect();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const cacheKey = `user:${userId}`;
    const cachedUser = appCache.get<any>(cacheKey);
    if (cachedUser) {
        return cachedUser;
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!user) {
        throw new Error("User not found");
    }

    appCache.set(cacheKey, user, CACHE_TTL.USER);
    return user;
}