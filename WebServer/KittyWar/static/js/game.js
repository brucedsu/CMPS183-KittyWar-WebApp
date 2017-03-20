var player_cat          = null;
var player_abilities    = [];
var player_chance_cards = [];

var opponent_cat = null;

// web socket
var socket = null;

$(document).ready(function() {
    $("#message").click(send_message);

    // automatically connect to the game server
    connect();

    $("#find-match-button").click(find_match);
    $("#select-cat-confirm-button").click(confirm_selected_cat);
});

function connect() {
    log("Connecting to game server...");

    log("Token: " + token);

    // Create WebSocket connection.
    socket         = new WebSocket('ws://localhost:2056');
    socket.onopen  = server_open;
    socket.onerror = server_error;
    socket.onclose = server_close;

    // Listen for messages
    socket.addEventListener('message', receive_packet);
}

function send_message() {
    if (socket != null) {

        socket.send("Hello Server!");
        log("Message sent");
    }
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

// flags
var FLAG_FIND_MATCH               = 2;
var FLAG_USER_PROFILE             = 3;
var FLAG_ALL_CARDS                = 4;
var FLAG_CAT_CARDS                = 5
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
    var idx = 0;
    for (chance_card in player_chance_cards) {
        $('player-view-chance-card-list').append(
            `<li><span onclick="select_chance_card(${idx})">` +
            `<img src="chance/${chance_card.title}.jpg" height="150" width="150" />` +
            `</span></li>`);
        idx = idx + 1;
    }
}

var selected_move_id = -1;

function select_move(move_id) {
    selected_move_id = move_id;

    send_packet(FLAG_SELECT_MOVE, token, selected_move_id);
}

function use_ability(player_ability_index) {
    var ability = player_abilities[player_ability_index];
}

function move_to_string(move_id) {
    switch (move_id) {
    case MOVE_PURR:
        return "Purr";
    case MOVE_GUARD:
        return "Guard";
    case MOVE_SKIP:
        return "Skip";
    default:
        return "Unknown move";
    }
}

var selected_chance_id = -1;

function select_chance_card(player_chance_card_index) {
    selected_chance_id = player_chance_cards[player_chance_card_index].id;

    send_packet(FLAG_SELECT_CHANCE, token, selected_chance_id);
}

function handle_packet(flag, body) {
    var idx = 0;

    switch (flag) {
    case FLAG_FIND_MATCH:
        // show select cat view
        $("select-cat-view").show();

        // hide other views
        $("find-match-view").hide();
        $("opponent-view").hide();
        $("player-view").hide();
        $("arena-view").hide();
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
        break;
    case FLAG_READY:
        break;
    case FLAG_SELECT_CAT:
        if (body == 1) {  // success
            player_cat = available_cats[selected_cat_id];
            player_abilities.push(available_abilities[player_cat.ability_id]);

            $("player-view-cat-image").attr({
                src: "cat/" + player_cat.title + ".jpg",
                title: player_cat.title,
                alt: player_cat.title + " Image"
            });

            $("player-view-cat-ability").attr({
                src: "ability/" + available_abilities[player_cat.ability_id].title + ".jpg",
                title: available_abilities[player_cat.ability_id].title,
                alt: available_abilities[player_cat.ability_id].title + " Image"
            });

            $("player-view-cat-name").text(player_cat.title);

            $("player-view-cat-health").text(player_cat.health);
        } else {
            log(`Failed to select cat $(selected_cat_id)`);
        }
        break;
    case FLAG_OPPONENT_SELECTED_CAT:
        if (body >= 0) {
            var opponent_cat_id = body;
            opponent_cat = available_cats[opponent_cat_id];

            $("opponent-view-cat-image").attr({
                src: "cat/" + opponent_cat.title + ".jpg",
                title: opponent_cat.title,
                alt: opponent_cat.title + " Image"
            });

            $("opponent-view-cat-ability").attr({
                src: "ability/" + available_abilities[opponent_cat.ability_id].title + ".jpg",
                title: available_abilities[opponent_cat.ability_id].title,
                alt: available_abilities[opponent_cat.ability_id].title + " Image"
            });

            $("opponent-view-cat-namge").text(opponent_cat.title);

            $("oppoent-view-cat-health").text(opponent_cat.health);
        }
        break;
    case FLAG_USE_ABILITY:
        break;
    case FLAG_GAIN_HP:
        break;
    case FLAG_GAIN_HP:
        break;
    case FLAG_OPPONENT_GAIN_HP:
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
            var random_abilit_id = body
            player_abilities.push(available_abilities[random_abilit_id]);
        }
        break;
    case FLAG_GAIN_CHANCES:
        if (body.length >= 0) {
            player_chance_cards = [];

            for (chance_id in body) {
                player_chance_cards.push(chance_cards[chance_id]);
            }

            // remove all cards first
            $('player-view-chance-card-list').empty();

            // update chance card list
            update_player_chance_card_list();
        }
        break;
    case FLAG_SELECT_MOVE:
        if (body == 0) {
            // failed to select move
        } else if (body == 1) {
            $('player-selected-move').text("Selected move: " + move_to_string(selected_move_id));
        }
        break;
    case FLAG_SELECT_CHANCE:
        if (body == 0) {
            // failed to select chance
        } else if (body == 1) {
            $('player-selected-chance').text("Selected chance: " + chance_cards[selected_chance_id].title);

            // remove chance
            for (chance_card in player_chance_cards) {
                if (chance_card.id == selected_chance_id) {
                    player_chance_cards.splice(idx, 1);
                    break;
                }
            }

            // update chance card list
            update_player_chance_card_list();
        }
        break;
    case FLAG_REVEAL_MOVE:
        $('opponent-selected-move').text("Opponent selected move: " + move_to_string(body));
        break;
    case FLAG_REVEAL_CHANCE:
        $('opponent-selected-chance').text("Opponent selected chance: " + chance_cards[body].title);
        break;
    case FLAG_SPOTLIGHT:
        break;
    case FLAG_OPPONENT_SPOTLIGHT:
        break;
    default:
        break;
    }
}

function send_packet(flag, token, body) {
    log(`Sending packet. Flag is ${flag}... Token is ${token}. Body is ${body}.`)
}

function receive_packet(event) {
    console.log('Message from server', event.data);
}

