const { Client, Intents } = require("discord.js");
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
require("dotenv").config();

const axios = require("axios");
const axiosThrottle = require("axios-request-throttle");

axios.interceptors.request.use((request) => {
    console.log("Requested");
    return request;
});

axiosThrottle.use(axios, { requestsPerSecond: 1 });

const baseRequestURL = "https://open-api.bser.io";

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// client.on("interactionCreate", async (interaction) => {
//     if (!interaction.isCommand()) return;

//     const command = client.commands.get(interaction.commandName);

//     if (!command) return;

//     try {
//         await command.execute(interaction);
//     } catch (error) {
//         console.error(error);
//         await interaction.reply({
//             content: "There was an error while executing this command!",
//             ephemeral: true,
//         });
//     }
// });

users = [];
subscribers = [];
running = false;
checker = undefined;

client.on("messageCreate", async (interaction) => {
    const message = interaction.content;
    if (!message.startsWith("!")) return;

    params = message.split(" ");
    switch (params[0].substring(1)) {
        case "add":
            if (params.length != 2) {
                interaction.channel.send("Incorrect Number of Params");
                break;
            }
            username = params[1];

            users.push(username);
            interaction.channel.send(`Added name ${username}`);
            break;
        case "users":
            if (users && users.length > 0) {
                interaction.channel.send(users.join("\n"));
            } else {
                interaction.channel.send("No usernames to check");
            }
            break;
        case "subscribe":
            subscribers.push(interaction.author);
            interaction.channel.send("Subscribed");
            break;
        case "unsubscribe":
            subscribers.filter((sub) => {
                sub.username != interaction.author.username;
            });
            interaction.channel.send("Unsubscribed");
            break;
        case "subs":
            if (subscribers && subscribers.length > 0) {
                interaction.channel.send(
                    subscribers.map((sub) => sub.username).join("\n")
                );
            } else {
                interaction.channel.send("No subscribers yet");
            }
            break;
        case "status":
            if (checker) {
                interaction.channel.send(`🟩 Running`);
            } else {
                interaction.channel.send(`🟥 Not Running`);
            }
            break;
        case "start":
            if (checker) interaction.channel.send(`Already Running`);
            check();
            checker = setInterval(check, 300000);
            interaction.channel.send(`🟩 Started Up`);
            break;
        case "stop":
            if (checker) {
                clearInterval(checker);
                checker = null;
                interaction.channel.send(`🟥 Stopped`);
            } else {
                interaction.channel.send(`Not running`);
            }
            break;
        default:
            interaction.channel.send("Command does not exist");
    }
});

client.login(process.env.TOKEN);

const check = async () => {
    try {
        for (i = users.length - 1; i >= 0; i -= 1) {
            user = users[i];
            const { data: playerData } = await axios.get(
                `${baseRequestURL}/v1/user/nickname?query=${user}`,
                {
                    headers: { "x-api-key": process.env.BSER_API_KEY },
                }
            );

            if (playerData.code == 404) {
                subscribers.forEach((sub) => {
                    interaction.channel.send(
                        `${sub.toString()} Username ${user} no longer exists`
                    );
                });
                users.splice(i, 1);
            }
        }
    } catch (e) {}
};
