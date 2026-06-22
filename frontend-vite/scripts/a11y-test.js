/**
 * Accessibility Testing Script
 * 
 * Runs axe-core accessibility tests on the built application
 * 
 * This script:
 * 1. Starts a local server with the built files
 * 2. Runs axe-core tests on key pages
 * 3. Reports any accessibility violations
 * 
 * Documentation: https://github.com/dequelabs/axe-core-npm
 */

import { spawn } from 'child_process'
import { setTimeout } from 'timers/promises'

const SERVER_PORT = 4173
const BASE_URL = `http://localhost:${SERVER_PORT}`

// Pages to test for accessibility
const PAGES_TO_TEST = [
  '/',
  '/campaigns',
  '/about',
  // Add more pages as needed
]

console.log('🧪 Starting Accessibility Tests...\n')

// Start preview server
console.log('📡 Starting preview server...')
const server = spawn('npm', ['run', 'preview'], {
  shell: true,
  stdio: 'pipe',
})

let serverReady = false

server.stdout.on('data', (data) => {
  const output = data.toString()
  if (output.includes('Local:') || output.includes(`http://localhost:${SERVER_PORT}`)) {
    serverReady = true
  }
})

server.stderr.on('data', (data) => {
  console.error(`Server error: ${data}`)
})

// Wait for server to be ready
console.log('⏳ Waiting for server to start...')
let attempts = 0
while (!serverReady && attempts < 30) {
  await setTimeout(1000)
  attempts++
}

if (!serverReady) {
  console.error('❌ Server failed to start')
  server.kill()
  process.exit(1)
}

console.log('✅ Server started\n')

// Run axe tests
console.log('🔍 Running accessibility tests...\n')

let hasViolations = false

for (const page of PAGES_TO_TEST) {
  const url = `${BASE_URL}${page}`
  console.log(`Testing: ${url}`)
  
  try {
    const axe = spawn('npx', ['@axe-core/cli', url, '--exit'], {
      shell: true,
      stdio: 'inherit',
    })

    await new Promise((resolve, reject) => {
      axe.on('close', (code) => {
        if (code !== 0) {
          hasViolations = true
        }
        resolve()
      })
      axe.on('error', reject)
    })
  } catch (error) {
    console.error(`Error testing ${url}:`, error)
    hasViolations = true
  }
  
  console.log('')
}

// Cleanup
server.kill()

// Exit with appropriate code
if (hasViolations) {
  console.log('❌ Accessibility violations found!')
  console.log('\nPlease fix the issues above before merging.\n')
  console.log('Resources:')
  console.log('- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/')
  console.log('- axe DevTools: https://www.deque.com/axe/devtools/')
  console.log('- MDN Accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility')
  process.exit(1)
} else {
  console.log('✅ No accessibility violations found!')
  process.exit(0)
}

