"use server";


import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";

import type { User } from "@/lib/generated/prisma/client";

