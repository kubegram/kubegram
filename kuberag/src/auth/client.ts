import { createClient } from "@openauthjs/openauth/client";
import * as v from "valibot";
import { authConfig } from "../config";

// Subjects schema matching kubegram-server's issuer
export const subjects = {
  user: v.object({
    id: v.string(),
    provider: v.string(),
  }),
};

// OpenAuth client for verifying tokens issued by kubegram-server
export const openauthClient = createClient({
  clientID: "kuberag",
  issuer: authConfig.issuerUrl,
});
