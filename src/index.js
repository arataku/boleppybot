"use strict";

// pull in the required packages.
const { Client, Intents } = require("discord.js");
const { Worker } = require("./tts");
require("dotenv").config();

const env = process.env;

const prefix = env.PREFIX;

const client = new Client({ intents: Object.keys(Intents.FLAGS) });

let Workers = [];

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", message => {

    if (message.content === (`${prefix}bp`)) {
        const voiceChannel = message.member.voice.channel;
        const textChannel = message.channel;
        if (Workers.find(worker => worker.voiceChannel === voiceChannel) || Workers.find(worker => worker.textChannel === textChannel)) {
            return;
        }
        Workers.push(new Worker(client, voiceChannel, textChannel));
        console.log(`${Workers.length}`);
    }

    if (message.content === (`${prefix}bye`)) {
        const target = Workers.find(worker => worker.textChannel.id === message.channel.id);
        target.connection.disconnect();
        Workers.splice(Workers.indexOf(target), 1);
        console.log(`${Workers.length}`);
    }
});

client.login(env.DISCORD_TOKEN);
