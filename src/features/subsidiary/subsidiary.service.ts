import { Temporal } from "temporal-polyfill"
import {db} from "../../prisma/db"
import { CreateSubsidiaryInput, UpdateSubsidiaryInput } from "./subsidiary.type"
import { GraphQLError } from "graphql/error"
import { GraphQLContext } from "../.."
import { verifyRoleORGAdmin } from "../common/guards"

async function isCodeDuplicated(orgId: number, subCode: string, excludedSubId?: number): Promise<boolean>{
    let query = db.orm.public.Subsidiaries
        .select("id")
        .where((sub) => sub.organizationId.eq(orgId))
        .where((sub) => sub.code.eq(subCode as never))
    if(excludedSubId) {
        query = query.where((sub) => sub.id.neq(excludedSubId))
    }
    const result = await query.first()
    return result !== null && result !== undefined;
}

async function createSubsidiary(input: CreateSubsidiaryInput){
    let duplicated: boolean = await isCodeDuplicated(input.organizationId, input.code).then(result => result)
    if(duplicated){
        throw new GraphQLError("Duplicated Subsidiary Code", {extensions: {code: "Duplicated resource"}})
    }
    return await db.orm.public.Subsidiaries.create({
        name: input.name,
        code: input.code,
        country: input.country,
        status: "ACTIVE",
        createdAt: Temporal.Now.instant(),
        organizationId: input.organizationId
    })
}

async function updateSubsidiary(input: UpdateSubsidiaryInput, context: GraphQLContext){
    
    const currentSub = await db.orm.public.Subsidiaries
    .select("id", "organizationId", "code", "status")
    .where((sub) => sub.id.eq(input.subsidiaryId))
    .first()
    
    if(!currentSub){
        throw new GraphQLError("Subsidiary not found", {
            extensions: {code: "NOT_FOUND"}
        })
    }
    
    verifyRoleORGAdmin(context, currentSub?.organizationId)
    
    if (input.code && input.code !== currentSub.code) {
      const duplicated = await isCodeDuplicated(
        currentSub.organizationId,
        input.code,
        input.subsidiaryId);
      if (duplicated) {
        throw new GraphQLError("Duplicated Subsidiary Code in this Organization", {
          extensions: { code: "DUPLICATED_RESOURCE" },
        });
      }
    }

    const dataToUpdate: {
      name?: string;
      code?: string;
      country?: string | null;
    } = {};
    if (input.name) dataToUpdate.name = input.name;
    if (input.code) dataToUpdate.code = input.code;
    if (input.country !== undefined && input.country !== null) {
      dataToUpdate.country = input.country;
    }

    const updatedSubsidiary = await db.orm.public.Subsidiaries
      .where((sub) => sub.id.eq(input.subsidiaryId))
      .update(dataToUpdate as never);
    return updatedSubsidiary;
}


// ⚡ Rule R2 + 🛡️ Rule R3: Cascading Deactivation Sub -> Users trong Transaction
async function deactivateSubsidiary(id: number, context: GraphQLContext) {
  const sub = await db.orm.public.Subsidiaries
    .select("id", "organizationId")
    .where((s) => s.id.eq(id))
    .first();

  if (!sub) {
    throw new GraphQLError("Subsidiary not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  // 🛡️ Rule R1: Scoped Org
  verifyRoleORGAdmin(context, sub.organizationId);

  // 🛡️ Rule R3: Không được tự tắt Subsidiary của chính mình
  if (context.user?.subsidiaryId === id) {
    throw new GraphQLError("You cannot deactivate the subsidiary that contains yourself", {
      extensions: { code: "BAD_REQUEST" },
    });
  }

  // ⚡ Rule R2: Transaction tắt Sub và toàn bộ Users con
  return await db.transaction(async (tx) => {
    await tx.orm.public.Users
      .where((u) => u.subsidiaryId.eq(id))
      .update({ status: "INACTIVE" as never });

    return await tx.orm.public.Subsidiaries
      .where((s) => s.id.eq(id))
      .update({ status: "INACTIVE" as never });
  });
}

// Reactivate Subsidiary (yêu cầu Org cha phải đang ACTIVE)
async function reactivateSubsidiary(id: number, context: GraphQLContext) {
  const sub = await db.orm.public.Subsidiaries
    .select("id", "organizationId")
    .where((s) => s.id.eq(id))
    .include("organization", (org) => org.select("status"))
    .first();

  if (!sub || !sub.organization) {
    throw new GraphQLError("Subsidiary not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  verifyRoleORGAdmin(context, sub.organizationId);

  // 🛡️ Rule R3: Chặn bật lại nếu Org cha đang bị INACTIVE
  if (sub.organization.status !== "ACTIVE") {
    throw new GraphQLError("Cannot reactivate subsidiary under an INACTIVE organization", {
      extensions: { code: "BAD_REQUEST" },
    });
  }

  return await db.orm.public.Subsidiaries
    .where((s) => s.id.eq(id))
    .update({ status: "ACTIVE" as never });
}

export {
  createSubsidiary,
  updateSubsidiary,
  deactivateSubsidiary,
  reactivateSubsidiary,
};