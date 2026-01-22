# Phase 1 Functional Checklist

This checklist is the release gate for Phase 1. All items must pass.

## Dealer journey (must pass)

- [ ] Login first time → 0 orders / 0 backorders / empty recent orders
- [ ] Account page: view account details
- [ ] Account page: update name/email
- [ ] Account page: request password reset
- [ ] Account page: shows tier assignments GN/ES/BR Net1–Net7
- [ ] Search: results show correct stock rules (0, 1–199, 200+)
- [ ] Search: shows “Ordered on Demand” when flagged
- [ ] Search: pricing resolves (special price > tier net price)
- [ ] Search: supersession message appears when applicable
- [ ] Cart: add item(s), persist, return later
- [ ] Cart: totals correct
- [ ] Checkout: update default shipping method during checkout
- [ ] Checkout: place order (write to primary)
- [ ] Orders: view orders, statuses
- [ ] Orders: download orders export
- [ ] Backorders: view backorders
- [ ] Backorders: download backorders export
- [ ] News: view articles
- [ ] News: download attachments
- [ ] Logout works

## Admin journey (must pass)

- [ ] Dashboard: shows DB-derived counts, empty when DB empty
- [ ] Dealers: create/update dealer
- [ ] Dealers: tier assignments saved (GN/ES/BR)
- [ ] Dealers: sends “new dealer registration email” (or logs if dev)
- [ ] Admin Users: only admin identities (no dealer user creation here)
- [ ] Imports: templates downloadable on each import page
- [ ] Imports: dealers import works
- [ ] Imports: products import works
- [ ] Imports: supersession import works
- [ ] Imports: orders update import works (schema enforced)
- [ ] Imports: backorders update import works (schema enforced)
- [ ] News Articles: create/publish “New to range” + attachment (optional dates)
- [ ] News Articles: create/publish “Special price list” (CSV + start/end mandatory) → updates pricing
- [ ] News Articles: archive after 6 months (auto or job)
- [ ] Banners: create/update banner; dealer sees it (lag acceptable)
- [ ] Exports: export orders/backorders from admin panel
- [ ] Logout works
