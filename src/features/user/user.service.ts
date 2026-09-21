import bcrypt from "bcrypt";
import { Temporal } from "temporal-polyfill";
import { or } from "@prisma/orm-postgres/orm-client";
import { db } from "../../prisma/db";
import { GraphQLContext } from "../../types/context";
import { verifyRoleORGAdmin } from "../common/guards";
import { CreateUserInput, ChangeUserRoleInput, GetUsersArgs } from "./user.type";
import { GraphQLError } from "graphql/error";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);

async function createUser(input: CreateUserInput, context: GraphQLContext) {
  const subsidiary = await db.orm.public.Subsidiaries
    .select("id", "organizationId", "status")
    .where((s) => s.id.eq(input.subsidiaryId))
    .first();

  if (!subsidiary) {
    throw new GraphQLError("Subsidiary not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (subsidiary.status !== "ACTIVE") {
    throw new GraphQLError("Cannot create user under an INACTIVE subsidiary", {
      extensions: { code: "BAD_REQUEST" },
    });
  }

  verifyRoleORGAdmin(context, subsidiary.organizationId);

  const targetRole = input.role || "MEMBER";
  if (targetRole !== "MEMBER" && context.user?.role !== "SUPER_ADMIN") {
    throw new GraphQLError("Only SUPER_ADMIN may grant ORG_ADMIN or SUPER_ADMIN role", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  const existingUser = await db.orm.public.Users
    .select("id")
    .where((u) => u.email.eq(input.email as never))
    .first();

  if (existingUser) {
    throw new GraphQLError("Email already exists", {
      extensions: { code: "DUPLICATED_RESOURCE" },
    });
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  return await db.orm.public.Users.create({
    email: input.email as never,
    fullName: input.fullName as never,
    passwordHash: passwordHash as never,
    subsidiaryId: input.subsidiaryId,
    role: targetRole as never,
    status: "ACTIVE",
    createdAt: Temporal.Now.instant(),
  });
}

async function changeUserRole(input: ChangeUserRoleInput, context: GraphQLContext) {
  const targetUser = await db.orm.public.Users
    .select("id", "email", "role", "subsidiaryId")
    .where((u) => u.id.eq(input.userId))
    .include("subsidiary", (sub) => sub.select("organizationId"))
    .first();

  if (!targetUser || !targetUser.subsidiary) {
    throw new GraphQLError("User not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (targetUser.email === context.user?.email) {
    throw new GraphQLError("You cannot change your own role", {
      extensions: { code: "BAD_REQUEST" },
    });
  }

  verifyRoleORGAdmin(context, targetUser.subsidiary.organizationId);

  if (
    (input.newRole === "ORG_ADMIN" || input.newRole === "SUPER_ADMIN") &&
    context.user?.role !== "SUPER_ADMIN"
  ) {
    throw new GraphQLError("Only SUPER_ADMIN may grant ORG_ADMIN role", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return await db.orm.public.Users
    .where((u) => u.id.eq(input.userId))
    .update({ role: input.newRole as never });
}

// 3. Truy vấn danh sách Users toàn cục (Phân trang, Search, Filter, Scoped Org)
async function getUsers(args: GetUsersArgs, context: GraphQLContext) {
  let query = db.orm.public.Users.select(
    "id",
    "email",
    "fullName",
    "role",
    "status",
    "createdAt",
    "subsidiaryId"
  );

  // 🛡️ Rule R1: Nếu không phải SUPER_ADMIN, giới hạn chỉ xem users thuộc các chi nhánh trong Org của họ
  if (context.user?.role !== "SUPER_ADMIN") {
    const orgSubs = await db.orm.public.Subsidiaries
      .select("id")
      .where((s) => s.organizationId.eq(context.user!.organizationId))
      .all();

    const subIds = orgSubs.map((s) => s.id);
    if (subIds.length === 0) {
      return {
        items: [],
        total: 0,
        page: args.page || 1,
        totalPages: 0,
      };
    }
    query = query.where((u) => u.subsidiaryId.in(subIds));
  }

  // Filter theo subsidiaryId
  if (args.filter?.subsidiaryId) {
    // Nếu không phải SUPER_ADMIN, kiểm tra subsidiaryId có thuộc Org của họ không
    if (context.user?.role !== "SUPER_ADMIN") {
      const sub = await db.orm.public.Subsidiaries
        .select("organizationId")
        .where((s) => s.id.eq(args.filter.subsidiaryId!))
        .first();

      if (!sub || sub.organizationId !== context.user.organizationId) {
        throw new GraphQLError("Forbidden: Subsidiary does not belong to your organization", {
          extensions: { code: "FORBIDDEN" },
        });
      }
    }
    query = query.where((u) => u.subsidiaryId.eq(args.filter!.subsidiaryId!));
  }

  // Search theo fullName hoặc email
  if (args.filter?.search) {
    const keyword = `%${args.filter.search.trim()}%`;
    query = query.where((u) => or(u.fullName.ilike(keyword), u.email.ilike(keyword)));
  }

  // Filter theo role
  if (args.filter?.role) {
    query = query.where((u) => u.role.eq(args.filter!.role as never));
  }

  // Filter theo status (ACTIVE / INACTIVE)
  if (args.filter?.status) {
    query = query.where((u) => u.status.eq(args.filter!.status as never));
  }

  // Đếm tổng số bản ghi khớp filter
  const countResult = await query.aggregate((agg) => ({
    total: agg.count(),
  }));
  const total = Number(countResult.total || 0);

  // Sorting
  const sortBy = args.sortBy || "createdAt_DESC";
  if (sortBy === "createdAt_ASC") {
    query = query.orderBy((u) => u.createdAt.asc());
  } else if (sortBy === "fullName_ASC") {
    query = query.orderBy((u) => u.fullName.asc());
  } else if (sortBy === "fullName_DESC") {
    query = query.orderBy((u) => u.fullName.desc());
  } else {
    query = query.orderBy((u) => u.createdAt.desc());
  }

  // Phân trang
  const page = Math.max(1, args.page || 1);
  const limit = Math.max(1, Math.min(100, args.limit || 10));
  const offset = (page - 1) * limit;

  const items = await query.limit(limit).offset(offset).all();
  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page,
    totalPages,
  };
}

// 4. Deactivate User (🛡️ R3: Không được tự tắt chính mình, 🛡️ R1: Scoped Org)
async function deactivateUser(id: number, context: GraphQLContext) {
  const targetUser = await db.orm.public.Users
    .select("id", "email", "subsidiaryId")
    .where((u) => u.id.eq(id))
    .include("subsidiary", (sub) => sub.select("organizationId"))
    .first();

  if (!targetUser || !targetUser.subsidiary) {
    throw new GraphQLError("User not found", { extensions: { code: "NOT_FOUND" } });
  }

  // 🛡️ Rule R3: Không được tự tắt chính mình
  if (targetUser.email === context.user?.email) {
    throw new GraphQLError("You cannot deactivate your own user account", {
      extensions: { code: "BAD_REQUEST" },
    });
  }

  // 🛡️ Rule R1: Scoped Org
  verifyRoleORGAdmin(context, targetUser.subsidiary.organizationId);

  return await db.orm.public.Users
    .where((u) => u.id.eq(id))
    .update({ status: "INACTIVE" as never });
}

// 5. Reactivate User (🛡️ R3: Chi nhánh cha phải đang ACTIVE, 🛡️ R1: Scoped Org)
async function reactivateUser(id: number, context: GraphQLContext) {
  const targetUser = await db.orm.public.Users
    .select("id", "subsidiaryId")
    .where((u) => u.id.eq(id))
    .include("subsidiary", (sub) => sub.select("organizationId", "status"))
    .first();

  if (!targetUser || !targetUser.subsidiary) {
    throw new GraphQLError("User not found", { extensions: { code: "NOT_FOUND" } });
  }

  verifyRoleORGAdmin(context, targetUser.subsidiary.organizationId);

  // 🛡️ Rule R3: Không cho kích hoạt user nếu chi nhánh đang bị INACTIVE
  if (targetUser.subsidiary.status !== "ACTIVE") {
    throw new GraphQLError("Cannot reactivate user under an INACTIVE subsidiary", {
      extensions: { code: "BAD_REQUEST" },
    });
  }

  return await db.orm.public.Users
    .where((u) => u.id.eq(id))
    .update({ status: "ACTIVE" as never });
}

// 6. Lấy danh sách Users theo subsidiaryId
async function getUsersBySubsidiaryId(subsidiaryId: number) {
  return await db.orm.public.Users
    .select(
      "id",
      "email",
      "fullName",
      "role",
      "status",
      "createdAt",
      "subsidiaryId"
    )
    .where((u) => u.subsidiaryId.eq(subsidiaryId))
    .all();
}

export {
  createUser,
  changeUserRole,
  getUsers,
  deactivateUser,
  reactivateUser,
  getUsersBySubsidiaryId,
};



