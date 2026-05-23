// Simulate the exact pick() logic from create-dialog.tsx
// to verify that Math.random() returns different values

const EMAIL_DOMAINS = "0355650.xyz,mail.0355650.xyz,temp.0355650.xyz,hi.0355650.xyz,me.0355650.xyz,go.0355650.xyz,fun.0355650.xyz,cool.0355650.xyz,fast.0355650.xyz,vip.0355650.xyz,xi-clouds.cn,mail.xi-clouds.cn,temp.xi-clouds.cn,hi.xi-clouds.cn,me.xi-clouds.cn,go.xi-clouds.cn,fun.xi-clouds.cn,cool.xi-clouds.cn,fast.xi-clouds.cn,vip.xi-clouds.cn,xi-clouds.top,mail.xi-clouds.top,temp.xi-clouds.top,hi.xi-clouds.top,me.xi-clouds.top,go.xi-clouds.top,fun.xi-clouds.top,cool.xi-clouds.top,fast.xi-clouds.top,vip.xi-clouds.top,xi-cloud.top,mail.xi-cloud.top,temp.xi-cloud.top,hi.xi-cloud.top,me.xi-cloud.top,go.xi-cloud.top,fun.xi-cloud.top,cool.xi-cloud.top,fast.xi-cloud.top,vip.xi-cloud.top,xi-work.cn,mail.xi-work.cn,temp.xi-work.cn,hi.xi-work.cn,me.xi-work.cn,go.xi-work.cn,fun.xi-work.cn,cool.xi-work.cn,fast.xi-work.cn,vip.xi-work.cn"

// Build domain map (same logic as use-config.ts)
const domainsArray = EMAIL_DOMAINS.split(',')
const domainMap = {}
for (const d of domainsArray) {
  const parts = d.split('.')
  let topLevel
  if (parts.length >= 3) {
    topLevel = parts.slice(1).join('.')
  } else {
    topLevel = d
  }
  if (!domainMap[topLevel]) {
    domainMap[topLevel] = [topLevel]
  }
  if (d !== topLevel) {
    domainMap[topLevel].push(d)
  }
}

const topLevelDomains = Object.keys(domainMap).sort()

console.log("=== Top Level Domains ===")
console.log(topLevelDomains)
console.log("\n=== Domain Map ===")
for (const [key, subs] of Object.entries(domainMap)) {
  console.log(`  ${key} (${subs.length} subdomains): ${subs.join(', ')}`)
}

// Test 1: pick(RANDOM_KEY) called 20 times
console.log("\n=== Test 1: pick(RANDOM_KEY) x 20 ===")
const RANDOM_KEY = "__random__"
function pick(key) {
  if (key === RANDOM_KEY) {
    const top = topLevelDomains[Math.floor(Math.random() * topLevelDomains.length)]
    const subs = domainMap[top] ?? [top]
    return subs[Math.floor(Math.random() * subs.length)]
  }
  const subs = domainMap[key] ?? [key]
  return subs[Math.floor(Math.random() * subs.length)]
}

const results1 = []
for (let i = 0; i < 20; i++) {
  results1.push(pick(RANDOM_KEY))
}
console.log(`  Results: ${results1.join(', ')}`)
const unique1 = [...new Set(results1)]
console.log(`  Unique: ${unique1.length} out of 20 (${unique1.join(', ')})`)

// Test 2: pick("xi-clouds.cn") called 20 times
console.log("\n=== Test 2: pick('xi-clouds.cn') x 20 ===")
const results2 = []
for (let i = 0; i < 20; i++) {
  results2.push(pick("xi-clouds.cn"))
}
console.log(`  Results: ${results2.join(', ')}`)
const unique2 = [...new Set(results2)]
console.log(`  Unique: ${unique2.length} out of 20 (${unique2.join(', ')})`)

// Test 3: Consecutive same-result probability
console.log("\n=== Test 3: Consecutive same-result check ===")
let lastResult = null
let sameCount = 0
let maxSameCount = 0
for (let i = 0; i < 100; i++) {
  const r = pick("xi-clouds.cn")
  if (r === lastResult) {
    sameCount++
    maxSameCount = Math.max(maxSameCount, sameCount)
  } else {
    sameCount = 0
  }
  lastResult = r
}
console.log(`  Max consecutive same results for xi-clouds.cn: ${maxSameCount}`)

// Test 4: Check if the deployed config (only 3 per top) still varies
console.log("\n=== Test 4: With only 3 subdomains (deployed config) ===")
const smallDomainMap = {
  "xi-clouds.cn": ["xi-clouds.cn", "mail.xi-clouds.cn", "temp.xi-clouds.cn"],
  "0355650.xyz": ["0355650.xyz", "mail.0355650.xyz", "temp.0355650.xyz"]
}
const smallTopLevels = Object.keys(smallDomainMap)
function pickSmall(key) {
  if (key === RANDOM_KEY) {
    const top = smallTopLevels[Math.floor(Math.random() * smallTopLevels.length)]
    const subs = smallDomainMap[top] ?? [top]
    return subs[Math.floor(Math.random() * subs.length)]
  }
  const subs = smallDomainMap[key] ?? [key]
  return subs[Math.floor(Math.random() * subs.length)]
}

lastResult = null
sameCount = 0
maxSameCount = 0
for (let i = 0; i < 100; i++) {
  const r = pickSmall("xi-clouds.cn")
  if (r === lastResult) {
    sameCount++
    maxSameCount = Math.max(maxSameCount, sameCount)
  } else {
    sameCount = 0
  }
  lastResult = r
}
console.log(`  Max consecutive same results: ${maxSameCount}`)
