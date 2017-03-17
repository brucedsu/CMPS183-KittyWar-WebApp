var socket = null;

$(document).ready(function() {
    $("#connect").click(connect);
    $("#message").click(send_message);

    $("#find-match-button").click(find_match);
});

function connect() {
    log("Connecting to game server...");

    // Create WebSocket connection.
    socket = new WebSocket('ws://localhost:2056');
    socket.onopen = server_open;
    socket.onerror = server_error;
    socket.onclose = server_close;

    // Listen for messages
    socket.addEventListener('message', function (event) {
        console.log('Message from server', event.data);
    });
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

var finding_match = false;

function find_match() {
    if (!find_match) {

    }

}
