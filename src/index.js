"use strict";

// pull in the required packages.
const { Client, Intents } = require("discord.js");
const { Worker } = require("./tts")
require("dotenv").config();

const env = process.env;

const prefix = ".";

const client = new Client({ intents: Object.keys(Intents.FLAGS) });

let Workers = [];

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", message => {
	if (message.content === (`${prefix}bp ping`)) {
		message.channel.send('Pong.');
	}

    if (message.content === (`${prefix}bp`)) {
        const voiceChannel = message.member.voice.channel;
        const textChannel = message.channel;
        Workers.push(new Worker(client, voiceChannel, textChannel));
        console.log(`${Workers.length}`)
    }
});

client.login(env.DISCORD_TOKEN);

/* 
const subscriptionKey = env.AZURE_TOKEN;
const serviceRegion = "southeastasia";

let speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
speechConfig.speechRecognitionLanguage = "ja-JP";
speechConfig.speechSynthesisVoiceName = "Microsoft Server Speech Text to Speech Voice (ja-JP, Haruka)";

const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

function getAudioStream(text) {
    let result = new Promise((resolve, reject) => {
        let result = synthesizer.speakTextAsync(text);
        result.onSuccess = function (result) {
            resolve(result);
        }
    })
}

 */