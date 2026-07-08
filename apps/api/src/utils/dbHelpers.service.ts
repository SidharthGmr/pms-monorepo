import prisma from "../config/prisma";

/**
 * Get last record ordered by a column
 * @param model Prisma model name (ex: prisma.users)
 * @param column Column name (ex: "id", "createdAt")
 */
export async function getLastRecord<T>(
  model: any,
  column: string
): Promise<T | null> {
  return model.findFirst({
    orderBy: {
      [column]: "desc",
    },
  });
}
