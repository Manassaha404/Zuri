export interface AuthorizeViewProps {
  clientName: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state?: string;
  scope?: string;
  error?: string;
}

export function renderAuthorizeHtml(props: AuthorizeViewProps): string {
  const {
    clientName,
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    state = "",
    scope = "mcp:tools mcp:resources mcp:prompts",
    error,
  } = props;

  const scopeList = scope
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.trim());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize ${escapeHtml(clientName)} · Zuri</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root,
    .L,
    [data-theme="light"] {
      --bg: #ffffff;
      --s: #f8f9fa;
      --surface-card: #f5f5f5;
      --surface-strong: #e5e7eb;
      --h: #e5e7eb;
      --h-soft: #f3f4f6;
      --i: #111111;
      --b: #374151;
      --m: #6b7280;
      --m-soft: #898989;
      --p: #111111;
      --p-hover: #27272a;
      --pt: #ffffff;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --error: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
    }

    .dark,
    .D,
    [data-theme="dark"] {
      --bg: #101010;
      --s: #141414;
      --surface-card: #18181b;
      --surface-strong: #27272a;
      --h: #27272a;
      --h-soft: #1e1e21;
      --i: #ffffff;
      --b: #d4d4d8;
      --m: #a1a1aa;
      --m-soft: #71717a;
      --p: #ffffff;
      --p-hover: #e4e4e7;
      --pt: #111111;
      --accent: #3b82f6;
      --accent-hover: #60a5fa;
      --error: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      min-height: 100vh;
      background: var(--s);
      color: var(--b);
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      position: relative;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    /* Top right theme toggle */
    .theme-toggle-wrap {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 20;
    }

    @media (min-width: 640px) {
      .theme-toggle-wrap {
        top: 24px;
        right: 24px;
      }
    }

    .theme-toggle-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--h);
      background: var(--bg);
      color: var(--i);
      cursor: pointer;
      overflow: hidden;
      transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
    }

    .theme-toggle-btn:hover {
      background: var(--s);
      transform: scale(1.05);
    }

    .theme-toggle-btn:active {
      transform: scale(0.95);
    }

    .theme-icon-sun,
    .theme-icon-moon {
      position: absolute;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
    }

    [data-theme="light"] .theme-icon-sun {
      transform: rotate(0deg) scale(1);
      opacity: 1;
      color: #f59e0b;
    }

    [data-theme="light"] .theme-icon-moon {
      transform: rotate(-90deg) scale(0.2);
      opacity: 0;
    }

    [data-theme="dark"] .theme-icon-sun {
      transform: rotate(90deg) scale(0.2);
      opacity: 0;
    }

    [data-theme="dark"] .theme-icon-moon {
      transform: rotate(0deg) scale(1);
      opacity: 1;
      color: #38bdf8;
    }

    /* Auth Card container (.k) */
    .k {
      width: 100%;
      max-width: 420px;
      background: var(--bg);
      border: 1px solid var(--h);
      border-radius: 16px;
      padding: 36px 32px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      text-align: center;
      align-items: stretch;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 10px 24px -4px rgba(0, 0, 0, 0.04);
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }

    @media (max-width: 480px) {
      .k {
        padding: 28px 20px;
        gap: 16px;
      }
    }

    /* Mascot Avatar */
    .avatar-container {
      position: relative;
      margin: 0 auto 4px auto;
      width: 72px;
      height: 72px;
      transition: transform 0.3s ease-out;
    }

    .mascot-avatar {
      width: 72px;
      height: 72px;
      display: block;
      filter: drop-shadow(0 4px 12px rgba(91, 127, 229, 0.25));
    }

    .eye {
      transition: transform 0.2s ease-out;
      transform-origin: center;
    }

    @keyframes eyeBlink {
      0%, 96%, 100% {
        transform: scaleY(1);
      }
      98% {
        transform: scaleY(0.1);
      }
    }

    .eye-pupil {
      animation: eyeBlink 4s infinite ease-in-out;
      transform-origin: center;
    }

    /* Avatar states */
    .looking-down .eye {
      transform: translateY(3.5px);
    }

    .looking-up .eye {
      transform: translateY(-4px);
    }

    @keyframes bot-shake {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      15% { transform: translateX(-4px) rotate(-2deg); }
      30% { transform: translateX(4px) rotate(2deg); }
      45% { transform: translateX(-3px) rotate(-1.5deg); }
      60% { transform: translateX(3px) rotate(1.5deg); }
      75% { transform: translateX(-2px) rotate(-0.5deg); }
      90% { transform: translateX(2px) rotate(0.5deg); }
    }

    .bot-shake {
      animation: bot-shake 0.45s ease-in-out 2;
    }

    /* Badge Pill */
    .badge-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1px solid var(--h);
      background: var(--surface-card);
      color: var(--m);
      align-self: center;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--success);
    }

    /* Typography */
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.03em;
      line-height: 1.25;
      color: var(--i);
    }

    p.subtitle {
      margin: 0;
      font-size: 13px;
      color: var(--m);
      line-height: 1.5;
    }

    p.subtitle strong {
      color: var(--i);
    }

    /* Requested Permissions Details Card */
    .client-details-card {
      background: var(--surface-card);
      border: 1px solid var(--h);
      border-radius: 12px;
      padding: 12px 14px;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .client-details-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 500;
      color: var(--m);
    }

    .client-name-tag {
      font-weight: 600;
      color: var(--i);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .client-icon {
      width: 14px;
      height: 14px;
      color: var(--accent);
    }

    .scope-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .scope-chip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      padding: 2px 8px;
      background: var(--bg);
      border: 1px solid var(--h);
      border-radius: 6px;
      color: var(--accent);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* Segmented Nav Pill Switcher */
    .nav-pill-group {
      display: flex;
      background: var(--s);
      border: 1px solid var(--h);
      border-radius: 9999px;
      padding: 3px;
      gap: 4px;
      margin-top: 2px;
    }

    .nav-pill-item {
      flex: 1;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      padding: 7px 14px;
      border: none;
      cursor: pointer;
      background: transparent;
      color: var(--m);
      font-family: inherit;
      transition: all 0.15s ease;
    }

    .nav-pill-item:hover:not(.active) {
      color: var(--i);
    }

    .nav-pill-item.active {
      background: var(--p);
      color: var(--pt);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    /* Alerts */
    .er {
      color: #ef4444;
      font-size: 12px;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      padding: 9px 12px;
      text-align: center;
      line-height: 1.4;
    }

    /* Form Fields */
    form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      text-align: left;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      text-align: left;
      font-size: 13px;
      font-weight: 500;
      color: var(--i);
    }

    .input-wrapper {
      position: relative;
      width: 100%;
    }

    .in {
      height: 40px;
      width: 100%;
      border: 1px solid var(--h);
      border-radius: 8px;
      background: var(--bg);
      color: var(--i);
      padding: 0 14px;
      font-size: 14px;
      font-family: Inter, -apple-system, sans-serif;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .in::placeholder {
      color: var(--m);
      opacity: 0.6;
    }

    .in:hover {
      border-color: var(--m);
    }

    .in:focus {
      outline: none;
      border-color: var(--i);
      box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.08);
    }

    [data-theme="dark"] .in:focus,
    .dark .in:focus {
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.12);
    }

    .password-toggle-btn {
      position: absolute;
      right: 8px;
      top: 6px;
      height: 28px;
      padding: 0 8px;
      border: 0;
      background: transparent;
      color: var(--m);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease;
    }

    .password-toggle-btn:hover {
      color: var(--i);
    }

    /* Divider */
    .dv {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      color: var(--m);
      margin: 4px 0;
    }

    .dv::before,
    .dv::after {
      content: "";
      flex: 1;
      height: 1px;
      background: var(--h);
    }

    .google-btn {
      margin-top: 4px;
    }

    /* Buttons */
    .bt {
      height: 40px;
      width: 100%;
      border-radius: 8px;
      border: 1px solid var(--h);
      background: var(--bg);
      color: var(--i);
      font-size: 14px;
      font-weight: 600;
      font-family: Inter, -apple-system, sans-serif;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, transform 0.1s ease;
      user-select: none;
      text-decoration: none;
    }

    .bt:hover:not(:disabled) {
      background: var(--s);
      border-color: var(--m);
    }

    .bt:active:not(:disabled) {
      transform: scale(0.99);
    }

    .bt.p {
      background: var(--p);
      color: var(--pt);
      border-color: var(--p);
      margin-top: 4px;
    }

    /* Light hover */
    :root:not(.dark):not([data-theme="dark"]) .bt.p:hover:not(:disabled),
    .L .bt.p:hover:not(:disabled),
    [data-theme="light"] .bt.p:hover:not(:disabled) {
      background-color: #27272a;
      border-color: #27272a;
      color: #ffffff;
    }

    /* Dark hover */
    .dark .bt.p:hover:not(:disabled),
    .D .bt.p:hover:not(:disabled),
    [data-theme="dark"] .bt.p:hover:not(:disabled) {
      background-color: #e4e4e7;
      border-color: #e4e4e7;
      color: #111111;
    }

    .bt.p:active:not(:disabled) {
      transform: scale(0.99);
      opacity: 0.9;
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid var(--h);
      color: var(--m);
    }

    .btn-secondary:hover {
      background: var(--s);
      color: var(--i);
    }

    /* Footer & Legal */
    .auth-footer {
      font-size: 13px;
      color: var(--m);
      text-align: center;
      margin-top: 2px;
    }

    .auth-footer a {
      color: var(--i);
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }

    .auth-legal {
      font-size: 11px;
      color: var(--m-soft);
      line-height: 1.5;
      text-align: center;
      margin-top: 4px;
    }

    .hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  <!-- Theme Toggle in top-right -->
  <div class="theme-toggle-wrap">
    <button
      id="themeToggleBtn"
      type="button"
      class="theme-toggle-btn"
      aria-label="Toggle theme"
      title="Toggle theme"
      onclick="toggleTheme()"
    >
      <!-- Sun icon -->
      <svg class="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      </svg>
      <!-- Moon icon -->
      <svg class="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      </svg>
    </button>
  </div>

  <!-- Main Auth Card -->
  <div class="k">
    <!-- Header with Mascot Avatar & Headings -->
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
      <div id="avatarContainer" class="avatar-container ${error ? "bot-shake" : ""}">
        <svg class="mascot-avatar" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="zuriSphere" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stop-color="#7297ff"/>
              <stop offset="60%" stop-color="#5b7fe5"/>
              <stop offset="100%" stop-color="#3a5fd6"/>
            </radialGradient>
            <radialGradient id="zuriGlow" cx="32%" cy="25%" r="35%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <!-- Body sphere -->
          <circle cx="36" cy="36" r="32" fill="url(#zuriSphere)"/>
          <circle cx="36" cy="36" r="32" fill="url(#zuriGlow)"/>
          <!-- Eyes -->
          <g class="eye eye-pupil">
            <!-- Left Eye -->
            <rect x="26" y="29" width="6" height="15" rx="3" fill="#111316"/>
            <circle cx="28" cy="32" r="1.3" fill="#ffffff" opacity="0.9"/>
            <!-- Right Eye -->
            <rect x="40" y="29" width="6" height="15" rx="3" fill="#111316"/>
            <circle cx="42" cy="32" r="1.3" fill="#ffffff" opacity="0.9"/>
          </g>
        </svg>
      </div>

      <span class="badge-pill">
        <span class="badge-dot"></span>
        OAuth 2.1 &bull; PKCE Protected
      </span>

      <h1 id="formHeading">Authorize Access</h1>
      <p class="subtitle">
        <strong>${escapeHtml(clientName)}</strong> is requesting permission to access your tools and workspace on this MCP server.
      </p>
    </div>

    <!-- Client & Permissions Box -->
    <div class="client-details-card">
      <div class="client-details-header">
        <span>Application:</span>
        <span class="client-name-tag">
          <svg class="client-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="m9 8 6 4-6 4Z"/>
          </svg>
          ${escapeHtml(clientName)}
        </span>
      </div>
      <div style="font-size: 11px; font-weight: 500; color: var(--m); margin-top: 2px;">
        Requested Scopes:
      </div>
      <div class="scope-chips">
        ${scopeList.map((s) => `<span class="scope-chip">✓ ${escapeHtml(s)}</span>`).join("")}
      </div>
    </div>

    <!-- Segmented Nav Pill Switcher -->
    <div class="nav-pill-group">
      <button
        type="button"
        id="tabSignIn"
        class="nav-pill-item active"
        onclick="switchAuthTab(false)"
      >
        Sign in
      </button>
      <button
        type="button"
        id="tabSignUp"
        class="nav-pill-item"
        onclick="switchAuthTab(true)"
      >
        Create account
      </button>
    </div>

    ${error ? `<div class="er" role="alert">${escapeHtml(error)}</div>` : ""}

    <!-- Login Form -->
    <form id="loginForm" method="POST" action="/oauth/authorize">
      <input type="hidden" name="action" value="login">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}">
      <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}">
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(codeChallengeMethod)}">
      <input type="hidden" name="state" value="${escapeHtml(state)}">
      <input type="hidden" name="scope" value="${escapeHtml(scope)}">

      <label for="login-email">
        <span>Email or username</span>
        <input
          type="text"
          id="login-email"
          name="emailOrUsername"
          class="in"
          required
          autofocus
          autocomplete="username"
          placeholder="you@email.com"
        >
      </label>

      <label for="login-password">
        <span>Password</span>
        <div class="input-wrapper">
          <input
            type="password"
            id="login-password"
            name="password"
            class="in"
            required
            autocomplete="current-password"
            placeholder="••••••••"
          >
          <button
            type="button"
            class="password-toggle-btn"
            onclick="togglePasswordVisibility('login-password', this)"
          >
            Show
          </button>
        </div>
      </label>

      <button type="submit" class="bt p">Sign in & Authorize</button>
      <div class="dv">or</div>
      <a
        href="/auth/google?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=${encodeURIComponent(codeChallengeMethod)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}"
        class="bt google-btn"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
        </svg>
        Continue with Google
      </a>
      <a
        href="${escapeHtml(redirectUri)}?error=access_denied&state=${escapeHtml(state)}"
        class="bt btn-secondary"
      >
        Cancel
      </a>

      <p class="auth-footer">
        Don&apos;t have an account? <a onclick="switchAuthTab(true)">Create one now</a>
      </p>
    </form>

    <!-- Register Form -->
    <form id="registerForm" method="POST" action="/oauth/authorize" class="hidden">
      <input type="hidden" name="action" value="register">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}">
      <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}">
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(codeChallengeMethod)}">
      <input type="hidden" name="state" value="${escapeHtml(state)}">
      <input type="hidden" name="scope" value="${escapeHtml(scope)}">

      <div class="form-grid">
        <label for="reg-firstName">
          <span>First name</span>
          <input
            type="text"
            id="reg-firstName"
            name="firstName"
            class="in"
            required
            autocomplete="given-name"
            placeholder="Jane"
          >
        </label>
        <label for="reg-lastName">
          <span>Last name</span>
          <input
            type="text"
            id="reg-lastName"
            name="lastName"
            class="in"
            required
            autocomplete="family-name"
            placeholder="Doe"
          >
        </label>
      </div>

      <label for="reg-username">
        <span>Username</span>
        <input
          type="text"
          id="reg-username"
          name="username"
          class="in"
          required
          autocomplete="username"
          placeholder="jane_doe"
        >
      </label>

      <label for="reg-email">
        <span>Email</span>
        <input
          type="email"
          id="reg-email"
          name="email"
          class="in"
          required
          autocomplete="email"
          placeholder="you@email.com"
        >
      </label>

      <label for="reg-password">
        <span>Password</span>
        <div class="input-wrapper">
          <input
            type="password"
            id="reg-password"
            name="password"
            class="in"
            minlength="6"
            required
            autocomplete="new-password"
            placeholder="••••••••"
          >
          <button
            type="button"
            class="password-toggle-btn"
            onclick="togglePasswordVisibility('reg-password', this)"
          >
            Show
          </button>
        </div>
      </label>

      <button type="submit" class="bt p">Create Account & Authorize</button>
      <div class="dv">or</div>
      <a
        href="/auth/google?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=${encodeURIComponent(codeChallengeMethod)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}"
        class="bt google-btn"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
        </svg>
        Continue with Google
      </a>
      <button type="button" class="bt btn-secondary" onclick="switchAuthTab(false)">Back to Sign in</button>

      <p class="auth-footer">
        Already have an account? <a onclick="switchAuthTab(false)">Sign in</a>
      </p>
    </form>

    <p class="auth-legal">
      By authorizing, you agree to grant this client access to your Zuri MCP environment.
    </p>
  </div>

  <script>
    // Theme Management
    function getStoredTheme() {
      try {
        const saved = localStorage.getItem("zuri-theme");
        if (saved) return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } catch (e) {
        return "light";
      }
    }

    function applyTheme(theme) {
      const isDark = theme === "dark";
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.classList.toggle("D", isDark);
      document.documentElement.classList.toggle("L", !isDark);
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      try {
        localStorage.setItem("zuri-theme", theme);
      } catch (e) {}
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
    }

    // Apply initial theme immediately
    applyTheme(getStoredTheme());

    // Switch between Sign in and Register
    function switchAuthTab(isRegister) {
      document.getElementById('loginForm').classList.toggle('hidden', isRegister);
      document.getElementById('registerForm').classList.toggle('hidden', !isRegister);
      document.getElementById('tabSignIn').classList.toggle('active', !isRegister);
      document.getElementById('tabSignUp').classList.toggle('active', isRegister);

      const heading = document.getElementById('formHeading');
      if (heading) {
        heading.innerText = isRegister ? 'Create Account & Authorize' : 'Authorize Access';
      }

      // Focus first input
      setTimeout(() => {
        if (isRegister) {
          const first = document.getElementById('reg-firstName');
          if (first) first.focus();
        } else {
          const loginInput = document.getElementById('login-email');
          if (loginInput) loginInput.focus();
        }
      }, 50);
    }

    // Password visibility toggle
    function togglePasswordVisibility(inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerText = 'Hide';
      } else {
        input.type = 'password';
        btn.innerText = 'Show';
      }
    }

    // Mascot eye tracking reaction
    const avatar = document.getElementById('avatarContainer');
    document.addEventListener('focusin', (e) => {
      if (!avatar) return;
      if (e.target && e.target.type === 'password') {
        avatar.classList.add('looking-up');
        avatar.classList.remove('looking-down');
      } else if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        avatar.classList.add('looking-down');
        avatar.classList.remove('looking-up');
      }
    });

    document.addEventListener('focusout', () => {
      if (!avatar) return;
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
          avatar.classList.remove('looking-up', 'looking-down');
        }
      }, 100);
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
