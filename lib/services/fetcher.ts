import { BACKEND_API_URL, BASE_PATH } from "@/lib/utils/constants"
import { d, e } from "@/lib/utils/crypto"
import { getToken } from "@/lib/utils/token"
import ky, { HTTPError } from "ky"
import { getFingerprint } from "@/lib/services/fingerprint"
import { toast } from "@/hooks/use-toast"

interface FetcherProps {
  path: string
  shouldEncrypt?: boolean
  shouldDecrypt?: boolean
  responseType?: 'json' | 'blob'
}

interface JsonResult {
  message: string
}

export const fetcher = async (
  {
    path,
    shouldEncrypt = true,
    shouldDecrypt = true,
    responseType = 'json',
  }: FetcherProps,
  kyOptions?: Parameters<typeof ky>[1]
) => {
  console.log(path)
  console.log("___________________________________")
  
  const isFormData = kyOptions?.body instanceof FormData

  if (isFormData && shouldEncrypt) {
    const formData = kyOptions.body as FormData
    const dataValue = formData.get('data')
    
    if (dataValue && typeof dataValue === 'string') {
      try {
        const jsonData = JSON.parse(dataValue)
        const encryptedData = await e(jsonData)
        formData.set('data', encryptedData)
        console.log("API " + path + " FormData (data encrypted):")
      } catch (err) {
        console.error("Failed to encrypt FormData data:", err)
      }
    }
    
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(pair[0], `File: ${pair[1].name} (${pair[1].size} bytes)`)
      } else {
        console.log(pair[0], pair[0] === 'data' ? '[encrypted]' : pair[1])
      }
    }
  } else if (!isFormData) {
    console.log("API " + path + " Req Body ", kyOptions?.json)
  }

  if (shouldEncrypt && kyOptions?.json && !isFormData) {
    kyOptions.json = {
      data: await e(kyOptions.json as object),
    }
  }

  if (responseType === 'blob') {
    try {
      const response = await ky(BACKEND_API_URL + path, {
        method: kyOptions?.method ?? "POST",
        headers: {
          ...kyOptions?.headers,
          Authorization: `Bearer ${getToken()}`,
          fp: getFingerprint(),
        },
        timeout: 30000,
        ...kyOptions,
      })
      return await response.blob()
    } catch (err) {
      if (kyOptions?.signal?.aborted) {
        return null
      }
      if (err instanceof HTTPError) {
        const { response } = err
        if (response.status === 401) {
          localStorage.clear()
          sessionStorage.clear()
          window.open(`${BASE_PATH}/sign-in`, "_self")
          return null
        }
      }
      toast({ title: "Error", description: "Failed to download file", variant: "destructive" })
      return null
    }
  }

  let json: JsonResult | undefined
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${getToken()}`,
      fp: getFingerprint(),
    }

    if (!isFormData && kyOptions?.headers) {
      Object.assign(headers, kyOptions.headers)
    }

    json = await ky(BACKEND_API_URL + path, {
      method: kyOptions?.method ?? "POST",
      headers,
      timeout: isFormData ? 120000 : 30000,
      ...kyOptions,
    }).json<JsonResult>()
  } catch (err) {
    if (kyOptions?.signal?.aborted) {
      return null
    }
    if (err instanceof HTTPError) {
      const { response } = err
      if (response.status === 401) {
        localStorage.clear()
        sessionStorage.clear()
        window.open(`${BASE_PATH}/sign-in`, "_self")
        return null
      } else if (response.status >= 400 && response.status < 500) {
        const errResponse = await response.json()
        console.log(path)
        console.log("___________________________________")
        console.log("API " + path + " Response Body ", errResponse)
        return errResponse
      } else {
        return {}
      }
    } else if (err instanceof TypeError && err.message === "Failed to fetch") {
      toast({
        title: "Error",
        description: "Could not connect to server. Please check your internet connection.",
        variant: "destructive",
      })
      return {}
    }
  }
  
  if (!shouldDecrypt) {
    console.log(path)
    console.log("___________________________________")
    console.log("API " + path + " Response Body (no decryption) ", json)
    return json
  }

  const encJsonString = json?.message
  const decJsonString = await d(encJsonString!)
  const decJson = JSON.parse(decJsonString)
  console.log(path)
  console.log("___________________________________")
  console.log("API " + path + " Response Body ", decJson)
  return decJson
}
