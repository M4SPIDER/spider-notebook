// Privacy filter for Spider Browser — masks sensitive data before AI sees it

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g
const CREDIT_CARD_REGEX = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g
const SSN_REGEX = /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g
const CVV_REGEX = /\b\d{3,4}\b/g

// CSS to inject into webviews for visual privacy filtering
const PRIVACY_CSS = `
  /* Blur faces — target common avatar/profile image patterns */
  img[src*="avatar"],
  img[src*="profile"],
  img[src*="face"],
  img[class*="avatar"],
  img[class*="profile"],
  img[class*="face"],
  img[class*="Avatar"],
  img[class*="Profile"],
  img[class*="Face"],
  [data-testid*="avatar"],
  [data-testid*="profile"],
  .avatar,
  .profile-pic,
  .user-avatar,
  .face-detection {
    filter: blur(10px) !important;
    -webkit-filter: blur(10px) !important;
  }

  /* Blur QR codes — target common QR code containers */
  img[src*="qr"],
  img[src*="QR"],
  img[alt*="QR"],
  img[alt*="qr"],
  img[class*="qr"],
  img[class*="QR"],
  [data-testid*="qr"],
  .qr-code,
  .QRCode,
  canvas[data-qr],
  svg[class*="qr"],
  [class*="qrcode"],
  [class*="QRCode"] {
    filter: blur(15px) !important;
    -webkit-filter: blur(15px) !important;
  }

  /* Hide password fields visually (they're already dots, but double protection) */
  input[type="password"],
  input[type="password"] * {
    -webkit-text-security: disc !important;
  }
`

export function getPrivacyCSS(): string {
  return PRIVACY_CSS
}

/**
 * Inject privacy CSS into a webview to blur faces and QR codes visually
 */
export function injectPrivacyCSS(webview: any): void {
  webview.insertCSS(PRIVACY_CSS).catch(() => {})
}

/**
 * Mask sensitive data in text before sending to AI
 */
export function maskSensitiveText(text: string): string {
  if (!text) return text

  let masked = text

  // Mask email addresses
  masked = masked.replace(EMAIL_REGEX, (match) => {
    const [local, domain] = match.split("@")
    const maskedLocal = local.length > 2
      ? local[0] + "***" + local[local.length - 1]
      : "***"
    return `${maskedLocal}@${domain}`
  })

  // Mask phone numbers
  masked = masked.replace(PHONE_REGEX, (match) => {
    if (match.replace(/\D/g, "").length < 7) return match
    return "***-***-" + match.slice(-4)
  })

  // Mask credit card numbers (keep last 4)
  masked = masked.replace(CREDIT_CARD_REGEX, (match) => {
    const digits = match.replace(/\D/g, "")
    if (digits.length < 13 || digits.length > 19) return match
    return "****-****-****-" + digits.slice(-4)
  })

  // Mask SSN
  masked = masked.replace(SSN_REGEX, "***-**-****")

  return masked
}

/**
 * Remove password field values from DOM before text extraction
 */
export function getPasswordFilterJS(): string {
  return `
    (() => {
      document.querySelectorAll('input[type="password"]').forEach(el => {
        el.value = '';
        el.setAttribute('data-privacy-cleared', 'true');
      });
    })()
  `
}

/**
 * Get the combined privacy filter JS to run before text extraction
 */
export function getPrivacyFilterJS(): string {
  return `
    (() => {
      // Clear password fields
      document.querySelectorAll('input[type="password"]').forEach(el => {
        el.value = '';
      });

      // Remove sensitive attributes from inputs
      document.querySelectorAll('input[type="tel"], input[type="email"], input[name*="card"], input[name*="cvv"], input[name*="ssn"], input[name*="password"], input[name*="credit"], input[name*="payment"]').forEach(el => {
        el.removeAttribute('value');
        el.value = '';
      });
    })()
  `
}
