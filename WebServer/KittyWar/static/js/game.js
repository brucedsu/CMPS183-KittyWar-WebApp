var socket = null;

var player_cat   = null;
var opponent_cat = null;

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

function handle_packet(flag, body) {
    switch (flag) {
    case FLAG_FIND_MATCH:
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

