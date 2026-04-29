# Auth Testing Playbook (httpOnly cookie migration)

## Backend smoke tests

```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# 1. Login → expect Set-Cookie auth_token + token in body
rm -f /tmp/c.txt
curl -i -c /tmp/c.txt -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# 2. /me with cookie only → 200
curl -b /tmp/c.txt "$API_URL/api/auth/me"

# 3. /me with Bearer header only → 200 (legacy fallback)
TOKEN=...
curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/me"

# 4. /me with no auth → 401
curl -o /dev/null -w "%{http_code}\n" "$API_URL/api/auth/me"

# 5. /me with Bearer null → 401 (the token-less frontend fallback case)
curl -H "Authorization: Bearer null" "$API_URL/api/auth/me"

# 6. Logout → clears cookie
curl -i -b /tmp/c.txt -X POST "$API_URL/api/auth/logout"
```

## Frontend e2e tests
- Login flow: navigate to /login, submit valid creds, expect redirect to /dashboard (or /daily-tasks for employee).
- Refresh after login: page reload should keep the user logged in (AuthContext bootstrap calls /api/auth/me).
- Logout: click Logout → cookie cleared → redirected to /login → /api/auth/me now returns 401.
- localStorage inspection: open DevTools → Application → Storage → Local Storage → verify NO `token` key (only `user`).

## Cookie config
- `auth_token` cookie: HttpOnly, Secure, SameSite=Lax, Max-Age=604800 (7d), Path=/.
- Same-origin deployment: cookie auto-flows on all /api/* requests including WebSocket.

## Files
- `backend/auth.py` — token extraction (cookie first, header fallback), set/clear cookie helpers.
- `backend/routes/auth_routes.py` — login/register set cookie; logout clears it.
- `frontend/src/utils/api.js` — `axios.defaults.withCredentials = true`.
- `frontend/src/contexts/AuthContext.js` — bootstrap via /api/auth/me, no token in localStorage.
- `frontend/src/services/locationTracking.js` — fetch with `credentials: 'include'`.
- `frontend/src/pages/DailyTasks.js` — fetchOpts helper with credentials.
