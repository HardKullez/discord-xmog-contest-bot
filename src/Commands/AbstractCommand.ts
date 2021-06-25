import { IParticipantRepository } from "../Repositories/IParticipantRepository";
import { Client } from 'discord.js';
import { IDbAdapter } from "../IDbAdapter";
import { IVoteRepository } from "../Repositories/IVoteRepository";

export default class AbstractCommand {
    public participantRepository: IParticipantRepository;
    public voteRepository: IVoteRepository;
    public discordClient: Client;
    public db: IDbAdapter;
}