## Google Business Explorer

Google Business Explorer lets you search, review, and export Google Business (Places) listings from a web interface that is ready to deploy to Vercel.

### Requirements

- Google Places API key with access to the Places API.

### Local setup

1. Install dependencies (already done if you used `create-next-app`):

   ```bash
   npm install
   ```

2. Create a `.env.local` file populated with your API key:

   ```bash
   cp .env.example .env.local
   # Edit .env.local and set GOOGLE_PLACES_API_KEY
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to interact with the app.

### Usage

- Enter a search query (e.g. `coffee shops in Seattle`).
- Optionally provide latitude/longitude coordinates (`47.6062,-122.3321`) and choose a radius.
- Submit to retrieve businesses, open them on Google Maps, or export the results to CSV.

### Deployment

Deploy straight to Vercel:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-ff5cc18b
```

Ensure the `GOOGLE_PLACES_API_KEY` environment variable is configured in the Vercel project settings before deploying.
