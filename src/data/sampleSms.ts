import { SmsMessage } from '../types'

/**
 * Realistic Indian bank / UPI SMS for testing the parser + banner flow in the
 * browser (where there's no real inbox). Mix of debits, a credit, and noise
 * (OTP / promo / balance) that the parser must ignore.
 */
const DAY = 24 * 60 * 60 * 1000
const now = Date.now()

export const SAMPLE_SMS: SmsMessage[] = [
  {
    sender: 'VM-HDFCBK',
    body: 'Sent Rs.449.00 From HDFC Bank A/C *1234 To swiggy@okhdfcbank On 12-06-26 Ref 401234567890. Not You? Call 18002586161',
    date: now - 1 * DAY,
  },
  {
    sender: 'AD-SBIINB',
    body: 'Dear UPI user A/C X5678 debited by 1250.0 on date 11Jun26 trf to ZOMATO Refno 412345678901. If not u? call 1800111109. -SBI',
    date: now - 2 * DAY,
  },
  {
    sender: 'JM-ICICIB',
    body: 'ICICI Bank Acct XX910 debited for Rs 2399.00 on 10-Jun-26; Amazon credited. UPI:413456789012. Call 18002662 for dispute.',
    date: now - 3 * DAY,
  },
  {
    sender: 'VK-AxisBk',
    body: 'Spent Card no. XX4567 INR 780.00 10-06-2026 UBER INDIA Avl Lmt INR 84500. SMS BLOCK 4567 to 919951860002 if not you.',
    date: now - 3 * DAY,
  },
  {
    sender: 'AX-KOTAKB',
    body: 'Sent Rs.199.00 from Kotak Bank AC X2233 to netflix@okaxis on 09-06-26. UPI Ref 414567890123. Not you, call 18602662666',
    date: now - 4 * DAY,
  },
  {
    sender: 'VM-PYTMBK',
    body: 'Paytm: Rs.85 paid to Blinkit from your Paytm UPI. UPI Ref 415678901234. Balance updated.',
    date: now - 5 * DAY,
  },
  {
    sender: 'AD-SBIINB',
    body: 'Dear SBI UPI User, your A/c X5678-credited by Rs.75000 on 01Jun26 by SALARY ACME CORP (Ref no 416789012345)',
    date: now - 12 * DAY,
  },
  // --- noise the parser should drop ---
  {
    sender: 'VM-HDFCBK',
    body: '123456 is your OTP for HDFC Bank NetBanking. Do not share it with anyone. Valid for 10 mins.',
    date: now - 1 * DAY,
  },
  {
    sender: 'AD-SBIINB',
    body: 'Available balance in your A/c X5678 as on 12-06-26 is Rs.43,210.00. -SBI',
    date: now - 1 * DAY,
  },
  {
    sender: 'VK-AXISBK',
    body: 'Get a pre-approved personal loan of upto Rs.5,00,000 at low interest rates. Apply now! T&C apply.',
    date: now - 6 * DAY,
  },
]
