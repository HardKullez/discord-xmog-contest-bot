'use strict';

let dbm;
let type;
let seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('participants', {
    id: { type: 'int', primaryKey: true, autoIncrement: true},
    name: 'string',
    realm: 'string',
    imageUrl: 'string',
  });
};

exports.down = function(db) {
  return db.dropTable('participants');
};

exports._meta = {
  "version": 1
};
