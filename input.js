// EDIT THIS FILE ONLY. You do not need to edit deleteAll.js.
// Replace the example values below. Keep the quotes and commas.
// IMPORTANT: Never upload this file with your real bot token to GitHub.

module.exports = {
    // Your bot token: Discord Developer Portal > Application > Bot.
    // Example: 'MTk4NjIyNDgzNDcxOTI1MjQ4.Cl2FMQ.ZnCjm1XVW7vRze4b7Cq4se7kKWs'
    token: 'PASTE_BOT_TOKEN_HERE',

    // Server ID: right-click your Discord server > Copy Server ID.
    // Example: '123456789012345678'
    serverId: 'PASTE_SERVER_ID_HERE',

    // Channel ID: right-click the target channel > Copy Channel ID.
    // Example: '234567890123456789'
    channelId: 'PASTE_CHANNEL_ID_HERE',

    // Choose exactly one module: 'all', 'between', 'latest', 'oldest', or 'user'.
    // 'all'     = delete every message found in the configured channel.
    // 'between' = delete messages between two message links, including both ends.
    // 'latest'  = delete the newest N messages.
    // 'oldest'  = delete the oldest N messages.
    // 'user'    = delete messages from one user; count 0 means all their messages.
    module: 'all',

    // Fill in only the fields needed for the module you selected above.
    moduleInputs: {
        // For module: 'between'
        // Paste full links copied from Discord's Copy Message Link option.
        // Example: 'https://discord.com/channels/123456789012345678/234567890123456789/345678901234567890'
        firstMessageLink: 'PASTE-HERE',
        // Example: 'https://discord.com/channels/123456789012345678/234567890123456789/456789012345678901'
        secondMessageLink: 'PASTE-HERE',

        // For module: 'latest' or 'oldest', enter a positive whole number.
        // Example: 100
        // For module: 'user', enter 0 to delete all messages from that user.
        count: 100,

        // For module: 'user', enter the user's Discord ID.
        // Example: '345678901234567890'
        userId: 'PASTE-HERE'
    }
};
