import bcrypt from "bcrypt";
import { Temporal } from "temporal-polyfill";
import {db} from '../../prisma/db'
import { CreateUserInput, LoginInput } from "./authentication.resolvers";
import { SignJWT } from "jose";
import { JWT_TOKEN } from "../..";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS!);

type AccessTokenPayload = {
    name: string,
    email: string,
    role: string,
    subsidiaryId: number,
    organizationId: number
}

type LoginResponse = {
    accessToken: string,
    refreshToken: string
} | null

async function hashPassword(plainPass: string): Promise<string> {
  return await bcrypt.hash(plainPass, SALT_ROUNDS);
}

async function verifyPassword(plainPass: string, hashedPass: string,
): Promise<boolean> {
  return await bcrypt.compare(plainPass, hashedPass);
}

async function generateAccessToken(payload: AccessTokenPayload){
    return new SignJWT({
        role: payload.role,
        subsidiaryId: payload.subsidiaryId,
        fullName: payload.name,
        organizationId: payload.organizationId
    }).setProtectedHeader({
        alg: "HS256", typ: "JWT"
    }).setSubject(payload.email)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(JWT_TOKEN)
}

async function generateRefreshToken(email: string) {
  return await new SignJWT()
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_TOKEN);
}


async function createUser(input: CreateUserInput){
    let {fullName, email, password} = input

    const encryptPass: string = await hashPassword(password)
    return await db.orm.public.Users.create({
        email: email,
        fullName: fullName,
        passwordHash: encryptPass,
        createdAt: Temporal.Now.instant(),
        subsidiaryId: 1,
        role: "MEMBER",
        status: "ACTIVE",
    })
}

async function login(input: LoginInput): Promise<LoginResponse>{
    let {email, password} = input;
    const user = await db.orm.public.Users
        .select("email", "status", "passwordHash", "role", "subsidiaryId", "fullName")
        .where(
            (user) => user.email.eq(email)
        )
        .include("subsidiary", (sub) => sub.select("organizationId"))
        .first()
    
    if(user === undefined || user?.status !== "ACTIVE"){
        return null
    }

    let validPassword = await verifyPassword(password, user.passwordHash)
    if(!validPassword){
        return null
    }

    
    let accessToken = await generateAccessToken({
        email: user.email,
        role: user.role,
        name: user.fullName,
        subsidiaryId: user.subsidiaryId,
        organizationId: user.organizationId
    })

    let refreshToken = await generateRefreshToken(user.email)

    return {accessToken, refreshToken}
    
}

export {createUser, login};
