import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// node:dns/promises is mocked so the suite never touches a real resolver — the
// tests must be deterministic and runnable on an air-gapped CI runner.
const lookupMock = vi.fn()
vi.mock('node:dns/promises', () => ({
  lookup: (...args: unknown[]) => lookupMock(...args),
}))

const { isBlockedAddress, assertPublicUrl, fetchWithSsrfGuard, SsrfBlockedError } = await import(
  '../ssrf'
)

type LookupResult = { address: string; family: number }
const resolvesTo = (...addresses: string[]) =>
  lookupMock.mockResolvedValue(
    addresses.map<LookupResult>((address) => ({
      address,
      family: address.includes(':') ? 6 : 4,
    }))
  )

beforeEach(() => {
  lookupMock.mockReset()
})

// ---------------------------------------------------------------------------
// isBlockedAddress — the pure range check
// ---------------------------------------------------------------------------

describe('isBlockedAddress — IPv4 private / reserved ranges', () => {
  const blocked = [
    ['0.0.0.0', 'this-host 0.0.0.0/8'],
    ['0.1.2.3', '0.0.0.0/8'],
    ['10.0.0.1', 'RFC1918 10.0.0.0/8 — the homelab k3s range'],
    ['10.0.80.141', 'k3s master-1'],
    ['10.255.255.255', 'top of 10.0.0.0/8'],
    ['127.0.0.1', 'loopback'],
    ['127.255.255.254', 'top of 127.0.0.0/8'],
    ['169.254.169.254', 'cloud instance metadata service'],
    ['169.254.0.1', 'link-local 169.254.0.0/16'],
    ['172.16.0.1', 'bottom of RFC1918 172.16.0.0/12'],
    ['172.31.255.255', 'top of RFC1918 172.16.0.0/12'],
    ['192.168.0.1', 'RFC1918 192.168.0.0/16'],
    ['192.168.255.255', 'top of 192.168.0.0/16'],
    ['192.0.0.1', 'IETF protocol assignments 192.0.0.0/24'],
    ['100.64.0.1', 'CGNAT 100.64.0.0/10'],
    ['100.127.255.255', 'top of CGNAT'],
    ['224.0.0.1', 'multicast'],
    ['239.255.255.250', 'SSDP multicast'],
    ['255.255.255.255', 'broadcast'],
  ] as const

  it.each(blocked)('blocks %s (%s)', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true)
  })

  const allowed = [
    ['1.1.1.1', 'Cloudflare DNS'],
    ['8.8.8.8', 'public'],
    ['9.255.255.255', 'just below 10.0.0.0/8'],
    ['11.0.0.1', 'just above 10.0.0.0/8'],
    ['126.255.255.255', 'just below 127.0.0.0/8'],
    ['128.0.0.1', 'just above 127.0.0.0/8'],
    ['169.253.255.255', 'just below 169.254.0.0/16'],
    ['169.255.0.1', 'just above 169.254.0.0/16'],
    ['172.15.255.255', 'just below 172.16.0.0/12'],
    ['172.32.0.1', 'just above 172.16.0.0/12'],
    ['192.167.255.255', 'just below 192.168.0.0/16'],
    ['192.169.0.1', 'just above 192.168.0.0/16'],
    ['100.63.255.255', 'just below CGNAT'],
    ['100.128.0.1', 'just above CGNAT'],
    ['223.255.255.255', 'just below multicast'],
    ['104.16.0.1', 'Cloudflare edge'],
  ] as const

  it.each(allowed)('allows public %s (%s)', (ip) => {
    expect(isBlockedAddress(ip)).toBe(false)
  })
})

describe('isBlockedAddress — IPv6', () => {
  const blocked = [
    ['::1', 'loopback'],
    ['[::1]', 'loopback as URL.hostname returns it, WITH brackets'],
    ['0:0:0:0:0:0:0:1', 'fully expanded loopback'],
    ['::', 'unspecified'],
    ['[::]', 'unspecified, bracketed'],
    ['fd00::1', 'unique-local fc00::/7'],
    ['[fd00::1]', 'unique-local, bracketed'],
    ['fc00::1', 'bottom of fc00::/7'],
    ['fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', 'top of fc00::/7'],
    ['fe80::1', 'link-local fe80::/10'],
    ['[fe80::1]', 'link-local, bracketed'],
    ['fe80::1%eth0', 'link-local with a zone id'],
    ['febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff', 'top of fe80::/10'],
    ['ff02::1', 'all-nodes multicast'],
    ['ff00::', 'bottom of ff00::/8'],
    ['::ffff:127.0.0.1', 'IPv4-mapped loopback, dotted form'],
    ['::ffff:7f00:1', 'IPv4-mapped loopback, hex form — what URL.hostname produces'],
    ['[::ffff:7f00:1]', 'IPv4-mapped loopback, hex + brackets'],
    ['::ffff:10.0.0.1', 'IPv4-mapped RFC1918, dotted'],
    ['::ffff:a00:1', 'IPv4-mapped 10.0.0.1, hex'],
    ['::ffff:169.254.169.254', 'IPv4-mapped metadata service'],
    ['::ffff:a9fe:a9fe', 'IPv4-mapped metadata service, hex'],
    ['::127.0.0.1', 'deprecated IPv4-compatible loopback'],
    ['64:ff9b::a00:1', 'NAT64 wrapping 10.0.0.1'],
    ['2002:a00:1::', '6to4 wrapping 10.0.0.1'],
    ['2002:7f00:1::', '6to4 wrapping 127.0.0.1'],
    ['100::', 'discard-only 100::/64'],
    ['not-an-address', 'unparseable — blocked defensively'],
    ['', 'empty — blocked defensively'],
    ['fd00::1::2', 'two :: runs, invalid — blocked defensively'],
    ['gggg::1', 'non-hex group — blocked defensively'],
    ['1:2:3:4:5:6:7', 'only 7 groups, invalid — blocked defensively'],
    ['1:2:3:4:5:6:7:8:9', 'nine groups, invalid — blocked defensively'],
    ['::ffff:999.1.1.1', 'invalid embedded octet — blocked defensively'],
  ] as const

  it.each(blocked)('blocks %s (%s)', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true)
  })

  const allowed = [
    ['2606:4700:4700::1111', 'Cloudflare public resolver'],
    ['[2606:4700:4700::1111]', 'Cloudflare, bracketed'],
    ['2001:4860:4860::8888', 'Google public resolver'],
    ['2a00:1450:4009:81f::200e', 'public'],
    ['::ffff:1.1.1.1', 'IPv4-mapped PUBLIC address stays allowed'],
    ['::ffff:101:101', 'IPv4-mapped 1.1.1.1, hex form'],
    ['2002:808:808::', '6to4 wrapping public 8.8.8.8'],
    ['fe00::1', 'fe00::/9 is NOT link-local — must not over-block'],
    ['fbff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', 'just below fc00::/7'],
    ['fec0::1', 'deprecated site-local, above fe80::/10 — not blocked by these rules'],
  ] as const

  it.each(allowed)('allows public %s (%s)', (ip) => {
    expect(isBlockedAddress(ip)).toBe(false)
  })
})

describe('isBlockedAddress — malformed IPv4 is blocked, not silently allowed', () => {
  it.each([['999.1.1.1'], ['256.0.0.1'], ['1.2.3.999']])('blocks %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// assertPublicUrl — protocol gate, literal gate, DNS gate
// ---------------------------------------------------------------------------

describe('assertPublicUrl — protocol', () => {
  it.each([
    ['file:///etc/passwd'],
    ['gopher://10.0.0.1:70/'],
    ['ftp://10.0.0.1/'],
    ['data:text/html,<h1>x</h1>'],
  ])('rejects %s', async (url) => {
    await expect(assertPublicUrl(url)).rejects.toThrow(SsrfBlockedError)
    await expect(assertPublicUrl(url)).rejects.toMatchObject({ reason: 'protocol' })
    expect(lookupMock).not.toHaveBeenCalled()
  })
})

describe('assertPublicUrl — IP literals never reach DNS', () => {
  const hostile = [
    'http://127.0.0.1/',
    'http://127.0.0.1:8080/admin',
    'http://10.0.80.141:6443/',
    'http://169.254.169.254/latest/meta-data/',
    'http://192.168.1.1/',
    'http://172.20.0.1/',
    // WHATWG URL normalises all of these to 127.0.0.1 before we see them.
    'http://2130706433/',
    'http://0x7f.1/',
    'http://127.1/',
    'http://0177.0.0.1/',
    // IPv6 literals — URL.hostname hands these back WITH brackets.
    'http://[::1]/',
    'http://[::1]:8080/',
    'http://[fd00::1]/',
    'http://[fe80::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[::ffff:10.0.0.1]/',
    'http://[::]/',
    'https://[64:ff9b::a00:1]/',
  ]

  it.each(hostile)('blocks %s as literal-ip', async (url) => {
    await expect(assertPublicUrl(url)).rejects.toMatchObject({ reason: 'literal-ip' })
    expect(lookupMock).not.toHaveBeenCalled()
  })

  it.each(['http://1.1.1.1/', 'https://[2606:4700:4700::1111]/'])(
    'allows public literal %s',
    async (url) => {
      await expect(assertPublicUrl(url)).resolves.toBeInstanceOf(URL)
      expect(lookupMock).not.toHaveBeenCalled()
    }
  )
})

describe('assertPublicUrl — DNS results', () => {
  it('allows a hostname that resolves only to public addresses', async () => {
    resolvesTo('104.16.0.1', '2606:4700::1')
    await expect(assertPublicUrl('https://example.com/page')).resolves.toBeInstanceOf(URL)
    expect(lookupMock).toHaveBeenCalledWith('example.com', { all: true, verbatim: true })
  })

  it('blocks a hostname that resolves to a private address (DNS-rebind style)', async () => {
    resolvesTo('10.0.80.141')
    await expect(assertPublicUrl('https://internal.attacker.test/')).rejects.toMatchObject({
      reason: 'private-dns',
    })
  })

  it('blocks the classic 169.254.169.254 rebind host', async () => {
    resolvesTo('169.254.169.254')
    await expect(assertPublicUrl('https://metadata.attacker.test/')).rejects.toMatchObject({
      reason: 'private-dns',
    })
  })

  it('blocks when ANY resolved address is private, even if others are public', async () => {
    // Multi-A rebinding: one public record to pass a naive first-record check,
    // one private record that the fetch may actually connect to.
    resolvesTo('104.16.0.1', '10.0.0.5')
    await expect(assertPublicUrl('https://mixed.attacker.test/')).rejects.toMatchObject({
      reason: 'private-dns',
    })
  })

  it('blocks when a private address is returned via AAAA only', async () => {
    resolvesTo('104.16.0.1', 'fd00::1')
    await expect(assertPublicUrl('https://mixed6.attacker.test/')).rejects.toMatchObject({
      reason: 'private-dns',
    })
  })

  it('blocks localhost (resolver returns loopback)', async () => {
    resolvesTo('127.0.0.1', '::1')
    await expect(assertPublicUrl('http://localhost:3000/')).rejects.toMatchObject({
      reason: 'private-dns',
    })
  })

  it('blocks in-cluster service names that resolve internally', async () => {
    resolvesTo('10.43.0.1')
    await expect(
      assertPublicUrl('http://supabase-kong.supabase.svc.cluster.local:8000/')
    ).rejects.toMatchObject({ reason: 'private-dns' })
  })

  it('blocks on resolver failure rather than falling through', async () => {
    lookupMock.mockRejectedValue(new Error('ENOTFOUND'))
    await expect(assertPublicUrl('https://nx.attacker.test/')).rejects.toMatchObject({
      reason: 'dns-failure',
    })
  })

  it('blocks on an empty resolver answer', async () => {
    lookupMock.mockResolvedValue([])
    await expect(assertPublicUrl('https://empty.attacker.test/')).rejects.toMatchObject({
      reason: 'no-dns',
    })
  })
})

// ---------------------------------------------------------------------------
// fetchWithSsrfGuard — redirect revalidation
// ---------------------------------------------------------------------------

function redirectTo(location: string, status = 302): Response {
  return new Response(null, { status, headers: { location } })
}

describe('fetchWithSsrfGuard — every redirect hop is revalidated', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    resolvesTo('104.16.0.1')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a non-redirect response and never follows automatically', async () => {
    fetchMock.mockResolvedValue(new Response('<html/>', { status: 200 }))
    const res = await fetchWithSsrfGuard('https://example.com/')
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' })
  })

  it('blocks a public URL that 302s to an IPv4 private address', async () => {
    fetchMock.mockResolvedValueOnce(redirectTo('http://10.0.80.141:6443/'))
    await expect(fetchWithSsrfGuard('https://example.com/')).rejects.toMatchObject({
      reason: 'literal-ip',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('blocks a public URL that 302s to the metadata service', async () => {
    fetchMock.mockResolvedValueOnce(redirectTo('http://169.254.169.254/latest/meta-data/'))
    await expect(fetchWithSsrfGuard('https://example.com/')).rejects.toMatchObject({
      reason: 'literal-ip',
    })
  })

  it('blocks a public URL that 302s to an IPv6 loopback literal', async () => {
    fetchMock.mockResolvedValueOnce(redirectTo('http://[::1]:3000/api/health'))
    await expect(fetchWithSsrfGuard('https://example.com/')).rejects.toMatchObject({
      reason: 'literal-ip',
    })
  })

  it('blocks a redirect to a non-http protocol', async () => {
    fetchMock.mockResolvedValueOnce(redirectTo('file:///etc/passwd'))
    await expect(fetchWithSsrfGuard('https://example.com/')).rejects.toMatchObject({
      reason: 'protocol',
    })
  })

  it('blocks a private target reached only on the SECOND hop', async () => {
    fetchMock
      .mockResolvedValueOnce(redirectTo('https://hop2.example.com/'))
      .mockResolvedValueOnce(redirectTo('http://192.168.1.1/'))
    await expect(fetchWithSsrfGuard('https://example.com/')).rejects.toMatchObject({
      reason: 'literal-ip',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('resolves relative Location headers against the current hop', async () => {
    fetchMock
      .mockResolvedValueOnce(redirectTo('/final'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
    const res = await fetchWithSsrfGuard('https://example.com/start')
    expect(res.status).toBe(200)
    expect(fetchMock.mock.calls[1][0]).toBe('https://example.com/final')
  })

  it('re-runs the DNS check on each hop, not just the first', async () => {
    lookupMock
      .mockResolvedValueOnce([{ address: '104.16.0.1', family: 4 }])
      .mockResolvedValueOnce([{ address: '10.0.0.7', family: 4 }])
    fetchMock.mockResolvedValueOnce(redirectTo('https://rebound.attacker.test/'))
    await expect(fetchWithSsrfGuard('https://example.com/')).rejects.toMatchObject({
      reason: 'private-dns',
    })
    expect(lookupMock).toHaveBeenCalledTimes(2)
  })

  it('caps the redirect chain', async () => {
    fetchMock.mockResolvedValue(redirectTo('https://example.com/loop'))
    await expect(
      fetchWithSsrfGuard('https://example.com/', { maxRedirects: 2 })
    ).rejects.toMatchObject({ reason: 'too-many-redirects' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('returns the 3xx as-is when there is no Location header', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 302 }))
    const res = await fetchWithSsrfGuard('https://example.com/')
    expect(res.status).toBe(302)
  })

  it('forwards signal and headers to the underlying fetch', async () => {
    fetchMock.mockResolvedValue(new Response('ok', { status: 200 }))
    const controller = new AbortController()
    await fetchWithSsrfGuard('https://example.com/', {
      signal: controller.signal,
      headers: { 'User-Agent': 'ChatArk-LinkPreview/1.0' },
    })
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      signal: controller.signal,
      headers: { 'User-Agent': 'ChatArk-LinkPreview/1.0' },
    })
  })
})
