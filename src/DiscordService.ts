import { Client, RichEmbed } from 'discord.js';
import { DiscordMessage } from "./DTO/DiscordMessage";
import { DiscordController } from "./Controllers/DiscordController";
import { ContestService } from "./ContestService";
import { getClassColor, getMsgAuthorName } from "./Helpers/ChatMessageHelpers";

export class DiscordService {
    private readonly discordClient;
    private readonly token: string;
    private readonly controller: DiscordController;
    private readonly contestChannel: string;
    private readonly messageLifeTime: number;
    private readonly announcerIds: string[];

    constructor(contestService: ContestService, controller: DiscordController, discordClient: Client, token: string, contestChannel: string, announcerIds: string[]) {
        this.discordClient = discordClient;
        this.token = token;
        this.contestChannel = contestChannel;
        // It's not injectable, since DiscordService logic is highly couped with DiscordController
        this.controller = controller;
        this.announcerIds = announcerIds
        this.messageLifeTime = process.env.MESSAGE_LIFE_SPAN != undefined ? parseInt(process.env.MESSAGE_LIFE_SPAN) : 10000;
        this.setupHandlers();
    }

    private setupHandlers() {
        this.discordClient.on("message", msg => {
            if (msg.channel.name != this.contestChannel) {
                return;
            }

            if (msg.author.bot) {
                return;
            }

            let imageUrls: string[] = [];
            msg.attachments.forEach(attachment => {
                if (attachment.url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                    imageUrls.push(attachment.url);
                }
            });

            let parsedMessage = new DiscordMessage(
                msg.author.id,
                getMsgAuthorName(msg),
                msg.guild.id,
                msg.channel.id,
                msg.content,
                imageUrls
            );

            const isAnnouncer = this.announcerIds.some(id => id == msg.author.id)

            this.controller
                .dispatch(parsedMessage)
                .then(result => {
                    if (result.removeOriginalMessage) {
                        msg.delete(1).catch(reason => {
                            console.error("Unable to delete message in server " + msg.guild.name + ", reason: " + reason);
                        });
                    } else if (process.env.CONTEST_MODE == 'reactions' && !isAnnouncer) {
                        msg.react(process.env.VOTING_EMOTE || '🔥').catch(reason => {
                            console.error(`Unable to react message in server ${msg.guild.name}, reason: ${reason}`)
                        })
                    }

                    if (result.responseMessage) {
                        msg.channel
                            .send(result.responseMessage)
                            .then(m => m.delete(this.messageLifeTime));
                    }
                    if (result.syncMessageData) {
                        this.syncMessage(msg, isAnnouncer);
                    }
                });
        });
    }

    private syncMessage(msg, isAnnouncer: boolean) {
        const embed = new RichEmbed()
            .setAuthor(getMsgAuthorName(msg), msg.author.displayAvatarURL)
            .setDescription(msg.content)
            .setColor(getClassColor(msg.guild.id));

        if (msg.attachments.first() !== undefined) {
            embed.setImage(msg.attachments.first().url);
        }

        this.discordClient.guilds.forEach(function (guild) {
            if (guild.id !== msg.guild.id) {
                const channel = guild.channels.find(c => c.name == msg.channel.name);
                if (channel !== null) {
                    channel.send({ embed })
                        .then(msg => {
                            if (process.env.CONTEST_MODE == 'reactions' && !isAnnouncer) msg.react(process.env.VOTING_EMOTE || '🔥')
                        })
                        .catch(r => console.error("Unable to sync message or react on it at " + guild.name + ": " + r));
                }
            }
        });
    };

    start() {
        this.discordClient
            .login(this.token)
            .then(() => {
                console.info('Bot is up!');
            })
    }
}