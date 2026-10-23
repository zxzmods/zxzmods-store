import crypto from "crypto";
import fs from "fs";
import path from "path";

// Standalone test suite for ZxZ MODS Enterprise Cybersecurity Verification
async function runSecurityAuditTests() {
  console.log("==================================================");
  console.log("   ZxZ MODS - Enterprise Security Verification    ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Customer Session HMAC-SHA256 Signing & Tampering Defense (SEC-03)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 1: Signed Customer Session & Tamper Resistance ---");
  const testSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  function testCreateToken(payload: { userId: string; email: string; role?: string }): string {
    const now = Date.now();
    const fullPayload = {
      userId: payload.userId,
      email: payload.email.toLowerCase().trim(),
      role: payload.role || "CUSTOMER",
      issuedAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    };
    const payloadString = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
    const signature = crypto.createHmac("sha256", testSecret).update(payloadString).digest("base64url");
    return `${payloadString}.${signature}`;
  }

  function testVerifyToken(token: string): any | null {
    try {
      if (!token || typeof token !== "string") return null;
      const parts = token.split(".");
      if (parts.length !== 2) return null;
      const [payloadString, signature] = parts;
      const expectedSignature = crypto.createHmac("sha256", testSecret).update(payloadString).digest("base64url");
      const sigA = Buffer.from(signature);
      const sigB = Buffer.from(expectedSignature);
      if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) return null;
      const payload = JSON.parse(Buffer.from(payloadString, "base64url").toString("utf8"));
      if (Date.now() > payload.expiresAt) return null;
      return payload;
    } catch {
      return null;
    }
  }

  const payload = {
    userId: "cuid_test_customer_12345",
    email: "customer@example.com",
    role: "CUSTOMER",
  };

  const signedToken = testCreateToken(payload);
  assert("Session token generation contains 2 dot-separated segments", signedToken.split(".").length === 2);

  const verified = testVerifyToken(signedToken);
  assert("Valid signed token verifies successfully", verified !== null && verified.userId === payload.userId);

  // Tamper with payload segment
  const parts = signedToken.split(".");
  const tamperedPayload = Buffer.from(JSON.stringify({ ...payload, userId: "cuid_hacked_admin_99999" })).toString("base64url");
  const tamperedToken = `${tamperedPayload}.${parts[1]}`;
  const tamperedResult = testVerifyToken(tamperedToken);
  assert("Tampered payload signature is rejected", tamperedResult === null);

  // Tamper with signature segment
  const forgedSigToken = `${parts[0]}.badsignaturedeadbeef1234567890`;
  const forgedResult = testVerifyToken(forgedSigToken);
  assert("Forged signature is rejected", forgedResult === null);

  // Expired token check
  const expiredPayload = {
    ...payload,
    issuedAt: Date.now() - 100000000,
    expiresAt: Date.now() - 5000, // expired 5 seconds ago
  };
  const expP = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
  const expSig = crypto.createHmac("sha256", testSecret).update(expP).digest("base64url");
  const expiredToken = `${expP}.${expSig}`;
  assert("Expired signed token is rejected", testVerifyToken(expiredToken) === null);

  // ---------------------------------------------------------------------------
  // TEST 2: Cryptographic Entropy of Claim Tokens & Order Numbers (SEC-08)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 2: Cryptographic Randomness (CSPRNG) ---");
  function generateSecureClaimToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  function generateOrderNumber(): string {
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const randPart = crypto.randomInt(1000, 10000).toString();
    return `ZXZ-${datePart}-${randPart}`;
  }

  const token1 = generateSecureClaimToken();
  const token2 = generateSecureClaimToken();
  assert("Claim token is at least 48 characters", token1.length >= 48);
  assert("Two consecutive claim tokens are completely distinct", token1 !== token2);

  const orderNum1 = generateOrderNumber();
  const orderNum2 = generateOrderNumber();
  assert("Order number starts with ZXZ-", orderNum1.startsWith("ZXZ-"));
  assert("Consecutive order numbers are non-colliding", orderNum1 !== orderNum2);

  // ---------------------------------------------------------------------------
  // TEST 3: SSRF Blocklist Defense (SEC-02)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 3: SSRF Detection & Blocklist ---");
  const ssrfTargets = [
    "http://127.0.0.1:8080/admin",
    "http://localhost:3000/sys-control",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.1/internal-api",
    "http://192.168.1.1/router-settings",
    "http://172.16.0.5/secrets",
    "ftp://ftp.example.com/payload",
    "file:///etc/passwd",
  ];

  function isBlockedUrl(urlString: string): boolean {
    try {
      const parsed = new URL(urlString);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;
      const host = parsed.hostname.toLowerCase();
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "0.0.0.0" ||
        host === "::1" ||
        host.startsWith("169.254.") ||
        host.startsWith("10.") ||
        host.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
      ) {
        return true;
      }
      return false;
    } catch {
      return true;
    }
  }

  for (const target of ssrfTargets) {
    assert(`SSRF target correctly blocked: ${target}`, isBlockedUrl(target));
  }

  assert("Legitimate HTTPS domain allowed: https://shopthedurham.com", !isBlockedUrl("https://shopthedurham.com/product/1"));
  assert("Legitimate HTTPS domain allowed: https://zxzmods.com", !isBlockedUrl("https://zxzmods.com/catalog"));

  // ---------------------------------------------------------------------------
  // TEST 4: Magic Bytes File Verification (SEC-10)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 4: Magic Bytes Signature Defense ---");
  function isAllowedSignature(buf: Buffer): boolean {
    if (buf.length < 12) return false;
    // JPEG: FF D8 FF
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
    // PNG: 89 50 4E 47
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
    ) return true;
    return false;
  }

  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const validJpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const invalidTextFile = Buffer.from("Plain text content pretending to be an image");
  const rawSvgFile = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><circle r='10'/></svg>");

  assert("Authentic PNG signature recognized", isAllowedSignature(validPng));
  assert("Authentic JPEG signature recognized", isAllowedSignature(validJpg));
  assert("Plain text pretending to be image rejected", !isAllowedSignature(invalidTextFile));
  assert("Raw SVG file rejected by image signature validator", !isAllowedSignature(rawSvgFile));

  // ---------------------------------------------------------------------------
  // TEST 5: SQL Probing & Injection Shield ("SQL Promping" Shield)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 5: SQL Probing & Injection Defense ---");
  const sqlProbes = [
    "' UNION SELECT null, username, password FROM users--",
    "1' OR '1'='1",
    "1; DROP TABLE \"Order\";--",
    "admin' OR 1=1--",
    "WAITFOR DELAY '0:0:5'",
    "SLEEP(5)",
    "BENCHMARK(5000000,MD5(1))",
    "xp_cmdshell('dir')",
  ];

  const SQL_PROBING_PATTERNS = [
    /(\b(union(\s+all)?)\b\s+select)/i,
    /(\bor\b\s+['"]?1['"]?\s*=\s*['"]?1)/i,
    /(\band\b\s+['"]?1['"]?\s*=\s*['"]?1)/i,
    /(\bselect\b.+\bfrom\b)/i,
    /(\binsert\b.+\binto\b)/i,
    /(\bdelete\b.+\bfrom\b)/i,
    /(\bdrop\b\s+(table|database|view|column))/i,
    /(\bupdate\b.+\bset\b)/i,
    /(\bexec(ute)?\b\s*\()/i,
    /(\bxp_cmdshell\b)/i,
    /(\bwaitfor\s+delay\b)/i,
    /(\bsleep\s*\(\s*\d+\s*\))/i,
    /(\bbenchmark\s*\(\s*\d+)/i,
    /(--|\/\*|\*\/|@@version|char\s*\(|concat\s*\()/i,
  ];

  function detectSqlProbe(input: string): boolean {
    return SQL_PROBING_PATTERNS.some((p) => p.test(input));
  }

  for (const probe of sqlProbes) {
    assert(`SQL probe detected and rejected: ${probe}`, detectSqlProbe(probe));
  }

  assert("Legitimate search query allowed: Polaris RZR Turbo S", !detectSqlProbe("Polaris RZR Turbo S"));
  assert("Legitimate vehicle model allowed: Can-Am Maverick X3 2024", !detectSqlProbe("Can-Am Maverick X3 2024"));

  // ---------------------------------------------------------------------------
  // TEST 6: XSS & Stored Script Injection Sanitization
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 6: Input Injection & XSS Sanitization ---");
  function sanitizePlainText(input: string): string {
    let cleaned = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/javascript\s*:/gi, "")
      .replace(/data\s*:\s*text\/html/gi, "");

    return cleaned
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .trim();
  }

  const dirtyInput = "<script>alert('pwned')</script>Great clutch kit!";
  const sanitized = sanitizePlainText(dirtyInput);
  assert("Script tags completely eliminated", !sanitized.includes("<script>"));
  assert("Sanitized output contains clean user content", sanitized.includes("Great clutch kit!"));

  const dirtyComment = "Transferencia realizada <iframe src='http://evil.com'></iframe> ref 12345";
  const sanitizedComment = sanitizePlainText(dirtyComment);
  assert("Iframe tags stripped", !sanitizedComment.includes("<iframe"));

  // ---------------------------------------------------------------------------
  // TEST 7: Payment Storage URL Validation Defense
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 7: Storage URL Origin Verification ---");
  function isValidStorageUrl(url: string): boolean {
    if (url.startsWith("/uploads/") && !url.includes("..")) return true;
    if (url.startsWith("https://storage.googleapis.com/")) return true;
    if (url.startsWith("https://firebasestorage.googleapis.com/")) return true;
    return false;
  }

  assert("Local upload payment path accepted", isValidStorageUrl("/uploads/payments/slip_123.jpg"));
  assert("Google Cloud Storage bucket URL accepted", isValidStorageUrl("https://storage.googleapis.com/zxzmods-ac591.appspot.com/payments/slip.png"));
  assert("Arbitrary external phishing domain rejected", !isValidStorageUrl("https://attacker-bank.com/fake-slip.png"));
  assert("Javascript protocol URL rejected", !isValidStorageUrl("javascript:alert(1)"));
  assert("Path traversal inside storage path rejected", !isValidStorageUrl("/uploads/payments/../../etc/passwd"));

  // ---------------------------------------------------------------------------
  // TEST 8: Master Elevation Password Brute-Force Rate Limiting
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 8: Backdoor Master Elevation Protection ---");
  const ipAttempts = new Map<string, { attempts: number; lockedUntil: number }>();
  const testIp = "198.51.100.42";

  function simulateFailedElevation(ip: string): boolean {
    const record = ipAttempts.get(ip) || { attempts: 0, lockedUntil: 0 };
    if (record.lockedUntil > Date.now()) return false; // locked
    record.attempts += 1;
    if (record.attempts >= 5) {
      record.lockedUntil = Date.now() + 30 * 60 * 1000;
    }
    ipAttempts.set(ip, record);
    return true;
  }

  // 4 attempts allowed
  assert("Attempt 1 allowed", simulateFailedElevation(testIp));
  assert("Attempt 2 allowed", simulateFailedElevation(testIp));
  assert("Attempt 3 allowed", simulateFailedElevation(testIp));
  assert("Attempt 4 allowed", simulateFailedElevation(testIp));
  assert("Attempt 5 triggers lockout", simulateFailedElevation(testIp));
  // 6th attempt blocked by lockout
  assert("Attempt 6 strictly blocked by lockout", !simulateFailedElevation(testIp));

  // ---------------------------------------------------------------------------
  // TEST 9: Backdoor Data & Stats Protection (Profit Margin Masking)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 9: Backdoor Data & Profit Margin Masking ---");
  const rawDbProduct = {
    id: "prod-1",
    nameEs: "Kit de Embrague",
    priceCRC: 250000,
    processingPriceCRC: 160000,
    processingPriceD: 310,
    profitCRC: 70000,
    shippingPriceCRC: 20000,
  };

  function maskProductForClient(prod: typeof rawDbProduct, isStaff: boolean) {
    return {
      id: prod.id,
      nameEs: prod.nameEs,
      priceCRC: prod.priceCRC,
      price: {
        P_price_D: isStaff ? prod.processingPriceD : 0,
        P_price: isStaff ? prod.processingPriceCRC : 0,
        S_price: isStaff ? prod.shippingPriceCRC : 0,
        profit: isStaff ? prod.profitCRC : 0,
        T_price: prod.priceCRC,
      },
    };
  }

  const publicProduct = maskProductForClient(rawDbProduct, false);
  assert("Public visitor sees profit as 0", publicProduct.price.profit === 0);
  assert("Public visitor sees wholesale processing price as 0", publicProduct.price.P_price === 0);
  assert("Public customer sees retail priceCRC", publicProduct.priceCRC === 250000);

  const staffProduct = maskProductForClient(rawDbProduct, true);
  assert("Authorized staff sees real profit margin", staffProduct.price.profit === 70000);
  assert("Authorized staff sees wholesale supplier price", staffProduct.price.P_price === 160000);

  // ---------------------------------------------------------------------------
  // TEST 10: Gitignore & Key Exposure Defense
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 10: Gitignore & Secret File Exclusion ---");
  const gitignorePath = path.join(process.cwd(), ".gitignore");
  const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");

  assert(".gitignore ignores backups/ directory", gitignoreContent.includes("backups/"));
  assert(".gitignore ignores .env.*", gitignoreContent.includes(".env.*"));
  assert(".gitignore ignores scripts/data-backup.json", gitignoreContent.includes("scripts/data-backup.json"));
  assert(".gitignore ignores service-account*.json", gitignoreContent.includes("*service-account*.json"));
  assert(".gitignore ignores .gemini/", gitignoreContent.includes(".gemini/"));

  console.log("\n==================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAuditTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
