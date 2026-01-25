const KEY_SIZE = 256

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const e = async (plain: string | object) => {
  const plainText = typeof plain === "string" ? plain : JSON.stringify(plain)
  const saltBytes = window.crypto.getRandomValues(new Uint8Array(16))
  const ivBytes = window.crypto.getRandomValues(new Uint8Array(16))
  const passwordKey = await makePasswordKey(k)
  const aesKey = await deriveKey(passwordKey, saltBytes, ["encrypt"])
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    aesKey,
    encoder.encode(plainText)
  )
  const encryptedBytes = new Uint8Array(encryptedContent)
  const buffer = new Uint8Array(
    saltBytes.byteLength + ivBytes.byteLength + encryptedBytes.byteLength
  )
  buffer.set(saltBytes, 0)
  buffer.set(ivBytes, saltBytes.byteLength)
  buffer.set(encryptedBytes, saltBytes.byteLength + ivBytes.byteLength)
  return bufferToBase64(buffer)
}

export const d = async (cipherText: string) => {
  const cipherBytes = base64ToBuffer(cipherText)
  const saltBytes = cipherBytes.slice(0, 16)
  const ivBytes = cipherBytes.slice(16, 32)
  const encryptedBytes = cipherBytes.slice(32)
  const passwordKey = await makePasswordKey(k)
  const aesKey = await deriveKey(passwordKey, saltBytes, ["decrypt"])
  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    aesKey,
    encryptedBytes
  )
  return decoder.decode(decryptedContent)
}

const bufferToBase64 = (buffer: Uint8Array) =>
  window.btoa(
    Array.from(buffer)
      .map((b) => String.fromCharCode(b))
      .join("")
  )

const base64ToBuffer = (b64: string) =>
  Uint8Array.from(window.atob(b64), (c) => c.charCodeAt(0))

const makePasswordKey = (password: string) =>
  window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveKey",
  ])

const deriveKey = (passwordKey: CryptoKey, salt: Uint8Array, keyUsages: KeyUsage[]) =>
  window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 179,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: KEY_SIZE },
    false,
    keyUsages
  )

export const k = String.fromCharCode(
  ...new Uint8Array(
    [
      "55",
      "6e",
      "21",
      "44",
      "30",
      "63",
      "40",
      "45",
      "4d",
      "52",
      "23",
      "32",
      "30",
      "32",
      "34",
      "24",
      "53",
      "65",
      "63",
      "75",
      "72",
      "33",
      "2a",
      "4b",
      "33",
      "79",
      "26",
      "45",
      "6e",
      "63",
      "72",
      "79",
      "70",
      "2b",
    ].map((it) => parseInt(it, parseInt("10000", 2)))
  )
)
