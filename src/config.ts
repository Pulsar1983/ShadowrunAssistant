type AppConfig = {
  apiBaseUrl: string
}

let appConfig: AppConfig = {
  apiBaseUrl: '',
}

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '')

export const loadAppConfig = async () => {
  const configUrl = `${import.meta.env.BASE_URL}config.json`
  const response = await fetch(configUrl, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Config request failed with status ${response.status}`)
  }

  const parsedConfig = (await response.json()) as Partial<AppConfig>

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
