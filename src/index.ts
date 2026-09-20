import { ApolloServer } from "@apollo/server";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import { startStandaloneServer } from "@apollo/server/standalone";
import {db} from "./prisma/db"
import { jwtVerify } from "jose";
import { UserToken } from "./features/user/user.resolver";

const PORT: number = Number(process.env.PORT!)
export const JWT_TOKEN = new TextEncoder().encode(
    process.env.JWT_KEY!
)
export interface GraphQLContext{
  token?: string | null;
  user?:UserToken | null;
}

try {
  await db.connect({
    url: process.env.DB_URL!
  });
  console.log("Database connected successfully!");
} catch (error) {
  console.error("Failed to connect to database:", error);
  process.exit(1);
}

const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers
})

const showUser = (user: {
  email: string,
  fullName: string,
  role: string,
  subsidiaryId: number
}) => {
  console.log(user ?? {})
}

const {url} = await startStandaloneServer(server, {
    listen: {
        port: PORT
    },
    context: async ({req}) : Promise<GraphQLContext> => {
      const authHeader = req.headers.authorization || ""
      const token = authHeader.startsWith("Bearer ")? authHeader.substring(7) : authHeader
      let user: UserToken;
      if(token){
        try{
          const {payload} = await jwtVerify(token, JWT_TOKEN)
          user = {
            email: payload.sub as string,
            fullName: payload.fullName as string,
            role: payload.role as string,
            subsidiaryId: payload.subsidiaryId as number,
            organizationId: payload.organizationId as number
          }
          showUser(user)
          return {
            token,
            user
          }
        }catch(err){
          console.warn("Invalid or expired token")
          return{
            token: null,
            user: null
          }
        }
      }
      return {
        token: null, user: null
      }
    }
})

console.log(`Server ready at ${url}`)