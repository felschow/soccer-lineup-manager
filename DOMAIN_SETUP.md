# 🌐 Custom Domain Setup Guide

## 🎯 Quick Setup Process

### **Step 1: Purchase Domain**
Choose your registrar and purchase your domain.

**Recommended domains for SimpleSquad:**
- `simplesquad.app`
- `soccerlineup.com`
- `teammanager.pro`
- `quicklineup.io`

### **Step 2: Add Domain to Firebase**
1. Go to [Firebase Console](https://console.firebase.google.com/project/simplesquad-d2b96)
2. Click **Hosting** in left sidebar
3. Click **Add custom domain**
4. Enter your domain (e.g., `yourdomain.com`)
5. Click **Continue**

### **Step 3: Verify Domain Ownership**
Firebase will provide a TXT record to add to your DNS:
```
Name: @
Type: TXT
Value: [Firebase will provide this]
```

### **Step 4: Configure DNS Records**
Add these DNS records at your registrar:

**A Records (for root domain):**
```
Name: @
Type: A
Value: 151.101.1.195
Value: 151.101.65.195
```

**CNAME Record (for www subdomain):**
```
Name: www
Type: CNAME
Value: simplesquad-d2b96.web.app
```

---

## 📋 Registrar-Specific Instructions

### **Cloudflare (Recommended)**
1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Search for your domain
3. Purchase domain
4. DNS records are automatically managed
5. Add Firebase records in DNS section

### **Namecheap**
1. Sign up at [namecheap.com](https://namecheap.com)
2. Search and purchase domain
3. Go to Domain List → Manage
4. Click **Advanced DNS**
5. Add Firebase DNS records

### **Google Domains**
1. Sign up at [domains.google](https://domains.google.com)
2. Search and purchase domain
3. Go to DNS section
4. Add Firebase DNS records

---

## ⚡ SSL Certificate (Automatic)

Firebase automatically provides SSL certificates for custom domains:
- ✅ Free SSL from Let's Encrypt
- ✅ Automatic renewal
- ✅ HTTPS redirect
- ✅ HTTP/2 support

---

## 🔍 Verification Process

### **Domain Verification:**
1. Add TXT record as instructed by Firebase
2. Wait 5-10 minutes
3. Click **Verify** in Firebase Console

### **SSL Certificate:**
- Takes 24-48 hours to provision
- Firebase will email you when ready
- Your site will be HTTPS automatically

---

## 🚨 Troubleshooting

### **"Domain verification failed"**
- Double-check TXT record value
- Wait 15 minutes and try again
- Verify record with: `dig TXT yourdomain.com`

### **"SSL certificate pending"**
- This is normal - takes 24-48 hours
- Your site works on HTTP immediately
- HTTPS will activate automatically

### **"DNS propagation issues"**
- DNS changes take time (up to 48 hours)
- Check propagation: [whatsmydns.net](https://whatsmydns.net)
- Be patient!

---

## 💰 Cost Breakdown

### **Domain Registration:**
- `.com`: $10-15/year
- `.app`: $15-20/year
- `.pro`: $15-25/year
- `.io`: $30-50/year

### **Firebase Hosting:**
- Custom domain: **FREE**
- SSL certificate: **FREE**
- DNS management: **FREE**

### **Total Annual Cost:**
**$10-50/year** (just domain registration!)

---

## 🎊 Success Checklist

After setup, verify:
- [ ] Domain resolves to your app
- [ ] HTTPS is working
- [ ] www redirects to non-www (or vice versa)
- [ ] PWA install works from custom domain
- [ ] All Firebase features work

---

## 🔗 Helpful Links

- [Firebase Custom Domain Docs](https://firebase.google.com/docs/hosting/custom-domain)
- [DNS Propagation Checker](https://whatsmydns.net)
- [SSL Certificate Checker](https://www.ssllabs.com/ssltest/)

Your custom domain will make your app look professional and trustworthy! 🌟