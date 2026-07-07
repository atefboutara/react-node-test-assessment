<<<<<<< HEAD
A small realtime chat application built with React and Express.

The application supports text messages, image uploads, message deletion, realtime updates through Pusher Channels, and debounced message search.
Small note: I added a gitignore since original repo lacked one. I also added an env.example file in the react project folder, since it lacked one (to help whoever's testing win time).

## Completed Challenges
### 1. Realtime messages with Pusher
- Added backend Pusher Channels configuration.
- Published `new-message` events when text or image messages are created.
- Published `message-deleted` events when messages are deleted.
- Added a React Pusher subscription to update the message list without refreshing.
- Added duplicate protection so the sender does not receive the same message twice.
- Added cleanup for Pusher subscriptions and connections.

### 2. Message search and realtime feed

- Added `GET /api/messages/search?q=term`.
- Search is case-insensitive.
- Search checks both the username and message content.
- Results are ordered newest first.
- Results are limited to a maximum of 100 messages.
- Added a search input with a 300ms debounce.
- Added request cancellation when the search term changes.
- Added search loading, empty, and error states.
- The normal realtime feed continues updating while search results are displayed.
- Clearing the search restores the latest realtime message feed.

## Repository Layout
- `api/` – Express backend for messages, image uploads, search, and Pusher events.
- `app/` – React frontend for the chat interface and realtime subscriptions.

## Prerequisites

- Node.js 22 or newer
- pnpm recommended, or npm
- A Pusher Channels account and application

## Pusher Setup

Create a Pusher Channels application using:

- Frontend: React
- Backend: Node.js
- A cluster close to your region

The backend requires the App ID, Key, Secret, and Cluster.

The frontend only requires the public Key and Cluster.

Open a terminal:

```bash
cd api
cp env.example .env
pnpm install
pnpm dev
```

For Windows PowerShell:

```powershell
cd api
Copy-Item env.example .env
pnpm install
pnpm dev
```

Configure `api/.env`:

```env
PORT=3001

PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
```

The backend runs at:

```text
http://localhost:3001
```

Health endpoint:

```text
http://localhost:3001/api/health
```

## Frontend Setup

Open another terminal:

```bash
cd app
cp env.example .env
pnpm install
pnpm dev
```

For Windows PowerShell:

```powershell
cd app
Copy-Item env.example .env
pnpm install
pnpm dev
```

Configure `app/.env`:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_PUSHER_KEY=your_pusher_key
REACT_APP_PUSHER_CLUSTER=your_pusher_cluster
```

The frontend runs at:

```text
http://localhost:3000
```

Restart the React development server after changing frontend environment variables.

## Main API Endpoints

### Get messages

```http
GET /api/messages
```

### Search messages

```http
GET /api/messages/search?q=term
```

The search query must not be empty.

### Create a text message

```http
POST /api/messages
```

Example body:

```json
{
  "username": "Atef",
  "message": "Hello"
}
```

### Create an image message

```http
POST /api/messages/with-image
```

This endpoint expects multipart form data containing:

- `username`
- `message`, optional
- `image`

### Delete a message

```http
DELETE /api/messages/:id
```

## Realtime Events

The application uses the Pusher channel:

```text
messages
```

Events:

```text
new-message
message-deleted
```

## Testing Realtime Updates

1. Start the backend and frontend.
2. Open the frontend in two browser windows.
3. Send a message in the first window.
4. Confirm it appears in the second window without refreshing.
5. Delete the message.
6. Confirm it disappears from both windows.
7. Repeat the test with an image message.

## Testing Search

1. Create several messages with different usernames and content.
2. Enter part of a username or message in the search field.
3. Confirm the search waits briefly before making the request.
4. Confirm matching results are shown newest first.
5. Search for text with no matches and confirm the empty state appears.
6. Clear the search field and confirm the realtime feed returns.

## Storage Notes

As the challenge mentionned earlier, no database is required.
Messages are stored in memory and are lost whenever the backend restarts.

Uploaded images are stored in the backend `uploads/` directory and remain after restarting the backend.

# react-node-test-assessment
>>>>>>> 94225b19fc2863d1403687fb12d940baa48775ce
