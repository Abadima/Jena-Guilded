require('dotenv').config()
const WebSocket = require('ws');
const axios = require('axios');

let reconnectTimer = null;
function stopOtherReconnects() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function connect() {
    const socket = new WebSocket(`wss://api.guilded.gg/v1/websocket`, {
        headers: {
            Authorization: `Bearer ${process.env.TOKEN}`
        },
    });

    socket.on('open', function () {
        stopOtherReconnects();
        console.log('GUILDED => SYSTEM ONLINE');
    });

    socket.on('close', function clear() {
        socket.terminate();
        stopOtherReconnects();
        reconnectTimer = setTimeout(reconnect, 5000);
    });

    socket.on('message', function incoming(data) {
        const { t: eventType, d: eventData } = JSON.parse(data);

        if (eventType === 'ChatMessageCreated' || eventType === 'ChatMessageUpdated') {
            const { message: { id: messageId, content, channelId } } = eventData;

            if (content.startsWith('Hello World!')) {
                axios.request({
                    method: 'POST',
                    url: `https://www.guilded.gg/api/v1/channels/${channelId}/messages`,
                    headers: { Authorization: `Bearer ${process.env.TOKEN}`, 'Content-Type': 'application/json' },
                    data: JSON.stringify({
                        content: "Hello There!",
                        replyMessageIds: [messageId]
                    }),
                }).then(r => r.data).catch(e => console.warn(e));
            }
        }
    });

    return socket;
}

function reconnect() {
    console.log("GUILDED => SYSTEM CONNECTING");
    stopOtherReconnects();
    const socket = connect();
    reconnectTimer = setTimeout(function () {
        socket.terminate();
        reconnect();
    }, 5000);
}

reconnect()