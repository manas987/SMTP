import { generateKeyPairSync } from "node:crypto";

export function generateDkimKeys() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,

    publicKeyEncoding: {
      type: "spki",
      format: "der",
    },

    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  const selector = "s1";

  const publicKeyBase64 = publicKey.toString("base64");

  return {
    selector,

    privateKey: privateKey.toString(),

    publicKey: publicKeyBase64,

    dnsValue: `v=DKIM1; k=rsa; p=${publicKeyBase64}`,
  };
}
