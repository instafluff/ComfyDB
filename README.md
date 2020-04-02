[![Build Status](https://travis-ci.com/instafluff/ComfyDB.svg?branch=master)](https://travis-ci.com/instafluff/ComfyDB)

# ComfyDB
The Comfiest Way to Use a Database

**ComfyDB** is a ***SUPER EASY AND INTUITIVE*** interface to a database *(Currently supports MongoDB)* so you don't have to keep looking up the documentation.

ComfyDB abstracts away the specific syntax for working with databases so that it's intuitive and easy to use for common scenarios while benefitting from search, performance, redudancy of a full-fledged database.

It also takes care of mundane tasks like setting and maintaining `createdAt` and `updatedAt` fields for each object entry.

```javascript
await ComfyDB.Store( "user1", { username: "Instafluff", profile: "Comfiest Coder and Mug Chef!", cakes: 0 } );
await ComfyDB.Get( "user1" );

await ComfyDB.Search( { sortBy: "createdAt", sort: "desc", limit: 5, start: 10, where: { author: { beginsWith: "instaf" } } }, "blog-posts" );
await ComfyDB.Count( { where: { text: { contains: "lasagna" } } }, "blog-posts" );

await ComfyDB.Increment( "cakes", { by: 2, where: { username: { equals: "instafluff" } } } );
await ComfyDB.Decrement( "hitpoints", { by: 30, where: { party: { equals: "A" } } }, "game-stats" );

await ComfyDB.Delete( "item_42" );
await ComfyDB.DeleteAll( { where: { isEnemy: { is: true }, hitpoints: { "<": 0 } } }, "game-stats" );
```

## Instafluff ##
> *Like these projects? The best way to support my open-source projects is by becoming a Comfy Sponsor on GitHub!*

> https://github.com/sponsors/instafluff

> *Come and hang out with us at the Comfiest Corner on Twitch!*

> https://twitch.tv/instafluff

#### ComfyDB Requirements
ComfyDB requires a MongoDB instance to connect to.

Here are three ways for you to setup an instance of MongoDB:

1. Run a self-contained instance running on NodeJS via [ComfyMongoDB](https://www.github.com/instafluff/ComfyMongoDB) *(Recommended for developers)*
2. Install [MongoDB Community Edition](https://docs.mongodb.com/manual/administration/install-community/) as a service on your computer *(Recommended for beginners)*
3. Use a cloud-hosted MongoDB instance with [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) *(Recommended for companies and production)*

## Instructions ##
1. Install `comfydb`
```
npm install comfydb --save
```

2. Connect to a MongoDB database and store, retrieve, search data
```javascript
const ComfyDB = require( "comfydb" );
// Wrap in async for back-compat in case top-level async/await is not supported
(async () => {
    try {
        await ComfyDB.Connect( { url: "mongodb://localhost:27017", dbname: "ComfyDB" } );

        // Sample users
        await ComfyDB.Store( "user1", { username: "Instafluff", website: "https://www.instafluff.tv", profile: "Comfiest Coder and Mug Chef!" } );
        await ComfyDB.Store( "user2", { username: "Fluffington", profile: "Fluffy, Yellow, Hamsterbear." } );
        await ComfyDB.Store( "user3", { username: "Teapup", profile: "Semi-licensed rainbow skittle tricycle pupper. I'm the greatest!" } );

        // Get user3
        let user3 = await ComfyDB.Get( "user3" );
        console.log( user3 );

        // Get all users with "fluff" in the username
        let fluffUsers = await ComfyDB.Search( { sortBy: "username", sort: "asc", where: { username: { contains: "fluff" } } } );
    	console.table( fluffUsers );
    }
    catch( err ) {
        console.error( err );
    }
})();
```

## Functions ##

```javascript
// --- Configuration ---

// Connect to a database on MongoDB
await ComfyDB.Connect( options = { url: "mongodb://localhost:27017", dbname: "comfyDB" } );

// Check if we are connected to a database
ComfyDB.IsConnected();

// Close connection to the database
ComfyDB.Close();



// --- Data ---

// Insert/Update JSON object entry by key (e.g. userID, username, timestamp, ... )
await ComfyDB.Store( key, data, collection = "ComfyDefault" ); // ComfyDB.Save() also works

// Retrieve object entry by key
await ComfyDB.Get( key, collection = "ComfyDefault" );

// Retrieve array of object entries based on search options
await ComfyDB.Search( options = { sortBy: "createdAt", sort: "asc", limit: 100, start: 0, where: null, key: null }, collection = "ComfyDefault" );

// Delete object entry by key
await ComfyDB.Delete( key );

// Delete object entries based on search options
await ComfyDB.DeleteAll( options = { where: null, key: null }, collection = "ComfyDefault" );

// Increment a field in object entries matching search options
await ComfyDB.Increment( field, options = { where: null, key: null }, collection = "ComfyDefault" );

// Decrement a field in object entries matching search options
await ComfyDB.Decrement( field, options = { where: null, key: null }, collection = "ComfyDefault" );

// Count the number of object entries matching search options
await ComfyDB.Count( options = { where: null, key: null }, collection = "ComfyDefault" );



// --- Collections ---

// Get a full list of collections
await ComfyDB.Collections();

// Check if a collection exists
await ComfyDB.HasCollection( collection );

// Delete a collection
await ComfyDB.DeleteCollection( collection );
```

## How to Use Search Options ##
Defining the search conditions for ComfyDB functions is done by setting up a configuration object.

#### Search Options Fields ####
  - **sortBy** (orderBy) *(Only in **ComfyDB.Search**)*
    - The name of the stored data object entry's field to use for the sort. Defaults to `createdAt`.
  - **sort** *(Only in **ComfyDB.Search**)*
    - `asc` or `desc` for ascending or descending sort based on the `sortBy` field. Defaults to `asc`.
  - **limit** (count) *(Only in **ComfyDB.Search**)*
    - Maximum number of results, used for pagination. Defaults to `100`.
  - **start** *(Only in **ComfyDB.Search**)*
    - Starting index for the results, used for pagination. Defaults to `0`.
  - **by** *(Only in **ComfyDB.Increment** and **ComfyDB.Decrement**)*
    - Amount to increment or decrement the field's value by for all matching data object entries. Defaults to `1`.
  - **where**
    - Refines the search based on values inside the stored data object entries. Defaults to `null`.

#### Where Object ####
The inner `where` object helps fine-tune the search based on aspects of the stored data object entries.

All keys inside this object adds to the search conditions (e.g. `username`) using a search operator (e.g. `equals`). Keys are case-sensitive. Operators are not case-sensitive.

**Operators**
  - **equals** (eq, equal, equals, is, isEqual, isequalto, =)
  - **not** (ne, notequals, notequal, doesntequal, isnot, isnt, isnotequal, isnotequalto, !, !=, <>)
  - **before** (lessthan, lt, <)
  - **after** (after, greaterthan, gt, >)
  - **contains** (includes)
  - **startsWith** (starts, begins, beginswith, prefix)
  - **endsWith** (ends, suffix)

#### Search Option Examples ####

```javascript
// Retrieving the most recent 5 entries where the score is higher than 50 points
let scores = await ComfyDB.Search( { sortBy: "updatedAt", sort: "desc", limit: 5, start: 0, where: { score: { ">": 50 } } } );

// Decrementing hitpoints for all of party A's members in the Game-Stats collection
await ComfyDB.Decrement( "hitpoints", { by: 30, where: { party: { equals: "A" } } }, "game-stats" );

// Deleting all enemies with HP < 0 in the Game-Stats collection
await ComfyDB.DeleteAll( { where: { isEnemy: { is: true }, hitpoints: { "<": 0 } } }, "game-stats" );
```

## Credits ##
Thank you too all the participants of this project!

**DutchGamer46, Instafluff, Instafriend, ChatTranslator, SourBeers, zivivi1, That_MS_Gamer, jjanders85, simrose4u, Kyoslilmonster, sparky_pugwash, i_am_from_mars, julieee22, codingkatie, jellydance, LilyHazel, lewdmelon, Luxadin_, FuriousFur, sethorizer, Ella_Fint, DEAD_P1XL, Psychosys82, malfunct, UppahahAA, Stay_Hydrated_Bot, holloway87, RIKACHET, SullyGnome, Gyrojett, roberttables, ReaperofTerror, BigShoe, GoonPontoon, dot_commie, retro_crt, rhonin52, Clarkio, mholloway24, ObsidianTalon, jFeliWeb, Maayainsane, LuckyFeathersGames, WolvesGamingDen, adamisbest1231, otistav, AccordingToBo, TheHugoDahl, CodeRushed, grassgrow, EndlessMoonfall, AntiViGames, nopogo_tv, smilesandtea, Clearest_Sky, tinybolt9889, falco_online, DrJavaSaurus, MsSaltyGiggles, poppybox, infinitepharaoh_, merkurrz, jawibae, EvilCanadian, cmjchrisjones, theLeprosyy, Alca, Schattenheld0u0, codephobia, Zuulmofo, Granah, Cj_crew, donaldwm, Jwh1o1, ThatNerdViolet, phrakberg, phoenixfirewingz, Aririal, BungalowGlow**

Thanks to everyone that helped design the ComfyDB functions!

**MacABearMan, wietlol, Ella_Fint, EarthToRaymond, Danicron5, That_MS_Gamer, Gilokk0, Deitypotato, Instafluff, Alca, DutchGamer46, Instafriend, ChatTranslator, sethorizer, LuRiMer313, losthewar, TheHugoDahl, sayomgwtf, simrose4u, oomariaoo, LilyHazel, Eolios, CriticalKnit, MerlinLeWizard, Breci, smilesandtea, nallaj, codephobia, sausage_toes, DEAD_P1XL, Talk2meGooseman, Stay_Hydrated_Bot, merkurrz, BooobieTrap, codingkatie, DevMerlin, DarrnyH, BaconBastrd, JamesFiteMeIRL, Luxadin_, stresstest, sparky_pugwash, adamisbest1231, MsSaltyGiggles, SourBeers, neniltheelf, napkats, apocalypse28064212, DeeNugLife, HeyOhKei, BEARabilityPH, jjanders85, RIKACHET, LANiD, ItsLittany, lukepistachio, Jikochi, julieee22, Underground_Violet_Doggo, MrLiveCrash, tiger_k1ng, EndlessMoonfall, ItsTheRealKaz, MisakaGUN, Hardcore_Henny, Psychosys82, TERENCEBE, Jwh1o1, jawibae, MalForTheWin, gamemodeon232, Lunnaku, itsDeke**

Thank you to everyone who helped make ComfyDB searchable and sortable!

**That_MS_Gamer, MacABearMan, Instafluff, Gilokk0, Instafriend, ChatTranslator, Neo_TA, sethorizer, Optik_Nerve, TheGeekGeneration, Alca, guthron, TheHugoDahl, pipskidoodle, sayomgwtf, NorthernAurora2018, ExactlyMay, simrose4u, donaldwm, HonestDanGames, csharpfritz, holloway87, MsSaltyGiggles, LuRiMer313, jawibae, merkurrz, BeaverBoyB, LilyHazel, arnab345madd, SourBeers, Msomele, chiderzz, SaltPrincessGretchen, MalForTheWin, EgoAnt, nallaj, Stay_Hydrated_Bot, RiotMakr, DutchGamer46, Underground_Violet_Doggo, Eolios, smilesandtea, DarrnyH, pookiepew, gamesaregreat808, JBRedPhoenix, CyberNinjaGaming_UK, sparky_pugwash, koralina211, roberttables, DevMerlin, lewdmelon, sorskoot, CodeNJoy, Succatash, SimmeringSoupPot, FuriousFur, zivivi1, DEAD_P1XL, Dreadoosa, Jadro02, filipmanzi, Shaggz13, Luxadin_, minxyrose, Psychosys82, danteundersaturn, KitAnnLIVE, thegooseofwild**

Thank you to everyone who helped build the first working version 1.0.1!

**MacABearMan, Instafriend, LilyHazel, Instafluff, Gilokk0, ChatTranslator, That_MS_Gamer, fydo, wietlol, simrose4u, ArliGames, Dreadoosa, roberttables, donaldwm, sethorizer, csharpfritz, TheHugoDahl, ancientcoder, theMichaelJolley, mordzuber, mholloway24, Stelzi79, Thrennenne, AndresAmaris, sorskoot, Grid21, SvavaBlount, nallaj, itsDeke, pipskidoodle, DutchGamer46, violettepanda, sparky_pugwash, FuriousFur, MerlinLeWizard, Bjwhite211, bachner, DevMerlin, senatorcalder, julieee22, KitAnnLIVE, MatthewDGroves, BungalowGlow, smilesandtea, Undinen, Underground_Violet_Doggo, DEAD_P1XL, ShadowNeverSeen, LANiD, Kyoslilmonster, pookiepew, gekophetweb, Kevin_C_Melsop, FulltimeDreamer_, Ob_stealth1, KassidyKW18, Cold_Earth_, theluckyseven17, julian992, MinoGozzo, imjustafnagirl, twdjesuslover, phoenixfirewingz, the7goonies, quqco, Emily_is_PogChamp, silverpocket51, SleepyMia, thementalcobra, kev40k, MLGBlackbeard, apoketo, Tomcii, JonGood, Miffyasha, SIeepyMia, KageNoTsuma, dragonhyperking, TheHungerService, ExactlyMay, adamisbest1231, Alca, WolvesGamingDen, harugawada, Luxadin_, swolemaz, CorrelR, hug3fan14, Jwh1o1, CriticalKnit, malfunct, mofumoku, gamemodeon232, bscolaro, HologramDream, EnesOzdemirTV, lewdmelon, Xalent, Maayainsane, Lander03xD, rotaidar, Cloudhun, Rosuav, SoG_Cuicui, GlitterholicDreamz, fikapaus, shadowcraft5, TheJollyMercenaryArt, superandi23, holloway87, AllanJLA, SodarCZ, HeyOhKei, TheSkiDragon, DarrnyH, shinageeexpress, AP4TV, Chibigirl24**

Thank you to all the friends who helped redesign ComfyDB into its v2 form!

**TODO: Need to Get Chatters List from Instafluff Stream March 31, 2020**
