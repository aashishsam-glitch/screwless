const { generateOTP, verifyOTP, otpStore } = require('../lib/auth')

async function runTests() {
  console.log('🧪 Running Comprehensive OTP Test Suite...\n')

  // TEST 1: First correct OTP attempt -> Login Success
  console.log('--- TEST 1: First Correct OTP Attempt ---')
  const user1 = 'applicant@demo.com'
  const gen1 = generateOTP(user1)
  if (!gen1.success) throw new Error('Test 1 failed to generate OTP')
  console.log(`Generated OTP for ${user1}: ${gen1.code}`)

  const verify1 = verifyOTP(user1, gen1.code)
  if (!verify1.valid) {
    throw new Error(`Test 1 Failed: Expected valid OTP on first attempt, got error: ${verify1.error}`)
  }
  console.log('✅ TEST 1 PASSED: First attempt with correct OTP verified successfully!\n')

  // TEST 2: Wrong OTP then Correct OTP
  console.log('--- TEST 2: Wrong OTP followed by Correct OTP ---')
  const user2 = 'officer.fire@demo.gov.in'
  const gen2 = generateOTP(user2)
  if (!gen2.success) throw new Error('Test 2 failed to generate OTP')

  const verify2Wrong = verifyOTP(user2, '000000')
  if (verify2Wrong.valid) throw new Error('Test 2 Failed: Wrong OTP was accepted')
  console.log(`Received expected error on wrong OTP: "${verify2Wrong.error}"`)

  const verify2Correct = verifyOTP(user2, gen2.code)
  if (!verify2Correct.valid) throw new Error(`Test 2 Failed: Correct OTP after wrong OTP failed: ${verify2Correct.error}`)
  console.log('✅ TEST 2 PASSED: Wrong OTP rejected, subsequent correct OTP accepted!\n')

  // TEST 3: Expired OTP
  console.log('--- TEST 3: Expired OTP ---')
  const user3 = 'test.expired@demo.com'
  const gen3 = generateOTP(user3)
  if (!gen3.success) throw new Error('Test 3 failed to generate OTP')
  
  // Manually fast-forward expiration time
  const record = otpStore.get(user3)
  record.expiresAt = Date.now() - 1000

  const verify3 = verifyOTP(user3, gen3.code)
  if (verify3.valid || !verify3.error.includes('expired')) {
    throw new Error(`Test 3 Failed: Expired OTP was not properly rejected. Got: ${JSON.stringify(verify3)}`)
  }
  console.log(`Received expected expiry error: "${verify3.error}"`)
  console.log('✅ TEST 3 PASSED: Expired OTP rejected correctly!\n')

  // TEST 4: Resend OTP (OTP A invalidated by OTP B)
  console.log('--- TEST 4: Resend OTP (OTP A invalidated by OTP B) ---')
  const user4 = 'test.resend@demo.com'
  const gen4A = generateOTP(user4)
  if (!gen4A.success) throw new Error('Test 4 failed to generate OTP A')

  // Bypass 30s cooldown for testing resend
  const record4 = otpStore.get(user4)
  record4.lastSentAt = Date.now() - 31000

  const gen4B = generateOTP(user4)
  if (!gen4B.success) throw new Error('Test 4 failed to generate OTP B')

  const verify4A = verifyOTP(user4, gen4A.code)
  if (verify4A.valid) throw new Error('Test 4 Failed: Old OTP A was accepted after resend')
  console.log(`Old OTP A correctly rejected: "${verify4A.error}"`)

  const verify4B = verifyOTP(user4, gen4B.code)
  if (!verify4B.valid) throw new Error(`Test 4 Failed: New OTP B was rejected: ${verify4B.error}`)
  console.log('✅ TEST 4 PASSED: Resending OTP invalidated OTP A and accepted OTP B!\n')

  // TEST 5: Attempt limit (5 attempts max)
  console.log('--- TEST 5: Attempt Limit (5 Max) ---')
  const user5 = 'test.attempts@demo.com'
  const gen5 = generateOTP(user5)
  if (!gen5.success) throw new Error('Test 5 failed to generate OTP')

  for (let i = 1; i <= 4; i++) {
    const v = verifyOTP(user5, '999999')
    if (v.valid) throw new Error('Test 5 Failed: Invalid OTP accepted')
  }
  
  const v5 = verifyOTP(user5, '999999')
  if (v5.valid || !v5.error.includes('Too many attempts')) {
    throw new Error(`Test 5 Failed: 5th wrong attempt did not trigger lockout. Got: ${JSON.stringify(v5)}`)
  }
  console.log(`Received expected lockout error: "${v5.error}"`)
  console.log('✅ TEST 5 PASSED: Attempt limit (5 max) enforced successfully!\n')

  // TEST 6: Multiple Users (User A's OTP cannot authenticate User B)
  console.log('--- TEST 6: User Isolation ---')
  const userA = 'usera@demo.com'
  const userB = 'userb@demo.com'

  const genA = generateOTP(userA)
  // Bypass cooldown
  otpStore.get(userA).lastSentAt = Date.now() - 31000
  const genB = generateOTP(userB)

  const verifyBWithA = verifyOTP(userB, genA.code)
  if (verifyBWithA.valid) throw new Error("Test 6 Failed: User B authenticated with User A's OTP!")
  console.log(`Cross-user authentication prevented: "${verifyBWithA.error}"`)
  console.log('✅ TEST 6 PASSED: Strict per-user OTP isolation verified!\n')

  console.log('🎉 ALL 6 OTP SCENARIO TESTS PASSED SUCCESSFULLY!')
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err)
  process.exit(1)
})
