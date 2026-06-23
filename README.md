# Warehouse Ledger

A shared price tracker for Costco shopping: plan what to buy, log receipts, and
see a year of price history per item.

No login — anyone with the URL and the right Supabase data can use it, so treat
the deployed URL as private (don't post it publicly).

## 1. Create a Supabase project (free)

1. Go to https://supabase.com, sign up, and create a new project.
2. Once it's ready, open **SQL Editor** in the left sidebar.
3. Open `supabase-schema.sql` from this folder, copy its contents, paste into
   a new query, and click **Run**. This creates the three tables (`items`,
   `shopping_list`, `price_history`) and read/write access rules.
4. Go to **Project Settings -> API**. You'll need two values from this page:
   - **Project URL**
   - **anon public** key

## 2. Run it locally (optional, to test before deploying)

```bash
npm install
cp .env.local.example .env.local
# edit .env.local and paste in your Supabase URL + anon key
npm run dev
```

Open http://localhost:3000 -- you should see the app load with an empty list.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Warehouse Ledger"
```

Create a new repo on GitHub (keep it **private**, since the deployed app has
no login), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/warehouse-ledger.git
git branch -M main
git push -u origin main
```

## 4. Deploy on Vercel (free)

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New -> Project**, select your `warehouse-ledger` repo.
3. Before deploying, expand **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` -> your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> your Supabase anon public key
4. Click **Deploy**. After a minute you'll get a URL like
   `warehouse-ledger.vercel.app`.

That URL is what you and your partner bookmark / add to your phone's home
screen (Share -> Add to Home Screen on iOS, or the install icon in Chrome on
Android).

## 5. Using it

- **List** -- add things you plan to buy. Tap the input, type a name, pick a
  category, save.
- **Log receipt** -- after shopping, type each item + price, or use "Paste
  from photo text": send your receipt photo to Claude in a separate chat,
  ask it to list items and prices as plain text lines (`Item name 12.99`),
  then paste that block in. Logging a receipt automatically marks matching
  planned items as purchased and adds the prices to history.
- **History** -- every item you've ever logged, tap into one to see a 1-year
  price chart plus lowest / average / highest.

## Updating the app later

If you (or Claude, in a future chat) make changes to the code, push them to
GitHub and Vercel redeploys automatically -- no extra steps needed.

## Notes on the "no login" choice

Since there's no login, the Supabase **anon key** is the only thing standing
between your data and anyone who has both the key and your Supabase project
URL. The row-level security policies in `supabase-schema.sql` allow open
read/write on these three tables only -- this is acceptable for a private,
unlisted household tool, but don't share the GitHub repo or the deployed URL
publicly. If you ever want real accounts later, Supabase Auth can be added
without rebuilding the data layer.
