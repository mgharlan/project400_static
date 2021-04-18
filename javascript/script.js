let main = null;
let ctx = null;

$().ready(function(){
    main = $('#main');
    let canvas = document.getElementById('canvas');
    canvas.setAttribute('width', main.width());
    canvas.setAttribute('height', main.height());
    ctx = canvas.getContext("2d");
    
});

function addNode(){
    new Node();
}

class Node{
    static count = 0;
    static nodes = {};
    static nodeNames = [];
    static nodePrefix = 'node_';
    static menuPrefix = 'menu_';
    static connectionsPrefix = 'connections_';
    static connectionPrefix = 'connect_';
    static deleteNodePrefix = 'delete_';
    static weightPrefix = 'weight_';
    static nextPrefix = 'next_';
    static previousPrefix = 'previous_';
    static pathPrefix = 'paths_';
    static connecting = false;
    static connectingNode = null;
    static connections = [];
    constructor(){
        this.id = Node.count;
        this.node_id = Node.nodePrefix + this.id;
        this.menu_id = Node.menuPrefix + this.id;
        this.connections_id = Node.connectionsPrefix + this.id;
        this.connect_id = Node.connectionPrefix + this.id;
        this.weight_id = Node.weightPrefix + this.id;
        this.delete_id = Node.deleteNodePrefix + this.id;
        this.next_id = Node.nextPrefix + this.id;
        this.previous_id = Node.previousPrefix + this.id;
        this.paths_id = Node.pathPrefix + this.id;
        this.connections = {};
        this.connections.length = 0;
        Node.nodes[this.id] = this;
        
        this.placeNode();

        this.isDown = false;
        this.wasDragging = false;
        this.subscribeEvents();
        
        Node.count++;
    }

    subscribeEvents(){
        this.node.on('click', this.onClick.bind(this)); 

        $(`#${this.connect_id}`).on('click', this.addConnection.bind(this));
        $(`#${this.delete_id}`).on('click', this.deleteNode.bind(this));

        main.on('mousedown', `#${this.node_id}`, this.mousedown.bind(this));
        main.on('mousemove', this.mousemove.bind(this));
        main.on('mouseup', this.mouseup.bind(this));
        main.on('change', `.${this.weight_id}`, this.changeWeight.bind(this));
        main.on('click', `#${this.next_id}`, this.showPathTable.bind(this));
        main.on('click', `#${this.previous_id}`, this.showConnectionTable.bind(this));
    }

    onClick(){
        
        if(Node.connecting && this.node != Node.connectingNode.node && !(this.id in Node.connectingNode.connections)){
            let start_node = this.id;
            let end_node = Node.connectingNode.id;
            Node.connections.push([end_node, start_node]);
            Node.drawLines();
            $(this.connectionRow(this.connections_id, end_node, this.weight_id)).appendTo(`#${this.connections_id}`);
            $(this.connectionRow(Node.connectingNode.connections_id, start_node, Node.connectingNode.weight_id)).appendTo(`#${Node.connectingNode.connections_id}`);
            this.connections[end_node] = 1;
            this.connections.length++;
            Node.connectingNode.connections[start_node] = 1;
            Node.connectingNode.connections.length++;
            if(this.connections.length > 0){
                $(`#${'none_' + this.id}`).hide();
            }
            if(Node.connectingNode.connections.length > 0){
                $(`#${'none_' + Node.connectingNode.id}`).hide();
            }
            Node.SPF();
            for(const[target, node] of Object.entries(Node.nodes)){
                node.updateTable();
            }
            Node.connecting = false;
            Node.connectingNode = null;
        }
        else{
            if(Node.connecting){
                Node.connecting = false;
                Node.connectingNode = null;
            }
            else if(!this.wasDragging){
                this.menu.toggle();
            }
            else{
                this.wasDragging = false;
            }
        }
    }

    mousedown(){
        this.isDown = true;
    }

    mousemove(event){
        if(this.isDown){
            this.wasDragging = true;
            let x = event.pageX;
            let y = event.pageY;

            let top = main.position().top;
            let bottom = top + main.outerHeight(true);
            let left = main.position().left;
            let right = left + main.outerWidth(true);


            if (y > top + this.node.height()/2 && y < bottom - this.node.height()/2 && x > left + this.node.width()/2 && x < right - this.node.width()/2){    
                let x_adj = x - this.node.width()/2;
                let y_adj = y - this.node.height()/2;
                this.node.css('left', x_adj+'px');
                this.node.css('top', y_adj+'px');

                let menu_x_adj = x - this.menu.width()/2;
                let menu_y_adj = y - this.menu.height()/2;
                let menu_y_shift = this.node.height()/2 + this.menu.height()/2;
                this.menu.css('left', menu_x_adj);
                this.menu.css('top', menu_y_adj + menu_y_shift);
            }

            Node.drawLines();
        }
    }

    mouseup(){
        this.isDown = false;
    }
    
    showPathTable(){
        $(`#table_${this.connections_id}`).hide();
        $(`#table_${this.paths_id}`).show();
    }
    
    showConnectionTable(){
        $(`#table_${this.connections_id}`).show();
        $(`#table_${this.paths_id}`).hide();
    }

    addConnection(){
        Node.connecting = true;
        Node.connectingNode = this;
    }
    
    updateTable(){
        for(const[target, node] of Object.entries(Node.nodes)){
            if($(`#${this.paths_id + '_' + target}`).length){
                $(`#${this.paths_id + '_' + target}`).remove();
            }
            $(this.pathRow(this.paths_id, target, (this.distances[target] == Number.MAX_VALUE) ? 'Unreachable' : this.distances[target],  (this.distances[target] == Number.MAX_VALUE) ? 'NA' : this.forwarding[target])).appendTo(`#${this.paths_id}`);
        } 
    }

    pathRow(paths_id, target, distance, forward){
        return `<tr id='${paths_id + '_' + target}'><td>${target}</td><td>${distance}</td><td>${forward}</td></tr>`;

    }

    connectionRow(connection_id, target_id, weight_id){
        return `<tr id=${connection_id + '_' + target_id}><td>Node <b>${target_id}</b></td><td><input class='${weight_id}' id='${weight_id + '_' + target_id}' style="width:50px" value='1' min='1' type='number'/></td></tr>`;
    }

    deleteNode(){
        this.node.remove();
        this.menu.remove();
        let removeValues = [];
        //gather global indices
        for(let i=0 ; i< Node.connections.length; i++){
            if(Node.connections[i][0] == this.id){
                removeValues.push(Node.connections[i]);
            }
            if(Node.connections[i][1] == this.id){
                removeValues.push(Node.connections[i]);
            }
        }
        //remove index from global connections
        for(let i=0; i< removeValues.length; i++){
            Node.connections.splice(Node.connections.indexOf(removeValues[i]),1);
        }
        //remove from local connections
        for(const[key, value] of Object.entries(this.connections)){
            if(key != 'length'){
                Node.nodes[key].removeConnection(this.id);
            }
        }
        //redraw connections
        Node.drawLines();
        //remove table entries and recalculate
        Node.SPF();
        for(const[target, node] of Object.entries(Node.nodes)){
            node.updateTable();
        }
        //remove from global nodes list
        delete Node.nodes[this.id];
    }

    removeConnection(id){
        delete this.connections[id];
        this.connections.length--;

        $(`#${this.connections_id + '_' + id}`).remove();
        if(this.connections.length == 0){
            $(`#none_${this.id}`).show();
        }
    }

    changeWeight(event){
        let id = $(event.target).attr('id');
        let weight = $(event.target).val();
        let target_id = id.substring(this.weight_id.length + '_'.length, id.length);

        this.connections[target_id] = parseInt(weight);
        Node.nodes[target_id].connections[this.id] = parseInt(weight);
        $(`#${Node.nodes[target_id].weight_id + '_' + this.id}`).val(weight);
    }

    static drawLines(){
        ctx.clearRect(0,0, canvas.width, canvas.height);
        Node.connections.forEach((node_pair)=>{
            let start_node = $(`#${Node.nodePrefix + node_pair[0]}`);
            let end_node = $(`#${Node.nodePrefix + node_pair[1]}`);
            ctx.lineWidth = 1;
            ctx.beginPath();
            let x_start = start_node.position().left + start_node.width()/2;
            let y_start = start_node.position().top - $('.top-bar').height() + start_node.height()/2;
            let x_end = end_node.position().left + end_node.width()/2;
            let y_end = end_node.position().top - $('.top-bar').height() + end_node.height()/2;
            ctx.moveTo(x_start, y_start);
            ctx.lineTo(x_end, y_end);
            ctx.stroke();
        });
    }

    placeNode(){
        let left = Math.floor(Math.random()*80);
        let top = Math.floor(Math.random()*80) + 10;
        this.node = $(this.createNode(top, left)).appendTo(main);
        this.menu = $(this.createMenu(top, left)).appendTo(main);
    
        //adjust width and height to be middle of point
        let x = this.node.position().left;
        let y = this.node.position().top;
        let x_adj = x - this.node.width()/2;
        let y_adj = y - this.node.height()/2;
        this.node.css('left', x_adj+'px');
        this.node.css('top', y_adj+'px');
    
        let menu_x_adj = x - this.menu.width()/2;
        let menu_y_adj = y - this.menu.height()/2;
        let menu_y_shift = this.node.height()/2 + this.menu.height()/2;
        this.menu.css('left', menu_x_adj);
        this.menu.css('top', menu_y_adj + menu_y_shift);
    }

    createNode(top, left){
        return `
        <img 
            src='img/frog.svg' 
            draggable='false' 
            class='node' 
            id='${this.node_id}' 
            style=
                'top: ${top}%; 
                left: ${left}%;'
        ></img>`
    }
    
    createMenu(top, left){
        return `
        <div draggable='false' id='${this.menu_id}' style='top: ${top}%; left: ${left}%; display: none; position: absolute;'>
            <table>
                <thead>
                    <th>Node ${this.id}</th>
                </thead>
                <tbody>
                    <tr><td>
                        <table id='${'table_' + this.connections_id}' colspan=2>
                            <thead>
                                <th colspan=2>Connections: <button class='next' id='${this.next_id}' >></button></th>
                            </thead>
                            <tbody id='${this.connections_id}'>
                                <tr><td><b>Connection</b></td><td><b>Weight</b></td></tr>
                                <tr id='none_${this.id}'><td>None</td><td><input style="width: 50px" type='number' min='0' value=0 disabled/></td></tr>
                            </tbody>
                        </table>
                        <table id='${'table_' + this.paths_id}' style="display: none;" colspan=3>
                            <thead>
                                <th colspan=3><button class='previous' id='${this.previous_id}'><</button> Paths:</th>
                            </thead>
                            <tbody id='${this.paths_id}'>
                                <tr><td><b>Node</b></td><td><b>Distance</b></td><td><b>Forward</b></td></tr>
                                <tr id='${this.paths_id + '_' + this.id}'><td>${this.id}</td><td>0</td><td>${this.id}</td></tr>
                            </tbody>
                        </table>
                    </td></tr>
                    <tr><td>
                        <table style="width: 100%;">
                            <thead>
                                <th>Functions:</th>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><button style='width: 100%' id=${this.connect_id}>Connect</button></td>
                                </tr>
                                <tr>
                                    <td><button style='width: 100%'>Disable</button></td>
                                </tr>
                                <tr>
                                    <td><button style='width: 100%' id=${this.delete_id}>Delete</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </td></tr>
                </tbody>
            </table>
        </div>`
    };

    createForwardingTable(){
        this.forwarding = {};
        for(const[target, step] of Object.entries(this.path)){
            let targ = target;
            let hop = step;
            this.forwarding[target] = "";
            while(targ != hop){
                this.forwarding[target] += hop;
                targ = hop;
                hop = this.path[hop];
            }
            this.forwarding[target] += (this.forwarding[target].includes(hop)) ? "" : hop;
            this.forwarding[target] = this.forwarding[target].split("").reverse().join("");
        }
    }

    static getNextNode(Q, dist){
        let v = Number.MAX_VALUE;
        let v_node = null;
        for(let i =0; i< Q.length; i++){
            if(v > dist[Q[i]]){
                v_node = Q[i];
                v = dist[Q[i]];
            }
        }
        return v_node;
    }

    static SPF(){
        for(const[node_id, currentNode] of Object.entries(Node.nodes)){
            //let node_id = Node.nodes[0].id;
            //let currentNode = Node.nodes[0];
            let dist = {};
            let previous = {};
            let Q = [];
            //setup inial objects
            for(const [key, value] of Object.entries(Node.nodes)){
                dist[key] = Number.MAX_VALUE;
                previous[key] = undefined;
                Q.push(key);
            }
            //setup initial state for the current node
            dist[node_id] = 0;
            previous[node_id] = node_id;

            while(Q.length != 0){
                let u = Node.getNextNode(Q, dist);
                Q.splice(Q.indexOf(u), 1);
                
                if( u !== null){
                    for(const[neighbor, weight] of Object.entries(Node.nodes[u].connections)){
                        if(Q.includes(neighbor)){
                            let alt = dist[u] + weight;
                            if(alt < dist[neighbor]){
                                dist[neighbor] = alt;
                                if(u == node_id){
                                    previous[neighbor] = neighbor;
                                }
                                else{
                                    previous[neighbor] = u;
                                }
                            }
                        }
                    }
                }
            }
            currentNode.distances = dist;
            currentNode.path = previous;
            currentNode.createForwardingTable();
        }
    }
}

