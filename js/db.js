const { MongoClient } = require("mongodb");
let uri =
  "mongodb+srv://gromp:" +
  process.env.mongodbGrompPassword +
  "@cluster0.3fgtx.azure.mongodb.net/" +
  process.env.mongodbGrompDatabaseName +
  "?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function dbConnect() {
  try {
    // Connect to the MongoDB cluster
    await client.connect();
    return client;
  } catch (e) {
    console.error(e);
  }
}

async function insert_in_database(champName, channelId, serverId) {
    const mainFunctions = require("./main"); // refactor code so this only needs to be inserted once.
    let playerExists = await mainFunctions.get_player_id(champName, channelId, "insert");
    if(playerExists == -1){
        // message sent in get_player_id function in main.js
        return;
    }
    col = await client.db("gromp").collection("grompUsers");
    var cursor = await col.findOne( {_id: serverId});
    for(let i = 0; i < cursor.champNames.length; i++){
        if(cursor.champNames[i] == champName){
            mainFunctions.bot.channels.cache.get(channelId).send("That summoner is already registered!");
            return;
        }
    }
  await col.updateOne(
    { _id: serverId },
    {
      $push: { champNames: champName },
    },
    { upsert: true }
  );
  mainFunctions.bot.channels.cache.get(channelId).send(champName + " has been registered!");
}

async function delete_from_database(champName, channelId, serverId){
    const mainFunctions = require("./main"); // refactor code so this only needs to be inserted once.
    col = await client.db("gromp").collection("grompUsers");
    var cursor = await col.findOne( {_id: serverId});
    if(!cursor.champNames.includes(champName)){
        mainFunctions.bot.channels.cache.get(channelId).send("That summoner has not been registered yet!");
    }
    else{
        await col.updateOne(
            { _id: serverId },
            {
              $pull: { champNames: champName },
            },
            { upsert: true }
          );
        mainFunctions.bot.channels.cache.get(channelId).send(champName + " has been removed!");
    }
}

module.exports = {
  dbConnect,
  insert_in_database,
  delete_from_database
};
