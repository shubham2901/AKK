# Start dev server

Start the Next.js dev server from the **project root** (`AKK`).

1. Run **`npm run dev:restart`** in the terminal. It frees the default dev port if something is already listening (stale or stuck `next dev`), then starts `next dev`.

2. If that fails, find what is bound to port **3000** (or `$PORT` if set), terminate it, then run **`npm run dev`**.

3. Confirm the server is listening and tell the user the URL (usually `http://localhost:3000`).

Run the commands yourself; do not only suggest them to the user.
