"use server"; 

import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";


import { appCache } from "@/lib/cache";

export async function onBoard() {

    const clerkUser = await currentUser();

    if(!clerkUser){
        throw new Error("Unauthorized")
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

    appCache.delete(`user:${clerkUser.id}`);

    // if data is alreday exist, update data
    // if data is not present, create new data
    return prisma.user.upsert({
        where:{clerkId: clerkUser.id},
        create: {
            clerkId: clerkUser.id,
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
        },
        update: {
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
        }
    })
}