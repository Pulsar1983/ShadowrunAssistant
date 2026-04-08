type AppConfig = {
  apiBaseUrl: string
}

let appConfig: AppConfig = {
  apiBaseUrl: '',
}

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '')
const buildConfigUrl = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`

const readConfig = async (fileName: string) => {
  const response = await fetch(buildConfigUrl(fileName), { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Config request failed with status ${response.status}`)
  }

  return (await response.json()) as Partial<AppConfig>
}

export const loadAppConfig = async () => {
  let parsedConfig: Partial<AppConfig>

  try {
    parsedConfig = await readConfig('config.local.json')
  } catch {
    parsedConfig = await readConfig('config.json')
  }

  appConfig = {
    apiBaseUrl: normalizeBaseUrl(parsedConfig.apiBaseUrl ?? ''),
  }
}

export const getApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return appConfig.apiBaseUrl
    ? `${appConfig.apiBaseUrl}${normalizedPath}`
    : normalizedPath
}
