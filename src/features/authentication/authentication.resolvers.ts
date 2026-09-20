import { login } from "./authentication.service";

type LoginInput = {
  email: string;
  password: string;
};

const authenticationResolvers = {
  Mutation: {
    login: async (_: unknown, args: { input: LoginInput }) => {
      return await login(args.input);
    },
  },
};

export { authenticationResolvers, LoginInput };

