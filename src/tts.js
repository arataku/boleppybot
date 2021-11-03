let sdk = require("microsoft-cognitiveservices-speech-sdk");
const { demuxProbe, joinVoiceChannel, createAudioResource, createAudioPlayer, NoSubscriberBehavior, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require("@discordjs/voice");
const { Readable, PassThrough } = require("stream");
const msgformat = require("./msgformat");
const { createReadStream } = require("fs");
require("dotenv").config();

const env = process.env;

class Worker {
    constructor(client, voiceChannel, textChannel) {
        this.client = client;
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;

        this.connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guild.id,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
        });

        this.main();
    }

    async main() {
        this.player = createAudioPlayer();

        this.connection.on(VoiceConnectionStatus.Ready, () => {
            this.playSound("join");
        });

        this.client.on("messageCreate", message => {

            const { textChannel } = this;
            const { content } = message;
            const prefix = env.PREFIX;

            const text = msgformat.process(content);

            if (message.author.id === this.client.user.id) {
                return;
            }

            if (message.channel.id !== textChannel.id) {
                return;
            }

            if (message.content === (`${prefix}bole`)) {
                this.playSound("join");
            }

            if (content.startsWith(prefix)) {
                return;
            }

            if (content.startsWith(";")) {
                return;
            }

            console.log(`[Worker ${this.textChannel.id}] ${message.author.username}: ${content}`);


            synthesizeSpeech(text, async (buffer) => {
                const resource = await probeAndCreateResource(buffer)
                    .then(res => {
                        res.volume.setVolume(0.5);
                        return res;
                    });

                let player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Stop,
                    }
                });

                this.connection.subscribe(player);
                player.play(resource);
            })
        });
    }

    async playSound(name) {
        const sound = await probeAndCreateResource(createReadStream("src/res/" + name + ".mp3"));
        this.connection.subscribe(this.player);
        this.player.play(sound);
    }
}

async function synthesizeSpeech(text, callback) {

    const subscriptionKey = env.AZURE_TOKEN;
    const serviceRegion = "southeastasia";

    let speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.outputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    speechConfig.speechSynthesisVoiceName = "ja-JP-NanamiNeural";

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
    synthesizer.speakTextAsync(
        text,
        result => {
            synthesizer.close();
            if (result) {
                const { audioData } = result;
                const stream = new Readable();
                stream._read = () => { };
                stream.push(Buffer.from(audioData));
                stream.push(null);
                callback(stream);
            }
        },
        error => {
            console.log(error);
            synthesizer.close();
        }
    );
}

async function probeAndCreateResource(readableStream) {
    const { stream, type } = await demuxProbe(readableStream);
    return createAudioResource(stream, { inputType: type, inlineVolume: true });
}

module.exports = {
    Worker
};