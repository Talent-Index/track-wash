# TrackWash

On-demand car wash booking platform with M-Pesa and crypto payments.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Backend API
VITE_API_BASE_URL=https://trackwash-api.onrender.com

# Supabase (auto-configured by Lovable Cloud)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# WalletConnect (for crypto payments)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## Features

- **M-Pesa Payments**: Real Daraja STK Push integration
- **Crypto Payments**: Connect wallet via WalletConnect
- **Supabase Auth**: Email/password authentication
- **Booking Management**: Create, track, and manage car wash bookings

## Manual Test Checklist

1. **Sign Up / Sign In**
   - Navigate to `/auth`
   - Create a new account with email/password
   - Sign out and sign back in
   - Session should persist across page refresh

2. **Create Booking**
   - Navigate to `/booking/new`
   - Select service type, package, vehicle
   - Set schedule and location
   - Proceed to payment

3. **Pay with M-Pesa**
   - Enter phone number (07XXXXXXXX or +2547XXXXXXXX)
   - Click "Send STK Push"
   - Check phone for STK prompt
   - Enter M-Pesa PIN
   - Wait for confirmation (polling every 2.5s)
   - Success: Receipt number shown, redirected to booking detail
   - Failure: Error shown, retry available

4. **Connect Wallet (Crypto)**
   - Click "Connect Wallet" on crypto payment option
   - Select wallet (MetaMask or WalletConnect)
   - Approve connection
   - Wallet address, chain, and balance displayed
   - Address saved to booking record

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Database)
- wagmi + viem (Web3)
- M-Pesa Daraja API

## Development

```bash
npm install
npm run dev
```

## Deployment

Open [Lovable](https://lovable.dev) and click on Share -> Publish.
