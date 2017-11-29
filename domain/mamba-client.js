/**
 * The Mamba Client is a Javascript client for the Snake Server.
 *
 * @param host the host
 * @param port the port
 * @param eventListener listener for game events
 * @param verboseLogging prints debug information
 * @returns {{prepareNewGame: registerPlayer, startGame: startGame, moveSnake: moveSnake, connect: connect}}
 * @constructor
 */
function Mamba(host, port, eventListener, verboseLogging) {
    const WebSocket = require('ws');
    const StringDecoder = require('string_decoder').StringDecoder;
    const DateFormat = require('dateformat');
    const EventBus = require('./mamba/eventBus.js');
    const RegisterPlayer = require('./mamba/registerPlayer.js');
    const PlayerRegistered = require('./mamba/playerRegistered.js');
    const StartGame = require('./mamba/startGame.js');
    const GameStartingEvent = require('./mamba/gameStartingEvent.js');
    const GameLinkEvent = require('./mamba/gameLinkEvent.js');
    const GameEndedEvent = require('./mamba/gameEndedEvent.js');
    const GameResultEvent = require('./mamba/gameResultEvent.js');
    const TournamentEndedEvent = require('./mamba/tournamentEndedEvent.js');
    const SnakeDeadEvent = require('./mamba/snakeDeadEvent.js');
    const MapUpdateEvent = require('./mamba/mapUpdateEvent.js');
    const HeartBeatRequest = require('./mamba/heartBeatRequest.js');
    const HeartBeatResponse = require('./mamba/heartBeatResponse.js');
    const RegisterMove = require('./mamba/registerMove.js');
    const ClientInfo = require('./mamba/clientInfo.js');

    // States
    const STATE_INIT = 'app_init';
    const STATE_REGISTER = 'game_register';
    const STATE_GAME_READY = 'game_ready';
    const STATE_GAME_STARTED = 'game_started';

    const HEART_BEAT_MS = 20 * 1000;

    const decoder = new StringDecoder('utf8');
    const eventBus = EventBus.new();
    let ws = null;

    let player = null;
    let currentState = STATE_INIT;
    let lastGameId = null;

    if (!host) {
        logError("No host you say? That's just plain rude you scurvy rebel!");
        return null;
    }

    if (!port) {
        logError("No port given, you sure are optimistic! I'm not.");
        return null;
    }

    if (!eventListener) {
        logError('Missing event listener...so I\'m supposed to talk to the hand yeah?');
        return null;
    }

    // Subscribe caller to the event bus
    eventBus.subscribe(eventListener);

    function connect(venue) {
        ws = new WebSocket(`ws://${host}${port ? `:${port}` : ''}/${venue}`);

        ws.on('open', () => {
            postConnect();
        });

        ws.on('onerror', () => {
            errorConnect();
        });

        ws.on('onclose', (err) => {
            console.log(err);
            errorConnect();
        });

        ws.on('message', (data, buffer) => {
            const json = decodeJson(buffer);
            if (json.type === HeartBeatResponse.type) {
                return; // Heart beats kept outside the game logic state machine.
            }
            switch (getCurrentState()) {
            case STATE_REGISTER:
                handleRegistrationDone(json);
                break;
            case STATE_GAME_READY:
                handleGameStart(json);
                break;
            case STATE_GAME_STARTED:
                handleGameEvent(json);
                break;
            default:
                break;
            }
        });

        return this;
    }

    function postConnect() {
        nextState();
        log(`Sssss...Connected to Snake Server on${host} [${port}]`);
        setInterval(sendHeartBeat, HEART_BEAT_MS);
        eventBus.publish({ type: 'CONNECTED', payload: null });
    }

    function errorConnect() {
        eventBus.publish({ type: 'ERROR', payload: 'WS connection error' });
    }

    function registerPlayer(userName, gameSettings) {
        checkState(STATE_REGISTER);
        const regPlayer = RegisterPlayer.new(userName, gameSettings);
        sendSocket(regPlayer.marshall());
    }

    function startGame() {
        checkState(STATE_GAME_READY);
        const clientInfo = ClientInfo.new();
        sendSocket(clientInfo.marshall());
        const starGameEvt = StartGame.new(player.getPlayerId());
        sendSocket(starGameEvt.marshall());
    }

    function moveSnake(direction, gameTick) {
        checkState(STATE_GAME_STARTED);
        sendSocket(RegisterMove.new(gameTick, direction, player.getPlayerId(), player.getGameId()).marshall());
    }

    function sendHeartBeat() {
        sendSocket(HeartBeatRequest.new(player.getPlayerId()).marshall());
    }

    function handleRegistrationDone(json) {
        player = PlayerRegistered.create(json);
        log(`Registration complete - ${player.getPlayerName()} (id:${player.getPlayerId()}) is now registered on ${player.getGameId()}`);
        nextState();
        eventBus.publish({ type: 'REGISTERED', payload: player });
    }

    function handleGameStart(json) {
        if (json.type === GameStartingEvent.type) {
            const gameStart = GameStartingEvent.create(json);
            log(`Game starting: ${gameStart.toString()}`);
            // Tournaments game ids are given at start.
            player.updateGameId(gameStart.getGameId());
            nextState();
        } else if (json.type === GameLinkEvent.type) {
            const event = { type: 'GAME_LINK', payload: GameLinkEvent.create(json) };
            eventBus.publish(event);
        } else {
            logError(`Illegal game start state, type: ${json.type}`);
        }
    }

    function handleGameEvent(json) {
        let event = null;
        if (json.type === MapUpdateEvent.type) {
            lastGameId = json.gameId;
            event = { type: 'GAME_MAP_UPDATED', payload: MapUpdateEvent.create(json) };
        } else if (json.type === GameEndedEvent.type) {
            event = { type: 'GAME_ENDED', payload: GameEndedEvent.create(json) };
        } else if (json.type === GameResultEvent.type) {
            event = { type: 'GAME_RESULT', payload: GameResultEvent.create(json) };
        } else if (json.type === TournamentEndedEvent.type) {
            event = { type: 'TOURNAMENT_ENDED', payload: TournamentEndedEvent.create(json) };
        } else if (json.type === GameStartingEvent.type) {
            event = { type: 'NEW_GAME_STARTED', payload: GameStartingEvent.create(json) };
            player.updateGameId(event.payload.getGameId());
        } else if (json.type === SnakeDeadEvent.type) {
            event = { type: 'GAME_SNAKE_DEAD', payload: SnakeDeadEvent.create(json) };
        } else {
            event = { type: 'ERROR', payload: 'Unknown game event' };
        }
        log(event.payload.toString());
        eventBus.publish(event);
    }

    function getCurrentState() {
        log(`Current state: ${currentState}`);
        return currentState;
    }

    function checkState(state) {
        if (getCurrentState() != state) {
            throw new Error('Illegal state for requested action');
        }
    }

    function nextState() {
        switch (getCurrentState()) {
        case STATE_INIT:
            currentState = STATE_REGISTER;
            break;
        case STATE_REGISTER:
            currentState = STATE_GAME_READY;
            break;
        case STATE_GAME_READY:
            currentState = STATE_GAME_STARTED;
            break;
        }
        return getCurrentState();
    }

    function decodeJson(payload) {
        const json = JSON.parse(decoder.write(payload.buffer));
        logDump(json);
        return json;
    }

    function sendSocket(payload) {
        const json = JSON.stringify(payload);
        log(`Sending >> ${json}`);
        ws.send(json);
    }

    function log(message) {
        if (verboseLogging) {
            console.log(`${getFormattedTime(new Date())} - MAMBA INFO - ${message}`);
        }
    }

    function logError(message) {
        console.log(`${getFormattedTime(new Date())} - MAMBA ERROR - ${message}`);
    }

    function logDump(obj) {
        if (verboseLogging) {
            console.log(`${getFormattedTime(new Date())} - MAMBA INFO - `, obj);
        }
    }

    function getFormattedTime(date) {
        return DateFormat(date, 'HH:MM:ss.l');
    }

    return {
        prepareNewGame: registerPlayer,
        startGame,
        moveSnake,
        connect
    };
}

module.exports = Mamba;
