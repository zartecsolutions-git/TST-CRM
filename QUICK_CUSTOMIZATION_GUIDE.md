# 🎯 Quick Customization Reference Card

## For Each New Company Deployment:

### 1. Edit `/app/frontend/.env`

```env
# ===== CHANGE THESE VALUES =====

REACT_APP_COMPANY_NAME=Your Company Name
REACT_APP_COMPANY_TAGLINE=Your tagline
REACT_APP_COMPANY_LOCATION=City, Country
REACT_APP_COMPANY_LOGO_URL=/your-logo.png
REACT_APP_PRIMARY_COLOR=#1e40af
REACT_APP_SECONDARY_COLOR=#16a34a
```

### 2. Add Logo File

- Place logo in: `/app/frontend/public/`
- Recommended: PNG with transparent background
- Size: 300x100px (width x height)

### 3. Restart & Test

```bash
sudo supervisorctl restart frontend
```

Then open: `http://localhost:3000/login`

---

## Color Palettes

### Professional Blue-Green (Default)
```
PRIMARY:   #1e40af (Blue)
SECONDARY: #16a34a (Green)
```

### Corporate Red-Orange
```
PRIMARY:   #dc2626 (Red)
SECONDARY: #ea580c (Orange)
```

### Tech Purple-Pink
```
PRIMARY:   #7c3aed (Purple)
SECONDARY: #ec4899 (Pink)
```

### Modern Teal-Cyan
```
PRIMARY:   #0d9488 (Teal)
SECONDARY: #0891b2 (Cyan)
```

---

## Checklist ✅

- [ ] Company name
- [ ] Logo added to `/public/`
- [ ] Logo path in `.env`
- [ ] Colors set
- [ ] Frontend restarted
- [ ] Login page tested
- [ ] Mobile view tested
- [ ] Ready to deploy!

---

**Deployment Cost:** 50 credits/month per company
**Max Deployments:** 100 per account
