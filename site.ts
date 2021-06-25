import { config as dotenvInit } from 'dotenv';
import { Database } from "sqlite3";
import { SqliteDbAdapter } from "./src/SqliteDbAdapter";
import SiteService from "./src/SiteService";
import { VoteRepository } from './src/Repositories/VoteRepository';
import { ParticipantRepository } from './src/Repositories/ParticipantRepository';

dotenvInit();

let db = new Database('./prod-db.db3');
let adapter = new SqliteDbAdapter(db);
let participantRepository = new ParticipantRepository(adapter)
let voteRepository = new VoteRepository(adapter)
let siteService = new SiteService(participantRepository, voteRepository, adapter);

siteService.start();