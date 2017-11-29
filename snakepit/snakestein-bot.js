/**
 * Snake Bot script.
 */
const MapUtils = require('../domain/mapUtils.js');

let log = null; // Injected logger
let prevDirection = '';


// FIND POSSIBLE DIRECTIONS
/**
 * Get next direction
 * @param direction
 * @return direction
 */
function findNextDirection(myCoords, map) {
    // kontrollera vem som är närmst pizzan.
    let direction = 'UP';
    let nextDirection;
    const directionsArray = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const possibleDirections = [];

    // Find possible directions
    directionsArray.forEach((dir) => {
        if (MapUtils.canSnakeMoveInDirection(dir, myCoords, map)) {
            possibleDirections.push(dir);
            console.log(dir);
            direction = dir;
            prevDirection = dir;
        }
    });


    // //Find pizzas in direction
    // for (i = 0; i < possibleDirections.length; i++) {
    //     if (!MapUtils.getTileInDirection(possibleDirections[i], myCoords, map) === 'food') {
    //         direction = possibleDirections[i];
    //
    //         console.log('food HITTAD!!');
    //         break;
    //
    //     }
    //     console.log(MapUtils.getTileInDirection(possibleDirections[i], myCoords, map));
    // No pizzas in possible directions
    // }


    return direction;
}

function onMapUpdated(mapState, myUserId) {
    const map = mapState.getMap();
    let direction = 'DOWN'; // <'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>
    const snakeBrainDump = {}; // Optional debug information about the snakes current state of mind.

    // 1. Where's what etc.
    const myCoords = MapUtils.getSnakePosition(myUserId, map);

    log('I am here:', myCoords);
    snakeBrainDump.myCoords = myCoords;

    // 2. Do some nifty planning...
    // (Tip: see MapUtils for some off-the-shelf navigation aid.

    direction = findNextDirection(myCoords, map);
    const tiles = JSON.stringify(MapUtils.getOccupiedMapTiles(map));
    console.log(`MAPSHIT: ${tiles} \n`);

    // 3. Then shake that snake!
    return {
        direction,
        debugData: snakeBrainDump
    };
}

function bootStrap(logger) {
    log = logger;
}

function onGameEnded(event) {
    log('On Game Ended');
    log(event);
    // Implement as needed.
}

function onTournamentEnded(event) {
    log('On Tournament Ended');
    log(event);
    // Implement as needed.
}

function onSnakeDied(event) {
    log('On Snake Died');
    log(event);
    // Implement as needed.
}

function onGameStarted(event) {
    log('On Game Started');
    log(event);
    // Implement as needed.
}

function onGameResult(event) {
    log('On Game Result');
    log(event);
    // Implement as needed.
}

module.exports = {
    bootStrap,
    onGameEnded,
    onGameResult,
    onGameStarted,
    onMapUpdated,
    onSnakeDied,
    onTournamentEnded
};
