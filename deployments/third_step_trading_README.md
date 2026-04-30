# Third Step Trading Est. — Deployment Checklist

Step-by-step to deploy Company #2 as a separate instance.

## 1. Create the deployment on Emergent
1. In the Emergent chat input, click **Deploy** → create a new deployment named something like **`third-step-trading-crm`**.
2. The platform will create a fresh MongoDB DB for this deployment (isolated from Zartec).

## 2. Set env vars on the new deployment
Copy the values from these template files into the new deployment's environment:

- Frontend: [`deployments/third_step_trading_frontend.env`](./third_step_trading_frontend.env)
- Backend:  [`deployments/third_step_trading_backend.env`](./third_step_trading_backend.env)

**Key values to confirm:**
| Key | Value |
|-----|-------|
| `REACT_APP_COMPANY_NAME` | `Third Step Trading Est.` |
| `REACT_APP_COMPANY_TAGLINE` | `Your trusted business partner` |
| `REACT_APP_COMPANY_LOCATION` | `Saudi Arabia` |
| `REACT_APP_PRIMARY_COLOR` | `#2563eb` |
| `REACT_APP_SECONDARY_COLOR` | `#059669` |
| `SECRET_KEY` | (generate a strong random value) |

> 💡 If Emergent locks backend env vars as "Managed by Emergent", email support@emergent.sh to add `SECRET_KEY`.
> If nothing can be set, the app still works with the default — you can upgrade `SECRET_KEY` later.

## 3. Point custom domain to the deployment
- Go to deployment settings → **Domains** → add your custom domain.
- Update DNS per the platform's instructions (usually a CNAME).

## 4. First deploy
- Click **Deploy** — the platform will build + publish.

## 5. Run the seed script (ONE time only)
After first deploy completes, open the deployment's shell/terminal (or run locally against the prod DB) and execute:

```bash
cd /app/backend
python3 seed_new_deployment.py
```

This will create:
- The default **Third Step Trading Est.** company record
- The **Shaiju Puthukkat** admin user (`shaiju@tsgce-sa.com` / `shaiju123`)
- Master data (divisions, categories, brands, models) copied from Zartec

The script is idempotent — running it twice is safe.

## 6. First login + finalize setup
1. Visit your custom domain.
2. Log in as `shaiju@tsgce-sa.com` / `shaiju123`.
3. **Change the admin password immediately** via the profile menu.
4. Open **Company Settings** and:
   - Upload the Third Step logo (file upload).
   - Adjust address, phone, tax ID, anything else.
5. Upload the logo from Company Settings → live immediately.

## 7. Smoke test
- Create one test customer.
- Create one test product.
- Create one test sales invoice.
- Log out, log back in — session should persist via httpOnly cookie.
- Currency on the invoice should read **SAR**, VAT **15%**.

## 8. When it's solid — invite the real team
Users page → add team members (sales / support / data_entry / employee roles as appropriate).

---

## Troubleshooting

**Logo missing after deploy?**
- Expected — each deployment has its own DB. Re-upload via Company Settings.

**Login fails with right password?**
- Check network tab — make sure API calls hit your domain, not `dept-action-crm-1`. The code auto-corrects, but service workers from a previous test may have cached. Hard-refresh once.

**"Company not found" or currency wrong?**
- You skipped step 5. Run `python3 seed_new_deployment.py` once.

**Seed script says "Admin already exists"?**
- Safe to ignore — script is idempotent. DB is already seeded.
