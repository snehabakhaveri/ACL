export class User {
    constructor(state, env) {
        this.state = state;
        this.localStorage = new Map();
        this.wsServer = new Set();
    }
    
    async fetch(request) {

        const upgradeHeader = request.headers.get('Upgrade');

        let url = new URL(request.url);
        let queryString = url.searchParams;
        if (url.pathname == "/save") {
            return await this.save(queryString);
        }
        else if (url.pathname == "/get") {
            return await this.get(queryString);
        }
        else if (upgradeHeader || upgradeHeader == 'websocket') {
            const webSocketPair = new WebSocketPair();
            const client = webSocketPair[0];
            const server = webSocketPair[1]
            this.wsServer.add(server);
            server.accept();
            server.addEventListener('message', event => {
                console.log(event.data);
            });
            server.addEventListener('close', event => {
                console.log("Event closed");
                this.wsServer.delete(server);

            });
            return new Response(null, {
                status: 101,
                webSocket: client,
            });
        }
        else {
            console.log("invalid path");
            return genresponse("invalid path", 404);
        }

    }
    
    async save(queryString) {
        let id = queryString.get("id");
        let value = queryString.get("v");
       
        if (!id || !value) {
            return genresponse("invalid parameter for save", 404);
        }
        await this.state.storage.put(id, value);
        this.localStorage.set(id, value);
        for(const ws of this.wsServer)
        {
            ws.send("change id -> " + id + "\nvalue -> " + value);
        
        }
        return genresponse("save successful", 200);
    }
    async get(queryString) {
        let id = queryString.get("id");
        if (!id) {
            return genresponse("invalid parameter", 404);

        }
        let obj = {};
        obj.id = id;
        obj.from = "localStorage";
        obj.value = this.localStorage.get(id);
        console.log("value::", obj.value);
        if (!obj.value) {
            obj.value = await this.state.storage.get(id);
            this.localStorage.set(obj.id, obj.value);
            obj.from = "durableStorage"
        }
        return genresponse(JSON.stringify(obj), 200);
    }
}
function genresponse(body, statusCode) {
    return new Response(body, { status: statusCode });
}