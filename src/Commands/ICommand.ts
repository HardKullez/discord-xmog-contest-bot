import { IParticipantRepository } from "../Repositories/IParticipantRepository";
import { IVoteRepository } from "../Repositories/IVoteRepository";
import { Client } from "discord.js";

export default interface ICommand {
    name: string;
    participantRepository: IParticipantRepository;
    voteRepository: IVoteRepository;
    discordClient: Client;

    run(args: string[]);
}