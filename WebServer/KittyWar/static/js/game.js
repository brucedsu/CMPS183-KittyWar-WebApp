var player_cat          = null;
var player_cat_health   = 10;
var player_abilities    = [];
var player_chance_cards = [];  // array of ids

var opponent_cat = null;
var opponent_cat_health = 10;

// Global Web Socket
var socket = null;

$(document).ready(function() {

    // Automatically connect to the game server
    connect();

    $("#find-match-button").click(find_match);
    $("#select-cat-confirm-button").click(confirm_selected_cat);

    $("#find-match-view").show();
    $("#select-cat-view").hide();
    $("#opponent-view").hide();
    $("#player-view").hide();
    $("#arena-view").hide();
});

function connect() {

    log("Connecting to game server...");
    log("Token: " + token);
    log("User ID: " + user_id);

    // Create WebSocket connection.
    socket         = new WebSocket('ws://localhost:2056');
    socket.binaryType = 'arraybuffer';

    socket.onopen  = server_open;
    socket.onerror = server_error;
    socket.onclose = server_close;

    // Listen for server messages
    socket.addEventListener('message', receive_packet);
}

function server_open() {
    log("Connection established");
}

function server_error(error) {
    log("Connection error");
}

function server_close() {
    log("Connection closed");
}

function log(server_message) {

    server_message = "\n" + server_message + "\n";

    var server_log = $("#server-log");
    server_log.val(server_log.val() + server_message);
}

// game phases
var PHASE_BEFORE_GAME         = 0;
var PHASE_PRELUDE             = 1;
var PHASE_ENACTING_STRATEGIES = 2;
var PHASE_SHOWING_CARDS       = 3;
var PHASE_STRATEGY_SETTLEMENT = 4;
var PHASE_POSTLUDE            = 5;

function phase_to_string(phase) {
    switch (phase) {
        case PHASE_BEFORE_GAME:
            return "Before Game";
        case PHASE_PRELUDE:
            return "Prelude";
        case PHASE_ENACTING_STRATEGIES:
            return "Enacting Strategies";
        case PHASE_SHOWING_CARDS:
            return "Showing Cards";
        case PHASE_STRATEGY_SETTLEMENT:
            return "Strategy Settlement";
        case PHASE_POSTLUDE:
            return "Postlude";
        default:
            return "Unknwon Phase";
    }
}

var current_phase = PHASE_BEFORE_GAME;

function start_next_phase() {
    if (player_cat != null && opponent_cat != null) {
        // loosing condition
        if (player_cat_health == 0 || opponent_cat_health == 20) {
            alert("You lost! Good game, well played!");
            return;
        }

        // winning condition
        if (player_cat_health == 20 || opponent_cat_health == 0) {
            alert("You won! You are awesome!");
            return;
        }
    }

    if (current_phase == PHASE_POSTLUDE) {
        current_phase = PHASE_PRELUDE;

        // reset some labels
    } else {
        current_phase = current_phase + 1;
    }

    if (current_phase == PHASE_PRELUDE) {
        $("#opponent-selected-move-and-chance").empty();
        $("#player-selected-move-and-chance").empty();
        $("#player-used-ability-image").hide();
    }

    $("#game-phase").text("Game phase: " + phase_to_string(current_phase));

    alert(phase_to_string(current_phase) + " started!");
}

// flags
var FLAG_WEB_LOGIN                = 10;
var FLAG_FIND_MATCH               = 2;
var FLAG_USER_PROFILE             = 3;
var FLAG_ALL_CARDS                = 4;
var FLAG_CAT_CARDS                = 5;
var FLAG_BASIC_CARDS              = 6;
var FLAG_CHANCE_CARDS             = 7;
var FLAG_ABILITY_CARDS            = 8;
var FLAG_END_MATCH                = 9;
var FLAG_NEXT_PHASE               = 98;
var FLAG_READY                    = 99;
var FLAG_SELECT_CAT               = 100;
var FLAG_OPPONENT_SELECTED_CAT    = 49;
var FLAG_USE_ABILITY              = 101;
var FLAG_GAIN_HP                  = 50;
var FLAG_OPPONENT_GAIN_HP         = 51;
var FLAG_DAMAGE_MODIFIED          = 52;
var FLAG_OPPONENT_DAMAGE_MODIFIED = 53;
var FLAG_GAIN_CHANCE              = 54;
var FLAG_OPPONENT_GAIN_CHANCE     = 55;
var FLAG_GAIN_ABILITY             = 56;
var FLAG_GAIN_CHANCES             = 57;
var FLAG_SELECT_MOVE              = 102;
var FLAG_SELECT_CHANCE            = 103;
var FLAG_REVEAL_MOVE              = 58;
var FLAG_REVEAL_CHANCE            = 59;
var FLAG_SPOTLIGHT                = 60;
var FLAG_OPPONENT_SPOTLIGHT       = 61;

// basic moves
var MOVE_PURR    = 0;
var MOVE_GUARD   = 1;
var MOVE_SCRATCH = 2;
var MOVE_SKIP    = 3;

var finding_match = false;

function find_match() {
    if (!finding_match) {
        finding_match = true;

        // update UI to indicate user
        $("#find-match-status").text("Finding match...");

        // send web login packet
        send_packet(FLAG_WEB_LOGIN, token, user_id);

        // send find match packet
        send_packet(FLAG_FIND_MATCH, token, null);
    }
}

var selected_cat_id = -1;

function select_cat(cat_id) {
    selected_cat_id = cat_id;
    $('#select-cat-status').text(`Selected ${available_cats[selected_cat_id].title}`);
}

function confirm_selected_cat() {
    if (selected_cat_id < 0) return;

    send_packet(FLAG_SELECT_CAT, token, selected_cat_id);
}

function update_player_chance_card_list() {
    // remove all chance cards first
    $("#player-view-chance-card-list").empty();

    var idx;
    var chance_card_id;

    for (idx = 0; idx < player_chance_cards.length; idx++) {
        chance_card_id = player_chance_cards[idx];

        if (chance_card_id == -1) continue;

        $("#player-view-chance-card-list").append(
            `<span onclick="use_chance_card(${chance_card_id})">` +
            `<img src="/static/chance/${chance_cards[chance_card_id].title}.jpg" height="150" width="110" />` +
            `</span>`);
    }
}

function ready() {
    send_packet(FLAG_READY, token, null);
}

var selected_move_id = -1;

function select_move(move_id) {
    selected_move_id = move_id;

    send_packet(FLAG_SELECT_MOVE, token, selected_move_id);
}

var used_ability_id = -1;

function use_ability(player_ability_index) {
    var ability = player_abilities[player_ability_index];
    used_ability_id = ability.id;

    send_packet(FLAG_USE_ABILITY, token, used_ability_id);
}

function move_to_string(move_id) {
    switch (move_id) {
    case MOVE_PURR:
        return "Purr";
    case MOVE_GUARD:
        return "Guard";
    case MOVE_SCRATCH:
        return "Scratch";
    case MOVE_SKIP:
        return "Skip";
    default:
        return "Unknown move";
    }
}

var selected_chance_card_id = -1;

function use_chance_card(chance_card_id) {
    selected_chance_card_id = chance_card_id;

    send_packet(FLAG_SELECT_CHANCE, token, selected_chance_card_id);
}

function handle_packet(flag, body) {
    var idx = 0;

    switch (flag) {
    case FLAG_WEB_LOGIN:
        break;
    case FLAG_FIND_MATCH:
        // show select cat view
        $("#select-cat-view").show();

        // hide other views
        $("#find-match-view").hide();
        $("#opponent-view").hide();
        $("#player-view").hide();
        $("#arena-view").hide();
        break;
    case FLAG_USER_PROFILE:
        break;
    case FLAG_ALL_CARDS:
        break;
    case FLAG_CAT_CARDS:
        break;
    case FLAG_BASIC_CARDS:
        break;
    case FLAG_CHANCE_CARDS:
        break;
    case FLAG_ABILITY_CARDS:
        break;
    case FLAG_END_MATCH:
        break;
    case FLAG_NEXT_PHASE:
        if (current_phase == PHASE_BEFORE_GAME) {  // setup game
            $("#select-cat-view").hide();
            $("#find-match-view").hide();

            $("#opponent-view").show();
            $("#player-view").show();
            $("#arena-view").show();
        }

        start_next_phase();
        break;
    case FLAG_READY:
        break;
    case FLAG_SELECT_CAT:
        if (body == 1) {  // success
            player_cat = available_cats[selected_cat_id];
            player_cat_health = player_cat.health;
            player_abilities.push(available_abilities[player_cat.ability_id]);

            $("#player-view-cat-name").text(player_cat.title);
            $("#player-view-cat-health").text("Health: " + player_cat_health);

            $("#player-view-cat-image").attr({
                src: "/static/cat/" + player_cat.title + ".jpg",
                title: player_cat.title,
                alt: player_cat.title + " Image"
            });

            $("#player-view-cat-ability").attr({
                src: "/static/ability/" + available_abilities[player_cat.ability_id].title + ".jpg",
                title: available_abilities[player_cat.ability_id].title,
                alt: available_abilities[player_cat.ability_id].title + " Image"
            });

            // send ready packet
            send_packet(FLAG_READY, token, null);
        } else {
            log(`Failed to select cat $(selected_cat_id)`);
        }
        break;
    case FLAG_OPPONENT_SELECTED_CAT:
        if (body >= 0) {
            opponent_cat = available_cats[body];
            opponent_cat_health = opponent_cat.health;

            $("#opponent-view-cat-name").text(opponent_cat.title);
            $("#opponent-view-cat-health").text("Health: " + opponent_cat_health);

            $("#opponent-view-cat-image").attr({
                src: "/static/cat/" + opponent_cat.title + ".jpg",
                title: opponent_cat.title,
                alt: opponent_cat.title + " Image"
            });

            $("#opponent-view-cat-ability").attr({
                src: "/static/ability/" + available_abilities[opponent_cat.ability_id].title + ".jpg",
                title: available_abilities[opponent_cat.ability_id].title,
                alt: available_abilities[opponent_cat.ability_id].title + " Image"
            });
        }
        break;
    case FLAG_USE_ABILITY:
        if (body == 0) {
            alert("Ability is on cool down!");
        } else if (body == 1) {
            $("#player-used-ability-image").show();

            $("#player-used-ability-image").attr({
                src: "/static/ability/" + available_abilities[used_ability_id].title + ".jpg",
                title: available_abilities[used_ability_id].title,
                alt: available_abilities[used_ability_id].title.title + " Image"
            });
        }
        break;
    case FLAG_GAIN_HP:
        player_cat_health = body;
        $("#player-view-cat-health").text("Health: " + player_cat_health);
        break;
    case FLAG_OPPONENT_GAIN_HP:
        opponent_cat_health = body;
        $("#opponent-view-cat-health").text("Health: " + opponent_cat_health);
        break;
    case FLAG_DAMAGE_MODIFIED:
        break;
    case FLAG_OPPONENT_DAMAGE_MODIFIED:
        break;
    case FLAG_GAIN_CHANCE:
        break;
    case FLAG_OPPONENT_GAIN_CHANCE:
        break;
    case FLAG_GAIN_ABILITY:
        if (body >= 0) {
            var random_ability = available_abilities[body];
            player_abilities.push(random_ability);

            $("#player-view-cat-random-ability").attr({
                src: "/static/ability/" + random_ability.title + ".jpg",
                title: random_ability.title,
                alt: random_ability.title + " Image"
            });
        }
        break;
    case FLAG_GAIN_CHANCES:
        if (body.length >= 0) {
            player_chance_cards = [];

            for (idx = 0; idx < body.length; idx++) {
                player_chance_cards.push(body[idx]);
            }

            // update chance card list
            update_player_chance_card_list();
        }
        break;
    case FLAG_SELECT_MOVE:
        if (body == 0) {
            alert("Can't select move during " + phase_to_string(current_phase));
        } else if (body == 1) {
            alert("Selected move " + move_to_string(selected_move_id));

            $("#player-selected-move-and-chance").append(
                `<li><span>` +
                `<img src="/static/move/${move_to_string(selected_move_id)}.jpg" height="150" width="110" />` +
                `</span></li>`);
        }
        break;
    case FLAG_SELECT_CHANCE:
        if (body == 0) {
            // failed to select chance
            alert("Can't use chance card " + chance_cards[selected_chance_card_id].title);
        } else if (body == 1) {
            alert("Selected chance " + chance_cards[selected_chance_card_id].title);

            $("#player-selected-move-and-chance").append(
                `<li><span>` +
                `<img src="/static/chance/${chance_cards[selected_chance_card_id].title}.jpg" height="150" width="110" />` +
                `</span></li>`);

            // remove chance
            for (idx = 0; idx < player_chance_cards.length; idx++) {
                if (player_chance_cards[idx] == selected_chance_card_id) {
                    player_chance_cards[idx] = -1;
                    break;
                }
            }

            // update chance card list
            update_player_chance_card_list();
        }
        break;
    case FLAG_REVEAL_MOVE:
        if (body != null) {
            $("#opponent-selected-move-and-chance").append(
                `<li><span>` +
                `<img src="/static/move/${move_to_string(body)}.jpg" height="150" width="110" />` +
                `</span></li>`);
            }
        break;
    case FLAG_REVEAL_CHANCE:
        if (body == null) {
            // $("#opponent-selected-chance").text("Opponent didn't use any chance card.");
        } else {
            $("#opponent-selected-move-and-chance").append(
                `<li><span>` +
                `<img src="/static/chance/${chance_cards[body].title}.jpg" height="150" width="110" />` +
                `</span></li>`);
        }
        break;
    case FLAG_SPOTLIGHT:
        break;
    case FLAG_OPPONENT_SPOTLIGHT:
        break;
    default:
        break;
    }
}

/*
*   Server Related Functions
* - Recieving packets
* - Sending packets
*/

function send_packet(flag, token, body) {
    log("Outgoing message");
    log("Flag: " + flag);
    log("Body: " + body);

    var packet;
    var byteSize = 25;

    if (body != null) {

        if(body instanceof Array)
            byteSize += body.length;
        else
            byteSize += 1;
    }

    // Initialize packet array and store flag
    packet = new Uint8Array(byteSize);
    packet[0] = flag;

    var i;

    // Store token inside packet
    for (i = 0; i < token.length; ++i)
        packet[i + 1] = token.charCodeAt(i);

    // Single byte body
    if (byteSize == 26)
        packet[25] = body;

    // Multi byte body
    else if (byteSize > 26) {

        for (i = 0; i < body.length; ++i)
            packet[i + 25] = body[i];
    }

    socket.send(packet);
}

function receive_packet(event) {

    var packet = new Uint8Array(event.data);

    log("Incoming message");

    var flag = packet[0];
    log("Flag: " + flag);

    var body;
    if (packet.length > 2) {

        body = new Array();
        for(var i = 1; i < packet.length; ++i)
            body.push(packet[i]);
    }
    else
        body = packet[1];
    log("Body: " + body);

    handle_packet(flag, body);
}

