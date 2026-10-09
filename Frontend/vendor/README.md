# Vendored Third-Party Assets

The kiosk and dashboard run under `Content-Security-Policy: default-src 'self'`,
so **no CDN is reachable**. Chart.js must sit on disk.

Place the UMD build here as:

```
static/vendor/chart.min.js
```

Fetch it **once** on a machine with internet access (Chart.js 4.x UMD, ~200 kB):

```powershell
Invoke-WebRequest `
  -Uri "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" `
  -OutFile "static/vendor/chart.min.js"
```

Reference order in `admin.html` (P2 owns the markup):

```html
<script src="/static/vendor/chart.min.js"></script>
<script src="/static/js/dashboard_charts.js"></script>
```

`dashboard_charts.js` fails loudly in the browser console if `Chart` is undefined —
that means the file is missing, **not** that the API is down.
