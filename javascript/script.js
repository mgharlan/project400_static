let main = null;
let ctx = null;
let nodes = [];

$().ready(function(){
    main = $('#main');
    let canvas = document.getElementById('canvas');
    canvas.setAttribute('width', main.width());
    canvas.setAttribute('height', main.height());
    ctx = canvas.getContext("2d");
    
});

function addNode(){
    let newNode = new Node();
    nodes[`${newNode.id}`] = newNode;
}

class Node{
    static count = 0;
    static nodes = [];
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
        this.delete_id = Node.deleteNodePrefix + this.id;
        this.connections = [];
        Node.nodes.push(this.id);
        
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
    }

    onClick(){
        
        if(Node.connecting && this.node != Node.connectingNode.node && !this.isInConnections(this.id, Node.connectingNode.connections)){
            let start_node = this.id;
            let end_node = Node.connectingNode.id;
            Node.connections.push([end_node, start_node]);
            Node.drawLines();
            $(`<tr id=${this.connections_id + '_' + end_node}><td>Node <b>${end_node}</b></td><td id='${Node.weightPrefix + end_node}'>1</td></tr>`).appendTo(`#${this.connections_id}`);
            $(`<tr id=${Node.connectingNode.connections_id + '_' + start_node}><td>Node <b>${start_node}</b></td><td id='${Node.weightPrefix + start_node}'>1</td></tr>`).appendTo(`#${Node.connectingNode.connections_id}`);
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
            nodes[this.connections[i][0]].removeConnection(this.id);
        }
        //redraw connections
        Node.drawLines();
        //remove from global nodes list
        nodes.splice(this.id,1);
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
                                <tr id='none_${this.id}'><td>None</td><td>0</td></tr>
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
    console.log(nodes);
    console.log(Node.connections);
    let distances = [];
    /*nodes.forEach(function(element){
        distances.push(element.id);
    });*/
}