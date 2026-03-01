import { customSessionClient, inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { stripeClient } from "@better-auth/stripe/client"

import { auth } from "./auth"
export const authClient = createAuthClient({
   plugins: [inferAdditionalFields<typeof auth>(), stripeClient({
            subscription: true //if you want to enable subscription management
        })],

  //  plugins: [customSessionClient<typeof auth>(),inferAdditionalFields<typeof auth>()],

    /** The base URL of the server (optional if you're using the same domain) */
      baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

    //baseURL: "http://localhost:3000"
  
})


export const { signIn, signUp,useSession } = createAuthClient()
// Now TypeScript knows session.role exists
