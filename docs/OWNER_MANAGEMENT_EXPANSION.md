# Owner management expansion

Status: room availability implementation in progress; remaining scope pending. This extends the original
MVP to native Android and web. It does not describe features currently available.

## Experience

- Owner dashboard works for one property or many. Show property count, available
  units, occupied units, unpaid rent, and payments recorded for the selected period.
- Public rental feed uses readable post cards: photos, monthly rent, deposits,
  amenities, rules, location, available units, and owner contact action. Retain map
  and filter views. Likes/reactions are interest signals, never reservations.
- Renter inquiry starts a private conversation tied to the listing. Both people
  can read/send messages through web and Android. Unread counts and an in-app
  notification inbox link to the relevant conversation or rental.
- Owner property page shows rooms or beds in a labeled grid. Available, reserved,
  occupied, and unavailable have text labels as well as distinct colors.
- Whole-property rentals use one unit. Multi-room and bedspace rentals use separate
  units. Owners can manage them without needing a drawn architectural floor plan.
- Renters see only public availability and prices. Tenant names, dates, balances,
  messages, and payment records are private to authorized participants.
- A tenancy records the agreed renter, unit, rent, due date, and move-in/move-out
  dates. An inquiry never automatically creates an occupied tenancy. Renter
  acceptance and owner confirmation establish a tenancy in the app; occupancy is
  a recorded status, not a claim of physical presence or location tracking.
- Owners can record rent due, payments received, corrections, and outstanding
  amounts, and send a payment reminder linked to the tenancy. Collected rent and
  expected rent must be separate metrics. Never infer collected revenue from an
  occupied room or from reactions.

## Shared data and permissions

Extend the existing Neon/Drizzle backend; both clients use the same API contracts.
Entities: rental units, inquiries/conversations, conversation participants,
messages, notifications, listing reactions, tenancies, rent charges, payment
entries, and reminder events. Store money in integer centavos.

Every read/write checks the authenticated user and resource ownership on the
server, including list APIs. Public APIs exclude tenant and accounting fields.
Unique active unit occupancy, tenancy membership, and payment identifiers require
database constraints and concurrency-safe updates. Do not change all rooms to
occupied when one room is assigned. Public available counts derive from units.

Message sends, reminder sends, and reaction toggles need validation, rate limits,
and duplicate protection. Notification delivery failures cannot lose the underlying
message. In-app notifications work first; background push requires separate device
registration and permission handling. Payment corrections preserve an audit trail.

## Delivery slices

1. Units and availability: owner CRUD, public counts/grid, whole-unit compatibility.
2. Inquiries, private messaging, notifications, and renter acceptance of tenancy.
3. Rent charges, recorded payments, reminders, and dashboard totals.
4. Feed presentation and reactions, with shared native/web behavior and motion.

Each slice includes tracked migrations, authorization tests, integration tests for
concurrent occupancy and duplicate writes where applicable, and native/web visual
checks. Keep current authentication, theme settings, and listing review workflow.
Do not advertise a slice before its complete flow is verified.

## Open decision

Decision: owners record full/partial payments and send reminders first.
No payment provider, checkout, automatic debits, or fund transfers are selected.
Work on messaging, units, and public availability does not depend on this choice.

## Deployment

Prepare migrations for review and test locally first. Do not apply production
migrations or deploy changes without the authorization required by AGENTS.md.

Room availability requires migration 005 and server environment variable
`ENABLE_RENTAL_MANAGEMENT=true` after migration validation. The flag defaults off
so deploying code cannot break existing listings before database setup. Web owner
controls live under `/owner/listings/[id]/units`; Android controls are in My listings.
Public unit data excludes all tenant identity and payment data. The public room
grid derives its count from individual units; legacy listing slot counts are not
used for that grid. Messaging, tenant assignment, payment ledger, reminders, feed
reactions, and consolidated revenue metrics remain outstanding.
