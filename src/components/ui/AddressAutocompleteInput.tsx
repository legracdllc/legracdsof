import { useEffect, useRef, useState } from 'react'
import { Input } from './Input'

type AddressSuggestion = {
  placeId: string
  description: string
}

const GEOAPIFY_API_KEY = (import.meta.env.VITE_GEOAPIFY_API_KEY ?? '').trim()
const GOOGLE_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim()
const GOOGLE_COUNTRY = (import.meta.env.VITE_GOOGLE_MAPS_COUNTRY ?? 'us').trim().toLowerCase()
type Provider = 'geoapify' | 'google' | 'fallback'
const HOUSTON_BIAS = { lat: 29.7604, lon: -95.3698 }
const TEXAS_VIEWBOX = '-106.65,36.5,-93.51,25.84' // left,top,right,bottom

declare global {
  interface Window {
    __legraGoogleMapsPromise?: Promise<void>
    google?: any
  }
}

function loadGoogleMapsPlaces(): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve()
  if (!GOOGLE_API_KEY) return Promise.reject(new Error('MISSING_GOOGLE_MAPS_KEY'))
  if (window.__legraGoogleMapsPromise) return window.__legraGoogleMapsPromise

  window.__legraGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_API_KEY)}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.maps?.places) resolve()
      else reject(new Error('GOOGLE_MAPS_PLACES_NOT_AVAILABLE'))
    }
    script.onerror = () => reject(new Error('GOOGLE_MAPS_SCRIPT_LOAD_FAILED'))
    document.head.appendChild(script)
  })

  return window.__legraGoogleMapsPromise
}

export function AddressAutocompleteInput({
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete = 'off',
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  disabled?: boolean
  autoComplete?: string
}) {
  const initialProvider: Provider = GOOGLE_API_KEY
    ? 'google'
    : GEOAPIFY_API_KEY
      ? 'geoapify'
      : 'fallback'
  const [provider, setProvider] = useState<Provider>(initialProvider)
  const [ready, setReady] = useState(initialProvider !== 'google')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])

  const rootRef = useRef<HTMLDivElement | null>(null)
  const serviceRef = useRef<any>(null)
  const debounceRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let active = true
    if (provider !== 'google') {
      setReady(true)
      return
    }
    if (!GOOGLE_API_KEY) {
      setProvider('fallback')
      setReady(true)
      return
    }

    loadGoogleMapsPlaces()
      .then(() => {
        if (!active) return
        serviceRef.current = new window.google.maps.places.AutocompleteService()
        setProvider('google')
        setReady(true)
      })
      .catch(() => {
        if (!active) return
        // Fallback mode so autocomplete still works if Google key/script fails.
        setProvider('fallback')
        setReady(true)
      })

    return () => {
      active = false
    }
  }, [provider])

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  function normalize(desc: string) {
    return desc.trim().toLowerCase()
  }

  function mergeSuggestions(...groups: AddressSuggestion[][]): AddressSuggestion[] {
    const out: AddressSuggestion[] = []
    const seen = new Set<string>()
    for (const g of groups) {
      for (const s of g) {
        const k = normalize(s.description)
        if (!k || seen.has(k)) continue
        seen.add(k)
        out.push(s)
        if (out.length >= 6) return out
      }
    }
    return out
  }

  async function requestGeoapify(q: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
    if (!GEOAPIFY_API_KEY) return []
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete')
    url.searchParams.set('text', q)
    url.searchParams.set('limit', '6')
    url.searchParams.set('format', 'json')
    if (GOOGLE_COUNTRY) {
      url.searchParams.set('filter', `countrycode:${GOOGLE_COUNTRY}`)
      url.searchParams.set('bias', `countrycode:${GOOGLE_COUNTRY}`)
    }
    url.searchParams.set('apiKey', GEOAPIFY_API_KEY)

    const res = await fetch(url.toString(), {
      method: 'GET',
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return []
    const json = (await res.json()) as {
      features?: Array<{
        properties?: {
          place_id?: string
          formatted?: string
          address_line1?: string
          address_line2?: string
          city?: string
          state?: string
          postcode?: string
          country?: string
        }
      }>
    }

    const features = json.features ?? []
    return features
      .slice(0, 6)
      .map((f, idx) => {
        const p = f.properties ?? {}
        const formatted = (p.formatted ?? '').trim()
        if (formatted) {
          return {
            placeId: `geo_${String(p.place_id ?? `${idx}`)}`,
            description: formatted,
          }
        }
        const parts = [p.address_line1, p.address_line2, p.city, p.state, p.postcode, p.country]
          .map((x) => (x ?? '').trim())
          .filter(Boolean)
        return {
          placeId: `geo_${String(p.place_id ?? `${idx}`)}`,
          description: parts.join(', '),
        }
      })
      .filter((x) => x.description.trim().length > 0)
  }

  async function requestNominatim(q: string, withCountry: boolean, signal: AbortSignal): Promise<AddressSuggestion[]> {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '6')
    if (withCountry && GOOGLE_COUNTRY) url.searchParams.set('countrycodes', GOOGLE_COUNTRY)
    // Bias to Texas for LC&D workflows while still allowing out-of-state addresses.
    url.searchParams.set('viewbox', TEXAS_VIEWBOX)
    url.searchParams.set('q', q)

    const res = await fetch(url.toString(), {
      method: 'GET',
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return []
    const json = (await res.json()) as Array<{ place_id?: number | string; display_name?: string }>
    return (json ?? [])
      .slice(0, 6)
      .map((p, idx) => ({
        placeId: `nom_${String(p.place_id ?? `${idx}`)}`,
        description: p.display_name ?? '',
      }))
      .filter((x) => x.description.trim().length > 0)
  }

  async function requestPhoton(q: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
    const url = new URL('https://photon.komoot.io/api/')
    url.searchParams.set('q', q)
    url.searchParams.set('limit', '6')
    url.searchParams.set('lat', String(HOUSTON_BIAS.lat))
    url.searchParams.set('lon', String(HOUSTON_BIAS.lon))

    const res = await fetch(url.toString(), {
      method: 'GET',
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return []
    const json = (await res.json()) as {
      features?: Array<{
        properties?: {
          osm_id?: string | number
          name?: string
          street?: string
          city?: string
          state?: string
          postcode?: string
          country?: string
          countrycode?: string
        }
      }>
    }

    const features = json.features ?? []
    return features
      .slice(0, 6)
      .map((f, idx) => {
        const p = f.properties ?? {}
        const parts = [p.name, p.street, p.city, p.state, p.postcode, p.country]
          .map((x) => (x ?? '').trim())
          .filter(Boolean)
        return {
          placeId: `pho_${String(p.osm_id ?? `${idx}`)}`,
          description: parts.join(', '),
        }
      })
      .filter((x) => x.description.trim().length > 0)
  }

  async function requestUsCensus(q: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
    if (GOOGLE_COUNTRY && GOOGLE_COUNTRY !== 'us') return []
    const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress')
    url.searchParams.set('address', q)
    url.searchParams.set('benchmark', 'Public_AR_Current')
    url.searchParams.set('format', 'json')

    const res = await fetch(url.toString(), {
      method: 'GET',
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return []
    const json = (await res.json()) as {
      result?: { addressMatches?: Array<{ matchedAddress?: string }> }
    }
    const matches = json.result?.addressMatches ?? []
    return matches
      .slice(0, 6)
      .map((m, idx) => ({
        placeId: `cen_${idx}`,
        description: (m.matchedAddress ?? '').trim(),
      }))
      .filter((x) => x.description.length > 0)
  }

  function scoreSuggestion(query: string, description: string) {
    const q = normalize(query)
    const d = normalize(description)
    if (!d) return -1
    let score = 0

    if (d.startsWith(q)) score += 12
    if (d.includes(q)) score += 8
    for (const token of q.split(/\s+/).filter((t) => t.length > 1)) {
      if (d.includes(token)) score += 2
    }

    if (d.includes(' tx') || d.includes(' texas')) score += 3
    if (d.includes(' houston') || d.includes(' katy') || d.includes(' eagle lake')) score += 2

    return score
  }

  function rankSuggestions(query: string, items: AddressSuggestion[]) {
    return [...items]
      .map((s) => ({ s, score: scoreSuggestion(query, s.description) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.s)
  }

  async function requestSuggestionsFallback(q: string, reqId: number) {
    try {
      if (abortRef.current) abortRef.current.abort()
      const ac = new AbortController()
      abortRef.current = ac
      const qWithTx =
        GOOGLE_COUNTRY === 'us' && !/\btx\b|\btexas\b/i.test(q) ? `${q}, Texas` : q

      const [censusRes, nomUsRes, photonRes] = await Promise.allSettled([
        requestUsCensus(qWithTx, ac.signal),
        requestNominatim(qWithTx, true, ac.signal),
        requestPhoton(qWithTx, ac.signal),
      ])
      const census = censusRes.status === 'fulfilled' ? censusRes.value : []
      const nomUs = nomUsRes.status === 'fulfilled' ? nomUsRes.value : []
      const photon = photonRes.status === 'fulfilled' ? photonRes.value : []

      let merged = mergeSuggestions(census, nomUs, photon)
      // If sparse results, retry without country restriction.
      if (merged.length < 3) {
        let nomGlobal: AddressSuggestion[] = []
        try {
          nomGlobal = await requestNominatim(qWithTx, false, ac.signal)
        } catch {
          nomGlobal = []
        }
        merged = mergeSuggestions(census, nomUs, photon, nomGlobal)
      }

      if (reqId !== requestIdRef.current) return
      setSuggestions(rankSuggestions(q, merged))
    } catch {
      if (reqId !== requestIdRef.current) return
      setSuggestions([])
    } finally {
      if (reqId === requestIdRef.current) setLoading(false)
    }
  }

  function requestSuggestionsGoogle(q: string, reqId: number) {
    if (!serviceRef.current) {
      setLoading(false)
      setSuggestions([])
      return
    }

    serviceRef.current.getPlacePredictions(
      {
        input: q,
        types: ['address'],
        componentRestrictions: GOOGLE_COUNTRY ? { country: GOOGLE_COUNTRY } : undefined,
      },
      (predictions: any[] | null, status: string) => {
        if (reqId !== requestIdRef.current) return
        const okStatus = window.google?.maps?.places?.PlacesServiceStatus?.OK
        if (status !== okStatus) {
          setProvider('fallback')
          requestSuggestionsFallback(q, reqId)
          return
        }
        setLoading(false)
        if (!predictions?.length) {
          setSuggestions([])
          return
        }
        setSuggestions(
          predictions.slice(0, 6).map((p) => ({
            placeId: p.place_id,
            description: p.description,
          })),
        )
      },
    )
  }

  function requestSuggestions(input: string) {
    const q = input.trim()
    if (!ready || q.length < 3) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const reqId = ++requestIdRef.current
    setLoading(true)

    if (provider === 'geoapify') {
      if (abortRef.current) abortRef.current.abort()
      const ac = new AbortController()
      abortRef.current = ac

      requestGeoapify(q, ac.signal)
        .then((geo) => {
          if (reqId !== requestIdRef.current) return
          if (geo.length) {
            setSuggestions(geo)
            setLoading(false)
            return
          }
          if (GOOGLE_API_KEY && serviceRef.current) {
            setProvider('google')
            requestSuggestionsGoogle(q, reqId)
            return
          }
          setProvider('fallback')
          requestSuggestionsFallback(q, reqId)
        })
        .catch(() => {
          if (reqId !== requestIdRef.current) return
          if (GOOGLE_API_KEY && serviceRef.current) {
            setProvider('google')
            requestSuggestionsGoogle(q, reqId)
            return
          }
          setProvider('fallback')
          requestSuggestionsFallback(q, reqId)
        })
      return
    }

    if (provider === 'google') {
      requestSuggestionsGoogle(q, reqId)
      return
    }

    requestSuggestionsFallback(q, reqId)
  }

  return (
    <div className="addrAuto" ref={rootRef}>
      <Input
        value={value ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        onFocus={() => {
          if ((value ?? '').trim().length >= 3 && ready) {
            requestSuggestions(value)
            setOpen(true)
          }
        }}
        onChange={(e) => {
          const next = e.target.value
          onChange(next)
          setOpen(true)
          if (debounceRef.current) window.clearTimeout(debounceRef.current)
          debounceRef.current = window.setTimeout(() => requestSuggestions(next), 180)
        }}
      />

      {open && ready ? (
        <div className="addrAutoMenu">
          {loading ? <div className="addrAutoInfo">Searching addresses...</div> : null}
          {!loading && suggestions.length === 0 ? (
            <div className="addrAutoInfo">No address matches. Keep typing more details.</div>
          ) : null}
          {!loading && !GOOGLE_API_KEY ? (
            <div className="addrAutoInfo">Google is not configured. Using free fallback provider.</div>
          ) : null}
          {!loading
            ? suggestions.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  className="addrAutoItem"
                  onClick={() => {
                    onChange(s.description)
                    setOpen(false)
                    setSuggestions([])
                  }}
                >
                  {s.description}
                </button>
              ))
            : null}
          {provider === 'google' ? <div className="addrAutoAttribution">Powered by Google</div> : null}
        </div>
      ) : null}

    </div>
  )
}
