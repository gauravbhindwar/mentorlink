import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                otp: { label: "OTP", type: "text" },
                role: { label: "Role", type: "text" },
            },
            async authorize(credentials, req) {
                try {
                    if (!credentials?.email || !credentials?.otp || !credentials?.role) {
                        throw new Error("Missing credentials");
                    }

                    // Verify OTP and get user info in one step
                    const verifyResponse = await axios.post(
                        `${process.env.NEXTAUTH_URL}/api/auth/verify-otp`,
                        {
                            email: credentials.email,
                            otp: credentials.otp,
                            role: credentials.role,
                        }
                    );

                    if (!verifyResponse.data?.success) {
                        throw new Error(verifyResponse.data?.message || "Authentication failed");
                    }

                    // Return user object with all necessary information
                    return {
                        id: verifyResponse.data.mujid,
                        email: credentials.email,
                        role: credentials.role,
                        mujid: verifyResponse.data.mujid
                    };

                } catch (error) {
                    console.error("Authorize error:", error.message);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.mujid = user.mujid;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.mujid = token.mujid;
                session.user.email = token.email;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error", // You can customize the error page
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET, // Ensure this is properly configured
    debug: process.env.NODE_ENV === "development", // Enable debug logs only in development
};
