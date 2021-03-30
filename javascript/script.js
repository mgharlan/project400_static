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
    nodes.push(new Node());
}

class Node{
    static count = 0;
    static nodes = [];
    static nodePrefix = 'node_';
    static menuPrefix = 'menu_';
    static connectionsPrefix = 'connections_';
    static connectionPrefix = 'connect_'
    static connecting = false;
    static connectingNode = null;
    constructor(){
        this.id = Node.count;
        this.node_id = Node.nodePrefix + this.id;
        this.menu_id = Node.menuPrefix + this.id;
        this.connections_id = Node.connectionsPrefix + this.id;
        this.connect_id = Node.connectionPrefix + this.id;
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

        main.on('mousedown', `#${this.node_id}`, this.mousedown.bind(this));
        main.on('mousemove', this.mousemove.bind(this));
        main.on('mouseup', this.mouseup.bind(this));
    }

    onClick(){
        if(Node.connecting && this.node != Node.connectingNode){
            let start_node = this.node_id;
            let end_node = Node.connectingNode.attr('id');
            this.drawLine(start_node, end_node);
            let node_pair = [start_node, end_node];
            console.log(`connections_${start_node.substring(Node.nodePrefix.length)}`);
            $(`<tr><td>${start_node}:${end_node}</td></tr>`).appendTo(`#connections_${start_node.substring(Node.nodePrefix.length)}`);
            this.connections.push(node_pair);
            Node.connecting = false;
            Node.connectingNode = null;
        }
        else{
            if(!this.wasDragging){
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

            ctx.clearRect(0,0, canvas.width, canvas.height);
            this.connections.forEach((node_pair)=>{
                this.drawLine(node_pair[0], node_pair[1]);
            });
        }
    }

    mouseup(){
        this.isDown = false;
    }

    addConnection(){
        Node.connecting = true;
        Node.connectingNode = this.node;
    }

    drawLine(start_node, end_node){
        start_node = $(`#${start_node}`);
        end_node = $(`#${end_node}`);
        ctx.lineWidth = 1;
        ctx.beginPath();
        let x_start = start_node.position().left + start_node.width()/2;
        let y_start = start_node.position().top - $('.top-bar').height() + start_node.height()/2;
        let x_end = end_node.position().left + end_node.width()/2;
        let y_end = end_node.position().top - $('.top-bar').height() + end_node.height()/2;
        ctx.moveTo(x_start, y_start);
        ctx.lineTo(x_end, y_end);
        ctx.stroke();
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
                        <table>
                            <thead>
                                <th>Connections:</th>
                            </thead>
                            <tbody id='${this.connections_id}'>
                                <tr id='none_${this.id}'><td>None</td></tr>
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
                                    <td><button id=${this.connect_id}>Connect</button></td>
                                </tr>
                                <tr>
                                    <td><button>Disable</button></td>
                                </tr>
                                <tr>
                                    <td><button>Delete</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </td></tr>
                </tbody>
            </table>
        </div>`
    };
}