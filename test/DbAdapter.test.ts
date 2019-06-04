import {expect} from "chai";
import {Database} from "sqlite3";
import {DbAdapter} from "../src/DbAdapter";

let db = new Database('./test-db.db3');
let adapter = new DbAdapter(db);

describe('Test DbAdapter', () => {
    it('creates a table', async () => {
        const result = await adapter.run("CREATE TABLE test(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT)");
        expect(result).to.be.undefined;
    });

    it('writes to a table with no placehoders', async () => {
        const result = await adapter.run('INSERT INTO test(title) VALUES ("Title")');
        expect(result).to.be.undefined;
    });

    it('writes to a table with a placehoder', async () => {
        const result = await adapter.run('INSERT INTO test(title) VALUES (?1)', {
            1: 'Another title'
        });
        expect(result).to.be.undefined;
    });

    it('gets on row from a table', async () => {
        const result = await adapter.one('SELECT * FROM test ORDER BY title');
        expect(result).to.have.deep.equal({
            id: 2,
            title: 'Another title'
        });
    });

    it('gets all rows from a table', async () => {
        const result = await adapter.all('SELECT * FROM test ORDER BY title');
        expect(result).to.have.deep.members([
            {
                id: 2,
                title: 'Another title'
            },
            {
                id: 1,
                title: 'Title'
            },
        ]);
    });

    it('returns empty result', async () => {
        const result = await adapter.one('SELECT * FROM test WHERE title = 1');
        expect(result).to.be.undefined;
    });

    it('returns empty resultset', async () => {
        const result = await adapter.all('SELECT * FROM test WHERE title = 1');
        expect(result.length).to.be.equal(0);
    });

    it('returns a value', async () => {
        const result = await adapter.value('SELECT title FROM test WHERE id = 1');
        expect(result).to.be.equal('Title');
    });
});