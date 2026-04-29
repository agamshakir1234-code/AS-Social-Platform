import { useState, useEffect, useCallback } from 'react'

/**
 * Generic data-fetching hook.
 * @param {Function} fetchFn  – service function to call
 * @param {any[]}    deps     – re-fetch when these change
 * @param {any}      params   – optional params forwarded to fetchFn
 */
export function useApi(fetchFn, deps = [], params = undefined) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = params !== undefined ? await fetchFn(params) : await fetchFn()
      setData(res.data ?? res)
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
