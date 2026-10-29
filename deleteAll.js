const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// All user-editable settings live in input.js.
const inputPath = path.join(__dirname, 'input.js');

if (!fs.existsSync(inputPath)) {
    console.error('Missing input.js. Keep it in the same folder as deleteAll.js.');
    process.exit(1);
}

let settings;
try {
    settings = require(inputPath);
} catch (error) {
    console.error('Could not load input.js:', error.message);
    process.exit(1);
}

const { token, serverId, channelId, module: selectedModule, moduleInputs = {} } = settings;

if (
    !token || token === 'PASTE_BOT_TOKEN_HERE' ||
    !serverId || serverId === 'PASTE_SERVER_ID_HERE' ||
    !channelId || channelId === 'PASTE_CHANNEL_ID_HERE'
) {
    console.error('Open input.js and fill in token, serverId, and channelId.');
    process.exit(1);
}

const supportedModules = ['all', 'between', 'latest', 'oldest', 'user'];
if (!supportedModules.includes(selectedModule)) {
    console.error(`Invalid module "${selectedModule}". Use: ${supportedModules.join(', ')}`);
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Fetch the channel's history, newest first.
async function fetchAllMessages(channel) {
    const messages = [];
    let before;

    while (true) {
        const page = await channel.messages.fetch({
            limit: 100,
            ...(before ? { before } : {})
        });

        if (page.size === 0) break;

        messages.push(...page.values());
        before = page.last().id;
        console.log(`Fetched ${messages.length} messages...`);

        if (page.size < 100) break;
    }

    return messages;
}

// Validate and extract IDs from a Discord message link.
function parseMessageLink(link) {
    if (typeof link !== 'string') {
        throw new Error('Provide both message links in input.js for the between module.');
    }

    const match = link.match(
        /discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/
    );

    if (!match) throw new Error(`Invalid Discord message link: ${link}`);

    return {
        serverId: match[1],
        channelId: match[2],
        messageId: match[3]
    };
}

// Select messages based on the module and values in input.js.
async function selectMessages(channel) {
    const messages = await fetchAllMessages(channel);

    switch (selectedModule) {
        case 'all':
            return messages;

        case 'between': {
            const first = parseMessageLink(moduleInputs.firstMessageLink);
            const second = parseMessageLink(moduleInputs.secondMessageLink);

            for (const link of [first, second]) {
                if (link.serverId !== serverId || link.channelId !== channel.id) {
                    throw new Error('Both message links must be from the configured server and channel.');
                }
            }

            const firstId = BigInt(first.messageId);
            const secondId = BigInt(second.messageId);
            const lower = firstId < secondId ? firstId : secondId;
            const upper = firstId > secondId ? firstId : secondId;

            const selected = messages.filter(message => {
                const id = BigInt(message.id);
                return id >= lower && id <= upper;
            });

            if (
                !selected.some(message => message.id === first.messageId) ||
                !selected.some(message => message.id === second.messageId)
            ) {
                throw new Error('Could not find both boundary messages in the fetched channel history.');
            }

            return selected;
        }

        case 'latest':
        case 'oldest': {
            const count = Number(moduleInputs.count);

            if (!Number.isSafeInteger(count) || count < 1) {
                throw new Error(`For "${selectedModule}", moduleInputs.count must be a positive whole number.`);
            }

            return selectedModule === 'latest'
                ? messages.slice(0, count)
                : messages.slice(-count);
        }

        case 'user': {
            const userId = String(moduleInputs.userId ?? '');
            const count = Number(moduleInputs.count);

            if (!/^\d{17,20}$/.test(userId)) {
                throw new Error('For the user module, enter a valid Discord user ID in moduleInputs.userId.');
            }

            if (!Number.isSafeInteger(count) || count < 0) {
                throw new Error('For the user module, moduleInputs.count must be 0 or a positive whole number.');
            }

            const matching = messages.filter(message => message.author.id === userId);
            return count === 0 ? matching : matching.slice(0, count);
        }
    }
}

// Delete messages, using bulk deletion only for messages younger than 14 days.
async function deleteMessages(channel, selectedMessages) {
    const messages = [...new Map(
        selectedMessages.map(message => [message.id, message])
    ).values()];

    if (messages.length === 0) {
        console.log('No matching messages found. Nothing to delete.');
        return;
    }

    console.log(`\nModule: ${selectedModule}`);
    console.log(`Selected messages: ${messages.length}`);
    console.log('Review your input.js settings before continuing.');
    const confirmation = process.env.SKIP_DELETE_CONFIRMATION === 'true'
        ? 'DELETE'
        : await askForConfirmation();

    if (confirmation !== 'DELETE') {
        console.log('Cancelled. No messages were deleted.');
        return;
    }

    let deletedCount = 0;
    let failedCount = 0;
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const recent = messages.filter(message => message.createdTimestamp > cutoff);
    const older = messages.filter(message => message.createdTimestamp <= cutoff);

    // Discord's bulk-delete endpoint rejects messages older than 14 days.
    for (let index = 0; index < recent.length; index += 100) {
        const batch = recent.slice(index, index + 100);

        try {
            const result = await channel.bulkDelete(batch, true);
            deletedCount += result.size;
            failedCount += batch.length - result.size;
            console.log(`Deleted ${deletedCount} message(s) so far.`);
        } catch (error) {
            failedCount += batch.length;
            console.error('Bulk deletion failed:', error.message);
        }
    }

    // Attempt to delete older messages individually.
    for (const message of older) {
        try {
            await message.delete();
            deletedCount++;
        } catch (error) {
            failedCount++;
            console.error(`Failed to delete message ${message.id}: ${error.message}`);
        }
    }

    console.log('\nCleanup finished.');
    console.log(`Deleted: ${deletedCount}`);
    console.log(`Failed: ${failedCount}`);
}

async function askForConfirmation() {
    const readline = require('node:readline/promises');
    const { stdin, stdout } = require('node:process');
    const rl = readline.createInterface({ input: stdin, output: stdout });

    try {
        return (await rl.question('Type DELETE to start the cleanup action, or type anything else to cancel: ')).trim();
    } finally {
        rl.close();
    }
}

client.once('ready', async () => {
    try {
        console.log(`Connected as ${client.user.tag}`);

        const server = await client.guilds.fetch(serverId);
        const channel = await server.channels.fetch(channelId);

        if (!channel || !channel.isTextBased() || !channel.messages) {
            throw new Error('The configured channel is not a supported text channel.');
        }

        const permissions = channel.permissionsFor(client.user);
        if (!permissions?.has([
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ManageMessages
        ])) {
            throw new Error('The bot needs View Channel, Read Message History, and Manage Messages permissions.');
        }

        const selected = await selectMessages(channel);
        await deleteMessages(channel, selected);
    } catch (error) {
        console.error('\nError:', error.message);
    } finally {
        client.destroy();
    }
});

// Authenticate with the token configured in input.js.
client.login(token).catch(error => {
    console.error('Bot login failed:', error.message);
    process.exitCode = 1;
});
