/**
 * Snake Bot script.
 */
const MapUtils = require('../domain/mapUtils.js');

let log = null; // Injected logger
let prevDirection = '';

// CHECK SNAKESPATH ID ALIVE
// CHECK THEIR HEAD POSITION
// KEEP AWAY FROM OTHER SNAKES
// FIND CLOSEST PATH TO PIZZA AFTER WE REMOVED DANGER PATHS
// CHECK PATHS WITH LOT OF SPACE

// function hamiltonian(map) {
//     map.getWidth();
//     map.getHeight();
//     SizeType size = map->getSize();
//     Pos head = getHead(), tail = getTail();
//     Point::ValueType tailIndex = map->getPoint(tail).getIdx();
//     Point::ValueType headIndex = map->getPoint(head).getIdx();
//     // Try to take shortcuts when the snake is not long enough
//     if (bodies.size() < size * 3 / 4) {
//         list<Direction> minPath;
//         findMinPathToFood(minPath);
//         if (!minPath.empty()) {
//             Direction nextDirec = *minPath.begin();
//             Pos nextPos = head.getAdj(nextDirec);
//             Point::ValueType nextIndex = map->getPoint(nextPos).getIdx();
//             Point::ValueType foodIndex = map->getPoint(map->getFood()).getIdx();
//             headIndex = util::getDistance(tailIndex, headIndex, (Point::ValueType)size);
//             nextIndex = util::getDistance(tailIndex, nextIndex, (Point::ValueType)size);
//             foodIndex = util::getDistance(tailIndex, foodIndex, (Point::ValueType)size);
//             if (nextIndex > headIndex && nextIndex <= foodIndex) {
//                 direc = nextDirec;
//                 return;
//             }
//         }
// }
// Move along the hamitonian cycle
// headIndex = map->getPoint(head).getIdx();
// vector<Pos> adjPositions = head.getAllAdj();
// for (const Pos &adjPos : adjPositions) {
//     const Point &adjPoint = map->getPoint(adjPos);
//     Point::ValueType adjIndex = adjPoint.getIdx();
//     if (adjIndex == (headIndex + 1) % size) {
//         direc = head.getDirectionTo(adjPos);
//     }
// }



function chooseDirection (from, to) {
        Boolean up = false;
        Boolean right = false;
    if (from.x < to.x) {
        right = true;
    } else if (from.y < to.y) {
        up = true;
    }


    if (to.x - from.x < to.y - from.y) {
        if (right) {
            direction = 'RIGHT';
        } else {
            direction = 'LEFT';
        }
    } else {
        if (up) {
            direction = 'UP';
        } else {
            direction = 'DOWN';
        }
    }
}

}



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
    console.log(MapUtils.sortByClosestTo('food', myCoords));


    // Find possible directions
    directionsArray.forEach(function (dir) {
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


    map.getSnakeInfos().map(snakeInfo =>
        snakeInfo.getPositions().map((pos, index) => {
            let content = 'snakebody';

            if (index === 0) {
                content = 'snakehead';
            } else if (index === snakeInfo.getLength() - 1) {
                content = 'snaketail';
            }

            tiles[pos] = {
                content
            };

            console.log("Log content: ", content);

            return content;
        }));


    // 2. Do some nifty planning...
    // (Tip: see MapUtils for some off-the-shelf navigation aid.

    direction = findNextDirection(myCoords, map);
    // console.log(`KÖR HIT: ${direction}`);
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
