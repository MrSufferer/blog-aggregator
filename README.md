# Blog Aggregator

RSS feed aggregator CLI. Follow feeds, browse posts.

## Setup

1. **Config file** — create `~/.gatorconfig.json`:

```json
{
  "dbUrl": "postgresql://user:password@localhost:5432/blog_aggregator",
  "currentUserName": ""
}
```

2. **Database** — set up PostgreSQL, run migrations:

```bash
npm run generate  # Create migration files
npm run migrate   # Apply to database
```

3. **Node version** — `22.15.0` (see `.nvmrc`)

## Run

```bash
npm start -- <command> [args]
```

## Commands

| Command | Description |
|---------|-------------|
| `register <username>` | Create account |
| `login <username>` | Set current user |
| `users` | List all users |
| `addfeed <name> <url>` | Add RSS feed |
| `feeds` | List all feeds |
| `follow <url>` | Follow a feed |
| `following` | Show followed feeds |
| `unfollow <url>` | Unfollow a feed |
| `browse [limit]` | Read posts (default 2) |
| `agg <duration>` | Run continuously (e.g., `30s`, `5m`, `1h`) |
| `reset` | Delete all users |
| `service start <duration>` | Start daemon (background) |
| `service stop` | Stop daemon |
| `service restart` | Restart daemon |
| `service status` | Show daemon PID, uptime, restarts |

## Examples

```bash
# Create user, add feed, browse posts
npm start -- register alice
npm start -- addfeed "Hacker News" "https://news.ycombinator.com/rss"
npm start -- browse 5

# Follow another user's feed
npm start -- login alice
npm start -- follow "https://example.com/feed.xml"
npm start -- following

# Continuous aggregation
npm start -- agg 30s

# Daemon mode (background, auto-restart on crash)
npm start -- service start 30s
npm start -- service status
npm start -- service stop

# Logs at ~/.gator/logs/daemon-YYYY-MM-DD.log
```