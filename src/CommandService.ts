import * as commands from "./Commands";
import { IParticipantRepository } from "./Repositories/IParticipantRepository";
import { IVoteRepository } from "./Repositories/IVoteRepository";
import { Client } from "discord.js";
import ICommand from "./Commands/ICommand";
import { IDbAdapter } from "./IDbAdapter";

export class CommandService {

    private commands: Map<string, ICommand>;

    constructor(participantRepository: IParticipantRepository, voteRepository: IVoteRepository, discordClient: Client, db: IDbAdapter) {
        this.commands = new Map<string, ICommand>();
        for (let commandsKey in commands) {
            let object = new commands[commandsKey];
            object.participantRepository = participantRepository;
            object.voteRepository = voteRepository
            object.discordClient = discordClient;
            object.db = db;
            this.commands.set(object.name, object);
        }
    }

    public run(command: string, args: string[]) {
        let handler = this.commands.get(command);
        if (!handler) {
            let commandNames: string[] = []
            this.commands.forEach(c => commandNames.push(c.name))

            console.error("No such command: " + command);
            console.warn('Available commands: ' + commandNames.join(', '))
            process.exit(0)
        }

        handler.run(args);
    }
}