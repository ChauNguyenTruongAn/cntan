// src/graphql/scalars/dateTime.ts
import { GraphQLScalarType, Kind, ValueNode } from "graphql";

function hasToString(obj: unknown): obj is { toString: () => string } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "toString" in obj &&
    typeof (obj as { toString: unknown }).toString === "function"
  );
}

const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "DateTime scalar type support ISO-8601 and Prisma 8 Temporal.Instant",

  serialize(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (hasToString(value)) {
      return value.toString();
    }

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    return null;
  },

  parseValue(value: unknown): Date | null {
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (value instanceof Date) {
      return value;
    }
    return null;
  },

  parseLiteral(ast: ValueNode): Date | null {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      const parsed = new Date(ast.value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  },
});

export { DateTimeScalar };
