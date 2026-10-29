# Discord Message Cleanup

A Node.js utility for cleaning up messages in one configured Discord channel. All settings and the chosen deletion module are entered in `input.js`; users do not need to edit the main program.

> **Warning:** Deletion is permanent. Use only in servers and channels where you have permission to moderate messages.

## Setup

1. Install [Node.js](https://nodejs.org/) (LTS recommended).
2. Open a terminal in this folder.
3. Run `npm install`.
4. Open `input.js` in a text editor and replace the example values.
5. Run `npm start`.
6. Review the selected message count. The terminal will ask you to type `DELETE` to start the cleanup action; any other input cancels it.

## Configure `input.js`

Edit these fields near the top:

- `token`: bot token from Discord Developer Portal → your application → Bot.
- `serverId`: right-click the server in Discord and choose **Copy Server ID**.
- `channelId`: right-click the target channel and choose **Copy Channel ID**.
- `module`: choose `all`, `between`, `latest`, `oldest`, or `user`.
- `moduleInputs`: set the fields required by the chosen module.

### Modules and their inputs

| `module` | Fields in `moduleInputs` | Behavior |
|---|---|---|
| `all` | None | Selects all messages fetched from the channel. |
| `between` | `firstMessageLink`, `secondMessageLink` | Selects messages between two links, including both boundary messages. Both links must be in the configured channel. |
| `latest` | `count` | Selects the newest N messages. `count` must be a positive whole number. |
| `oldest` | `count` | Selects the oldest N messages. `count` must be a positive whole number. |
| `user` | `userId`, `count` | Selects a user's newest N messages; `count: 0` selects all messages from that user in the fetched history. |

Examples are included as comments in `input.js`. Keep JavaScript syntax intact: strings use quotes, properties are separated by commas, and numeric counts are not quoted.

## Permissions

The bot needs **View Channel**, **Read Message History**, and **Manage Messages** in the target channel.

## The 14-day bulk-delete limit

Discord's bulk-delete endpoint cannot bulk-delete messages older than 14 days. This tool attempts to delete older messages individually; this is slower and may fail due to permissions, rate limits, or API errors. The code uses 14 days, not 14 years.

## Audit Log

Do not assume deletions are invisible. Discord's audit-log behavior depends on the API action and context, and individual and bulk deletion have different API behavior. Audit logs do not provide the full text of deleted messages. This tool does not set a custom audit-log reason; check Discord's current documentation and your server's Audit Log for behavior relevant to your setup.

## Security

- `input.js` is the editable settings file and is included in the repository with placeholder values.
- Never commit `input.js` after entering real credentials. Restore the placeholders before publishing changes, or keep your configured copy outside the repository.
- If you exposed a token, reset it in the Discord Developer Portal.
- The script fetches the entire channel history into memory; very large channels may take time and memory.

Docs: [Discord Developer Portal](https://discord.com/developers/applications) · [Discord message API docs](https://github.com/discord/discord-api-docs/blob/main/developers/resources/message.mdx)
