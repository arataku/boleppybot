let sdk = require("microsoft-cognitiveservices-speech-sdk");
const { demuxProbe, joinVoiceChannel, createAudioResource, createAudioPlayer, NoSubscriberBehavior, StreamType, AudioPlayerStatus } = require("@discordjs/voice");
const { Readable, PassThrough } = require("stream");
const msgformat = require("./msgformat");
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

        client.on("messageCreate", message => {
            
            const { textChannel } = this;
            const { voiceChannel } = this;
            const { content } = message;

            const text = msgformat.process(content);

            if (message.author.id === this.client.user.id) {
                return;
            }

            if (message.channel.id !== textChannel.id) {
                return;
            }

            console.log(`${message.author.username}: ${content}`);

            async function probeAndCreateResource(readableStream) {
                const { stream, type } = await demuxProbe(readableStream);
                return createAudioResource(stream, { inputType: type });
            }

            const stream = synthesizeSpeech(text, async (buffer) => {
                const resource = await probeAndCreateResource(buffer);

                let player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Stop,
                    }
                });
    
                player.play(resource);
    
                this.connection.subscribe(player);
            })
        });
    }
}

async function synthesizeSpeech(text, callback) {

    const subscriptionKey = env.AZURE_TOKEN;
    const serviceRegion = "southeastasia";

    let speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.outputFormat = sdk.SpeechSynthesisOutputFormat.Raw8Khz16BitMonoPcm;
    speechConfig.speechSynthesisVoiceName = "ja-JP-NanamiNeural";

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
    synthesizer.speakTextAsync(
        text,
        result => {
            synthesizer.close();
            if (result) {
                const { audioData } = result;
                const stream = new Readable();
                stream._read = () => {};
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

module.exports = {
    Worker
};