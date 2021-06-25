import ICommand from "./ICommand";
import AbstractCommand from "./AbstractCommand";
import { Collection, Message, MessageReaction, Snowflake, TextChannel, User } from "discord.js";
import { Vote } from "../Models/Vote";

export default class CollectContestVotes extends AbstractCommand implements ICommand {
  name: string = 'collect-contest-votes';

  async run(args: string[]) {
    if (process.env.CONTEST_MODE != 'reactions') {
      console.warn('Command is available in reactions mode only')
      process.exit(0)
    }

    const contestChannels = this.discordClient.guilds.map(guild => {
      if (!guild.available) {
        console.warn(`Guild ${guild.name} is unavailable, please try again later`)
        process.exit(0)
      }
      const channel = guild.channels.find(c => c.name == process.env.CONTEST_CHANNEL_NAME);
      if (channel !== null) return channel
    }).filter(channel => channel != undefined);

    await this.db.run('DELETE FROM votes')

    for (let channel of contestChannels) {
      console.log(`Collecting votes from ${channel.guild.name}...`)
      const messageCollection = await this.parseChannel(<TextChannel>channel)
      console.log('Messages parsed: ', messageCollection.size)
      const voteReactions = this.parseMessages(messageCollection)
      await this.collectGuildVotes(voteReactions)
    }

    process.exit(0)
  }

  private async parseChannel(channel: TextChannel, before?: Snowflake): Promise<Collection<string, Message>> {
    let result: Collection<string, Message> = new Collection
    const messageCollection = await channel.fetchMessages({ before })
    result = result.concat(messageCollection)

    if (messageCollection.size == 50) {
      const lastMessageID = messageCollection.last().id
      const rest = await this.parseChannel(channel, lastMessageID)
      result = result.concat(rest)
    }

    return result
  }

  private parseMessages(messages: Collection<string, Message>): MessageReaction[] {
    const validMessages = messages.filter(msg => {
      const voteReactions = msg.reactions.get(process.env.VOTING_EMOTE)
      return voteReactions && voteReactions.count > 1 && voteReactions.me
    })

    const voteReactions = validMessages.map(msg => msg.reactions.get(process.env.VOTING_EMOTE))

    return voteReactions
  }

  private async collectGuildVotes(reactions: MessageReaction[]) {
    for (let reaction of reactions) {
      const message = reaction.message.author.bot ? reaction.message.embeds[0].description : reaction.message.content
      const [name, realm] = message.split('-')
      const participant = await this.participantRepository.getParticipant(name, realm)
      if (!participant) continue

      const userCollection = await this.fetchReactionUsers(reaction).then(users => users.filter(user => !user.bot))

      userCollection.tap(async voter => {
        if (participant.discordUserId == voter.id) return

        const vote = new Vote(null, voter.id, participant.id, voter.username)
        const isVoteExists = await this.voteRepository.isVoteExists(vote)

        if (isVoteExists) return

        this.voteRepository.addVote(vote).catch(reason => console.error(reason))
      })
    }
  }

  private async fetchReactionUsers(reaction: MessageReaction, after?: Snowflake): Promise<Collection<string, User>> {
    let result: Collection<string, User> = new Collection
    const userCollection = await reaction.fetchUsers(100, { after: <any>after })
    result = result.concat(userCollection)

    if (userCollection.size == 100) {
      const rest = await this.fetchReactionUsers(reaction, userCollection.last().id)
      result = result.concat(rest)
    }

    return result
  }
}