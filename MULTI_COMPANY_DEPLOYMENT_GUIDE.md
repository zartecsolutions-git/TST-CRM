# 🏢 Multi-Company Deployment Guide

This CRM application is designed to be easily deployed for multiple companies with different branding and settings.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Customization Steps](#customization-steps)
- [Logo Setup](#logo-setup)
- [Color Customization](#color-customization)
- [Testing](#testing)

---

## 🚀 Quick Start

### For Each New Company:

1. **Pull this repository** into a new Emergent task
2. **Update environment variables** in `/app/frontend/.env`
3. **Add company logo** to `/app/frontend/public/` folder
4. **Test the changes** locally
5. **Deploy** the application

---

## 🔧 Environment Variables

### Location: `/app/frontend/.env`

Copy the `.env.example` file and customize these values:

```env
# Company Information
REACT_APP_COMPANY_NAME=Your Company Name Here
REACT_APP_COMPANY_TAGLINE=Your tagline or description
REACT_APP_COMPANY_LOCATION=City, Country

# Company Logo
REACT_APP_COMPANY_LOGO_URL=/your-logo.png

# Color Scheme (Hex codes)
REACT_APP_PRIMARY_COLOR=#1e40af
REACT_APP_SECONDARY_COLOR=#16a34a
```

---

## 🎨 Customization Steps

### Step 1: Company Information

Update these in `.env`:
```env
REACT_APP_COMPANY_NAME=ABC Corporation
REACT_APP_COMPANY_TAGLINE=Leading solutions provider since 2020
REACT_APP_COMPANY_LOCATION=Dubai, UAE
```

**Where it appears:**
- Login page header
- Browser tab title (update in `public/index.html`)
- Mobile app header

---

### Step 2: Logo Setup

#### Option A: Use Local Logo (Recommended)

1. **Add your logo** to `/app/frontend/public/` folder
   - Supported formats: PNG, SVG, JPG
   - Recommended size: 300x100 px (or similar aspect ratio)
   - File name: `logo.png` (or any name you prefer)

2. **Update .env:**
   ```env
   REACT_APP_COMPANY_LOGO_URL=/logo.png
   ```

#### Option B: Use External URL

```env
REACT_APP_COMPANY_LOGO_URL=https://yourdomain.com/logo.png
```

**Logo appears on:**
- Login page (large, centered)
- Mobile header (small, left side)
- Dashboard header (desktop)

**Logo Requirements:**
- Transparent background recommended
- Width: 200-400px
- Height: 80-150px
- File size: < 500KB

---

### Step 3: Color Customization

Choose your brand colors in hex format:

```env
REACT_APP_PRIMARY_COLOR=#1e40af    # Main color for buttons, headers
REACT_APP_SECONDARY_COLOR=#16a34a  # Accent color for success states
```

**Where colors are used:**
- **Primary Color:**
  - Login button
  - Main navigation active state
  - Important action buttons
  - Header gradients
  
- **Secondary Color:**
  - Success messages
  - Completed status indicators
  - Secondary buttons
  - Gradient combinations

#### Color Scheme Examples:

**Blue & Green (Default - Zartec):**
```env
REACT_APP_PRIMARY_COLOR=#1e40af
REACT_APP_SECONDARY_COLOR=#16a34a
```

**Corporate Red & Orange:**
```env
REACT_APP_PRIMARY_COLOR=#dc2626
REACT_APP_SECONDARY_COLOR=#ea580c
```

**Tech Purple & Pink:**
```env
REACT_APP_PRIMARY_COLOR=#7c3aed
REACT_APP_SECONDARY_COLOR=#ec4899
```

**Professional Teal & Cyan:**
```env
REACT_APP_PRIMARY_COLOR=#0d9488
REACT_APP_SECONDARY_COLOR=#0891b2
```

**Modern Dark Blue & Light Blue:**
```env
REACT_APP_PRIMARY_COLOR=#1e3a8a
REACT_APP_SECONDARY_COLOR=#3b82f6
```

---

## 🧪 Testing Your Customization

### 1. Test Locally

After making changes to `.env`:

```bash
# Restart the frontend
sudo supervisorctl restart frontend

# Wait a few seconds, then test
curl http://localhost:3000
```

### 2. Visual Checks

Check these pages:
- ✅ **Login Page** - Logo, company name, colors
- ✅ **Dashboard** - Header logo, navigation colors
- ✅ **Mobile View** - Header logo, menu colors

### 3. Test Mobile View

Use browser dev tools:
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone SE" or "iPhone 12 Pro"
4. Check logo visibility and menu

---

## 📝 Deployment Checklist

Before deploying for a new company:

- [ ] Company name updated in `.env`
- [ ] Logo file added to `/public/` folder
- [ ] Logo path updated in `.env`
- [ ] Company colors set in `.env`
- [ ] Company tagline updated
- [ ] Company location updated
- [ ] Tested login page
- [ ] Tested dashboard
- [ ] Tested mobile view
- [ ] Created admin user account
- [ ] Updated `public/manifest.json` with company name

---

## 🔄 Common Customization Patterns

### Pattern 1: Subsidiary Companies (Same Logo, Different Names)

```env
# Parent Company
REACT_APP_COMPANY_NAME=TechCorp Global
REACT_APP_COMPANY_LOGO_URL=/techcorp-logo.png

# Subsidiary 1
REACT_APP_COMPANY_NAME=TechCorp UAE
REACT_APP_COMPANY_LOGO_URL=/techcorp-logo.png

# Subsidiary 2
REACT_APP_COMPANY_NAME=TechCorp Europe
REACT_APP_COMPANY_LOGO_URL=/techcorp-logo.png
```

### Pattern 2: Different Brands (Different Logos & Colors)

```env
# Brand A
REACT_APP_COMPANY_NAME=Alpha Solutions
REACT_APP_COMPANY_LOGO_URL=/alpha-logo.png
REACT_APP_PRIMARY_COLOR=#3b82f6
REACT_APP_SECONDARY_COLOR=#8b5cf6

# Brand B
REACT_APP_COMPANY_NAME=Beta Systems
REACT_APP_COMPANY_LOGO_URL=/beta-logo.png
REACT_APP_PRIMARY_COLOR=#dc2626
REACT_APP_SECONDARY_COLOR=#f59e0b
```

---

## 🎯 Additional Customizations

### Update Browser Tab Title

Edit `/app/frontend/public/index.html`:

```html
<title>Your Company Name - CRM</title>
```

### Update PWA App Name

Edit `/app/frontend/public/manifest.json`:

```json
{
  "short_name": "Company CRM",
  "name": "Your Company Name CRM",
  ...
}
```

### Update Favicon

Replace `/app/frontend/public/favicon.ico` with your company favicon

---

## 🆘 Troubleshooting

### Logo Not Showing

1. Check file path is correct
2. Verify file exists in `/public/` folder
3. Clear browser cache (Ctrl+Shift+R)
4. Check console for 404 errors

### Colors Not Applying

1. Verify hex format: `#1e40af` (must include #)
2. Restart frontend after `.env` changes
3. Clear browser cache
4. Check for typos in variable names

### Changes Not Visible

1. Restart frontend: `sudo supervisorctl restart frontend`
2. Hard refresh browser: Ctrl+Shift+R
3. Check if `.env` file was saved
4. Verify variable names match exactly

---

## 📊 Deployment Comparison

### Single Company:
```
One deployment → One database → One company
Cost: 50 credits/month
```

### Three Companies:
```
Company A deployment → Database A
Company B deployment → Database B  
Company C deployment → Database C
Cost: 150 credits/month (50 × 3)
```

Each deployment is completely isolated - no shared data between companies.

---

## 💡 Best Practices

1. **Keep original as template** - Don't modify the main GitHub repo for each client
2. **Document customizations** - Keep a list of what you changed for each company
3. **Test before deploy** - Always test locally first
4. **Backup .env files** - Save each company's .env for future reference
5. **Use descriptive names** - Name deployments clearly: `crm-company-a`

---

## 📞 Support

For deployment questions, contact Emergent support or refer to:
- Emergent Documentation
- This repository's README.md
- Test credentials in `/app/memory/test_credentials.md`

---

**Last Updated:** April 2026
**Version:** 1.0.0
