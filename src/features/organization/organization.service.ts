import { db } from "../../prisma/db";
import { GraphQLContext } from "../../types/context";
import { GraphQLError } from "graphql/error";

async function getOrganizations() {
  return await db.orm.public.Organizations
    .select("id", "name", "code", "status", "createdAt")
    .all();
}

async function getOrganizationById(id: number) {
  return await db.orm.public.Organizations
    .select("id", "name", "code", "status", "createdAt")
    .where((org) => org.id.eq(id))
    .include("subsidiaries", (sub) =>
      sub
        .select("id", "name", "code", "country", "status", "createdAt")
        .include("users", (user) => user.count())
    )
    .first();
}

async function getOrganizationsWithSubsidiariesAndUser() {
  return await db.orm.public.Organizations
    .select("id", "name", "code", "status", "createdAt")
    .include("subsidiaries", (sub) =>
      sub
        .select("id", "name", "code", "country", "status", "createdAt")
        .include("users", (user) => user.count())
    )
    .all();
}

// ⚡ Rule R2 + 🛡️ Rule R3: Cascading Deactivation trong Transaction
async function deactivateOrganization(id: number, context: GraphQLContext) {
  if (context.user?.organizationId === id) {
    throw new GraphQLError("You cannot deactivate the organization that contains yourself", {
      extensions: { code: "BAD_REQUEST" },
    });
  }

  const existingOrg = await db.orm.public.Organizations
    .select("id")
    .where((org) => org.id.eq(id))
    .first();

  if (!existingOrg) {
    throw new GraphQLError("Organization not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  return await db.transaction(async (tx) => {
    // 1. Lấy danh sách ID các chi nhánh thuộc Org
    const subs = await tx.orm.public.Subsidiaries
      .select("id")
      .where((s) => s.organizationId.eq(id))
      .all();

    const subIds = subs.map((s) => s.id);

    // 2. Cascade tắt toàn bộ Users con
    if (subIds.length > 0) {
      await tx.orm.public.Users
        .where((u) => u.subsidiaryId.in(subIds))
        .update({ status: "INACTIVE" as never });
    }

    // 3. Cascade tắt toàn bộ Subsidiaries
    await tx.orm.public.Subsidiaries
      .where((s) => s.organizationId.eq(id))
      .update({ status: "INACTIVE" as never });

    // 4. Tắt Organization
    return await tx.orm.public.Organizations
      .where((org) => org.id.eq(id))
      .update({ status: "INACTIVE" as never });
  });
}

// Reactivate Organization
async function reactivateOrganization(id: number) {
  const existingOrg = await db.orm.public.Organizations
    .select("id")
    .where((org) => org.id.eq(id))
    .first();

  if (!existingOrg) {
    throw new GraphQLError("Organization not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  return await db.orm.public.Organizations
    .where((org) => org.id.eq(id))
    .update({ status: "ACTIVE" as never });
}

export const organizationService = {
  getOrganizations,
  getOrganizationById,
  getOrganizationsWithSubsidiariesAndUser,
  deactivateOrganization,
  reactivateOrganization,
};

