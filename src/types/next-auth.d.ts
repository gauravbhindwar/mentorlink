declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            mujid: string;
            email: string;
        };
    }

    interface JWT {
        id: string;
        role: string;
        mujid: string;
        email: string;
    }
}