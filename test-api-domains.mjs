const API_KEY = "mk_jqocyTJ1B6EwJlxL5E0k_fp5ZWB7RAbP"
const BASE_URL = "https://moemail-9pm.pages.dev"

const ALL_DOMAINS = [
  "0355650.xyz","mail.0355650.xyz","temp.0355650.xyz","hi.0355650.xyz","me.0355650.xyz",
  "go.0355650.xyz","fun.0355650.xyz","cool.0355650.xyz","fast.0355650.xyz","vip.0355650.xyz",
  "xi-clouds.cn","mail.xi-clouds.cn","temp.xi-clouds.cn","hi.xi-clouds.cn","me.xi-clouds.cn",
  "go.xi-clouds.cn","fun.xi-clouds.cn","cool.xi-clouds.cn","fast.xi-clouds.cn","vip.xi-clouds.cn",
  "xi-clouds.top","mail.xi-clouds.top","temp.xi-clouds.top","hi.xi-clouds.top","me.xi-clouds.top",
  "go.xi-clouds.top","fun.xi-clouds.top","cool.xi-clouds.top","fast.xi-clouds.top","vip.xi-clouds.top",
  "xi-cloud.top","mail.xi-cloud.top","temp.xi-cloud.top","hi.xi-cloud.top","me.xi-cloud.top",
  "go.xi-cloud.top","fun.xi-cloud.top","cool.xi-cloud.top","fast.xi-cloud.top","vip.xi-cloud.top",
  "xi-work.cn","mail.xi-work.cn","temp.xi-work.cn","hi.xi-work.cn","me.xi-work.cn",
  "go.xi-work.cn","fun.xi-work.cn","cool.xi-work.cn","fast.xi-work.cn","vip.xi-work.cn"
]

const success = []
const failed = []

for (const domain of ALL_DOMAINS) {
  try {
    const name = `test${Date.now()}${Math.random().toString(36).slice(2,6)}`
    const res = await fetch(`${BASE_URL}/api/emails/generate`, {
      method: "POST",
      headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ name, domain, expiryTime: 1800000 })
    })
    const data = await res.json()
    if (res.ok) {
      success.push({ domain, email: data.email })
    } else {
      failed.push({ domain, error: data.error })
    }
  } catch (e) {
    failed.push({ domain, error: e.message })
  }
}

console.log(`\n=== API Domain Test Results ===`)
console.log(`Total: ${ALL_DOMAINS.length}, Success: ${success.length}, Failed: ${failed.length}`)

console.log(`\n--- SUCCESS (${success.length}) ---`)
const grouped = {}
for (const s of success) {
  const top = s.domain.split('.').slice(-2).join('.')
  if (!grouped[top]) grouped[top] = []
  grouped[top].push(s.domain)
}
for (const [top, subs] of Object.entries(grouped)) {
  console.log(`\n  ${top}:`)
  subs.forEach(d => console.log(`    ${d}`))
}

if (failed.length > 0) {
  console.log(`\n--- FAILED (${failed.length}) ---`)
  for (const f of failed) {
    console.log(`  ${f.domain}: ${f.error}`)
  }
}
