import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string
      role: string
      status: string
      isSetupComplete: boolean
      
      // CMU Profile Data
      firstnameTH?: string | null
      lastnameTH?: string | null
      firstnameEN?: string | null
      lastnameEN?: string | null
      organizationCode?: string | null
      organizationName?: string | null
      itAccountType?: string | null
      studentId?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    status: string
    isSetupComplete: boolean

    // CMU Profile Data
    firstnameTH?: string | null
    lastnameTH?: string | null
    firstnameEN?: string | null
    lastnameEN?: string | null
    organizationCode?: string | null
    organizationName?: string | null
    itAccountType?: string | null
    studentId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    status: string
    isSetupComplete: boolean
    image?: string | null

    // CMU Profile Data
    firstnameTH?: string | null
    lastnameTH?: string | null
    firstnameEN?: string | null
    lastnameEN?: string | null
    organizationCode?: string | null
    organizationName?: string | null
    itAccountType?: string | null
    studentId?: string | null
  }
}
