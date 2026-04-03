# UNISON API Implementation Status

This file tracks the status of API integrations against the `docs/complete_api_handbook.md`.

## 🔐 Authentication
- [x] Send OTP (`POST /api/auth/send-otp`)
- [x] Verify OTP (`POST /api/auth/verify-otp`)
- [x] Register (`POST /api/auth/register`)
- [x] Login (`POST /api/auth/login`)
- [x] Reset Password (`POST /api/auth/reset-password`)

## 🔗 Connections
- [/] Send Request (`POST /api/connections/request/:target_id`) - *Partially implemented in network.api.ts*
- [x] Get Pending Requests (`GET /api/connections/requests`)
- [x] Respond to Request (`PATCH /api/connections/requests/:sender_id/respond`)
- [x] Get Connection Status (`GET /api/connections/status/:target_id`)
- [ ] Remove Connection (`DELETE /api/connections/:target_id`)

## 💼 Opportunities
- [x] Post Opportunity (`POST /api/opportunities`)
- [x] List Opportunities (`GET /api/opportunities`)
- [x] Get Details (`GET /api/opportunities/:id`)
- [/] My Posts (`GET /api/opportunities/my-posts`) - *Check field matches*
- [ ] Update Opportunity (`PUT /api/opportunities/:id`)
- [ ] Delete Opportunity (`DELETE /api/opportunities/:id`)

## 👤 Profiles/Users
- [x] Get My Alumni Profile (`GET /api/alumni/me`)
- [x] Get My Student Profile (`GET /api/student/me`)
- [x] Update Alumni Profile (`PUT /api/alumni/me`)
- [x] Update Student Profile (`PUT /api/student/me`)
- [ ] Get Public Profile (`GET /api/profiles/user/:id`)
- [ ] Work Experiences (`GET/POST/PUT/DELETE /api/alumni/work-experience`)
- [ ] Skills (`GET/POST/PUT/DELETE /api/alumni/skills`)

## 🔎 Search
- [x] Alumni Search (`GET /api/search/alumni`)
- [x] Opportunities Search (`GET /api/search/opportunities`)
- [ ] User Lookup (`GET /api/search/user/:username`)
- [ ] Skills (`GET /api/skills/all`)

## 📬 Notifications
- [x] Get My Notifications (`GET /api/notifications`)
- [x] Mark as Read (`PATCH /api/notifications/:id/read`)

## 🔌 WebSockets
- [x] Real-time notification event

## APIs to Remove (Not in Docs)
*Scanning...*
- [ ] To be identified.
