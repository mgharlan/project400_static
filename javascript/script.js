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
    static nodePrefix = 'node_';
    static menuPrefix = 'menu_';
    static connectionsPrefix = 'connections_';
    static connectionPrefix = 'connect_';
    static deleteNodePrefix = 'delete_';
    static weightPrefix = 'weight_';
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
        this.connections = [];
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
    }

    onClick(){
        
        if(Node.connecting && this.node != Node.connectingNode.node && !this.isInConnections(this.id, Node.connectingNode.connections)){
            let start_node = this.id;
            let end_node = Node.connectingNode.id;
            Node.connections.push([end_node, start_node]);
            Node.drawLines();
            $(this.connectionRow(this.connections_id, end_node, this.weight_id)).appendTo(`#${this.connections_id}`);
            $(this.connectionRow(Node.connectingNode.connections_id, start_node, Node.connectingNode.weight_id)).appendTo(`#${Node.connectingNode.connections_id}`);
            this.connections.push([end_node, 1]);
            Node.connectingNode.connections.push([start_node, 1]);
            if(this.connections.length > 0){
                $(`#${'none_' + this.id}`).hide();
            }
            if(Node.connectingNode.connections.length > 0){
                $(`#${'none_' + Node.connectingNode.id}`).hide();
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

    isInConnections(id, connections){
        for(let i=0; i<connections.length; i++){
            if(connections[i][0] == id){
                return true;
            }
        }
        return false;
    }

    addConnection(){
        Node.connecting = true;
        Node.connectingNode = this;
    }

    connectionRow(connection_id, target_id, weight_id){
        return `<tr id=${connection_id + '_' + target_id}><td>Node <b>${target_id}</b></td><td><input class='${weight_id}' id='${weight_id + '_' + target_id}' style="width:50px" value='1' type='number'/></td></tr>`;
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
        for(let i=0; i<this.connections.length; i++){
            Node.nodes[this.connections[i][0]].removeConnection(this.id);
        }
        //redraw connections
        Node.drawLines();
        //remove from global nodes list
        delete Node.nodes[this.id];
    }

    removeConnection(id){
        let removeValues = [];
        //indices
        for(let i=0 ; i < this.connections.length; i++){
            if(this.connections[i][0] == id){
                removeValues.push(this.connections[i]);
            }
        }
        //remove index from connections
        for(let i=0; i< removeValues.length; i++){
            this.connections.splice(this.connections.indexOf(removeValues[i]),1);
        }

        $(`#${this.connections_id + '_' + id}`).remove();
        if(this.connections.length == 0){
            $(`#none_${this.id}`).show();
        }
    }

    changeWeight(event){
        let id = $(event.target).attr('id');
        let weight = $(event.target).val();
        let target_id = id.substring(this.weight_id.length + '_'.length, id.length);
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
                        <table colspan=2>
                            <thead>
                                <th colspan=2>Connections:</th>
                            </thead>
                            <tbody id='${this.connections_id}'>
                                <tr><td><b>Connection</b></td><td><b>Weight</b></td></tr>
                                <tr id='none_${this.id}'><td>None</td><td><input style="width: 50px" type=number value=0 disabled/></td></tr>
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
}

function SPF(){
    dist = {};
}