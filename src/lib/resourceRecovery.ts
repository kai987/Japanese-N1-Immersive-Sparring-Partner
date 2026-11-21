/** Refresh only on the learner's action. The URL already holds their lesson. */
export function reloadWithSearch(query?: string) {
  if (query !== undefined) {
    window.history.replaceState({ ...window.history.state, n1SearchQuery: query }, '')
  }
  window.location.reload()
}

export class ResourceRequestError extends Error {
  readonly status: number
  constructor(label: string, status: number) {
    super(`${label} request failed (${status})`)
    this.name = 'ResourceRequestError'
    this.status = status
  }
}

export const isExpiredResource = (error: unknown) => error instanceof ResourceRequestError && (error.status === 404 || error.status === 410)
