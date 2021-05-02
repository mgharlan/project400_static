let main = null;
let ctx = null;
let clock = null;
let clock_value = null;
let time = 1;

//sets up the canvas for drawing lines
$().ready(function(){
    main = $('#main');
    let canvas = document.getElementById('canvas');
    canvas.setAttribute('width', main.width());
    canvas.setAttribute('height', main.height());
    ctx = canvas.getContext("2d");

    clock_value = $('#clock_value');
    clock = $('#clock');
    clock_run();
});

//keeps track of time in the simulation
async function clock_run(){
    while(true){
        await new Promise(r => setTimeout(r, 1000));
        time++;
        clock_value.val(time);
        clock.html(`Time: ${time}`);
    }
};

//adds a new node to the screen
function addNode(){
    new Node();
}

//class that represents the node
class Node{
    static count = 0;
    static nodes = {};
    static nodeNames = [];
    static nodePrefix = 'node_';
    static menuPrefix = 'menu_';
    static linksPrefix = 'links_';
    static linkPrefix = 'connect_';
    static deleteNodePrefix = 'delete_';
    static weightPrefix = 'weight_';
    static nextPrefix = 'next_';
    static previousPrefix = 'previous_';
    static pathPrefix = 'paths_';
    static disablePrefix = 'disable_';
    static toggleLinkPrefix = 'toggleLink_';
    static deleteLinkPrefix = 'deleteLink_';
    static linking = false;
    static linkingNode = null;
    static links = [];
    static disabled = [];
    constructor(){
        this.id = Node.count;
        this.node_id = Node.nodePrefix + this.id;
        this.menu_id = Node.menuPrefix + this.id;
        this.links_id = Node.linksPrefix + this.id;
        this.connect_id = Node.linkPrefix + this.id;
        this.weight_id = Node.weightPrefix + this.id;
        this.delete_id = Node.deleteNodePrefix + this.id;
        this.next_id = Node.nextPrefix + this.id;
        this.previous_id = Node.previousPrefix + this.id;
        this.paths_id = Node.pathPrefix + this.id;
        this.disable_id = Node.disablePrefix + this.id;
        this.toggleLink_id = Node.toggleLinkPrefix + this.id;
        this.deleteLink_id = Node.deleteLinkPrefix + this.id;
        this.links = {};
        this.links.length = 0;
        this.disabledLinks = {};
        this.disabled = false;
        this.downed = {};
        
        Node.nodes[this.id] = this;
        
        this.placeNode();

        this.isDown = false;
        this.wasDragging = false;
        this.subscribeEvents();
        
        Node.count++;

        this.run_clock();
    }

    //clock that simulates sending packets between the nodes and links in the network
    async run_clock(){
        while(this.ping != null){
            await new Promise(r => setTimeout(r, 1000));
            if(this.ping != null){
                this.ping();
            }
        }
    }

    //add events to the elements on the screen
    subscribeEvents(){
        this.node.on('click', this.onClick.bind(this)); 

        $(`#${this.connect_id}`).on('click', this.addlink.bind(this));
        $(`#${this.delete_id}`).on('click', this.deleteNode.bind(this));

        main.on('mousedown', `#${this.node_id}`, this.mousedown.bind(this));
        main.on('mousemove', this.mousemove.bind(this));
        main.on('mouseup', this.mouseup.bind(this));
        main.on('change', `.${this.weight_id}`, this.changeWeight.bind(this));
        main.on('click', `.${this.toggleLink_id}`, this.toggleLink.bind(this));
        main.on('click', `.${this.deleteLink_id}`, this.deleteLink.bind(this));
        main.on('click', `#${this.next_id}`, this.showPathTable.bind(this));
        main.on('click', `#${this.previous_id}`, this.showlinkTable.bind(this));
        main.on('click', `#${this.disable_id}`, this.toggleNode.bind(this));
    }

    //when the node is clicked, check to see if its a drag or a single click
    onClick(){
       //if node is clicked open the node menu 
        if(Node.linking && this.node != Node.linkingNode.node && !(this.id in Node.linkingNode.links)){
            let start_node = this.id;
            let end_node = Node.linkingNode.id;
            Node.links.push([end_node, start_node]);
            Node.drawLines();
            $(this.linkRow(this.links_id, end_node, this.weight_id, this.toggleLink_id, this.deleteLink_id)).appendTo(`#${this.links_id}`);
            $(this.linkRow(Node.linkingNode.links_id, start_node, Node.linkingNode.weight_id, Node.linkingNode.toggleLink_id, Node.linkingNode.deleteLink_id)).appendTo(`#${Node.linkingNode.links_id}`);
            this.links[end_node] = 1;
            this.links.length++;
            Node.linkingNode.links[start_node] = 1;
            Node.linkingNode.links.length++;
            if(this.links.length > 0){
                $(`#${'none_' + this.id}`).hide();
            }
            if(Node.linkingNode.links.length > 0){
                $(`#${'none_' + Node.linkingNode.id}`).hide();
            }
            Node.SPF();
            for(const[target, node] of Object.entries(Node.nodes)){
                node.updateTable();
            }
            Node.linking = false;
            Node.linkingNode = null;
        }
        else{
            if(Node.linking){
                Node.linking = false;
                Node.linkingNode = null;
            }
            else if(!this.wasDragging){
                this.menu.toggle();
            }
            else{
                this.wasDragging = false;
            }
        }
    }

    //for dragging
    mousedown(){
        this.isDown = true;
    }

    //drag the node across the screen
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

    //end drag
    mouseup(){
        this.isDown = false;
    }

    //simulates the sending and recieving of packets to other nodes across links in the network
    async ping(){
        //detects if links are down
        for(const [link, weight] of Object.entries(this.downed)){
           if(link in this.disabledLinks) {
               continue;
           }
           this.broadcastDown(link, weight);
        } 

        //detect if nodes are down
        for(const [link, weight] of Object.entries(this.links)){
            if(link == 'length'){
                continue;
            }
            if(Node.nodes[link].disabled){
                if(link in this.disabledLinks){
                    continue;
                }
                this.broadcastDown(link, weight);
            }
            else if(link in this.disabledLinks && !(link in this.downed)){
                this.broadcastUp(link, weight);
            }
        }
    }

    //broadcast that a link/node is down
    async broadcastDown(link, weight){
        if(!(link in this.disabledLinks)){
            this.disabledLinks[link] = weight;
            //this weight represents the time it takes to realize it is down
            await new Promise(r => setTimeout(r, 1000));
            console.log(`${this.node_id} detected that ${Node.nodes[link].node_id} is disabled at t=${clock_value.val()}`);
            for(const [node_id, _] of Object.entries(this.links)){
                if(node_id != 'length' && node_id != link){
                    Node.nodes[node_id].broadcastDown(link, weight);
                }
            } 
            this.nodeSPF();
            this.updateTable();
        }
    }

    //broadcast that a previously downed node is up again
    async broadcastUp(link, weight){
        if(link in this.disabledLinks || !(link in this.links)){
            delete this.disabledLinks[link];
            //this represents how long it took the node to realize the node was back up and start letting other nodes know
            await new Promise(r => setTimeout(r, 1000));
            console.log(`${this.node_id} detected that ${Node.nodes[link].node_id} is enabled at t=${clock_value.val()}`);
            for(const [node_id, _] of Object.entries(this.links)){
                if(node_id != 'length' && node_id != link){
                    Node.nodes[node_id].broadcastUp(link, weight);
                }
            } 
            this.nodeSPF();
            this.updateTable();
        }
    }
    
    //hide the path table and show the link table
    showPathTable(){
        $(`#table_${this.links_id}`).hide();
        $(`#table_${this.paths_id}`).show();
        let centered = this.node.position().left - (this.menu.width() - this.node.width())/2;
        this.menu.css('left', centered + 'px');
    }
    
    //hide the link table and show the path table
    showlinkTable(){
        $(`#table_${this.links_id}`).show();
        $(`#table_${this.paths_id}`).hide();
        let centered = this.node.position().left - (this.menu.width() - this.node.width())/2;
        this.menu.css('left', centered + 'px');
    }

    //enable/ disable node
    toggleNode(){
        if(this.disabled){
            this.disabled = false;
            $(`#${this.node_id}`).removeClass('disabled');
            $(`#${this.disable_id}`).html('Disable')
            console.log(`Admin enabled ${this.node_id} at t=${clock_value.val()}`);
        }
        else{
            this.disabled = true;
            $(`#${this.node_id}`).addClass('disabled');
            $(`#${this.disable_id}`).html('Enable')
            console.log(`Admin disabled ${Node.nodePrefix +  this.id} at t=${clock_value.val()}`);
        }
    }

    //enbale/disable link
    toggleLink(event){
        let id = $(event.target).attr('id');
        let target_id = id.substring(this.toggleLink_id.length + '_'.length, id.length);
        if($(event.target).html() == '-'){
            console.log(`Admin disabled connection between ${this.node_id} & ${Node.nodePrefix + target_id} at t=${clock_value.val()}`);
            this.downed[target_id] = this.links[target_id];
            this.removelink(target_id, false);
            Node.nodes[target_id].downed[this.id] = this.links[target_id];
            Node.nodes[target_id].removelink(this.id, false);

            let removeValues = [];
            target_id = parseInt(target_id);
            for(let i=0 ; i< Node.links.length; i++){
                if(Node.links[i][0] == this.id && Node.links[i][1] == target_id){
                    removeValues.push(Node.links[i]);
                    Node.disabled.push([this.id, target_id]);
                }
                if(Node.links[i][0] == target_id && Node.links[i][1] == this.id){
                    removeValues.push(Node.links[i]);
                    Node.disabled.push([target_id, this.id]);
                }
            }
            for(let i=0; i< removeValues.length; i++){
                Node.links.splice(Node.links.indexOf(removeValues[i]),1);
            }

            $(event.target).html("+");
            $(`#${Node.nodes[target_id].toggleLink_id + '_' + this.id}`).html('+');
            $(`#${this.deleteLink_id + '_' + target_id}`).prop("disabled", true);
            $(`#${Node.nodes[target_id].deleteLink_id + '_' + this.id}`).prop("disabled", true);
            $(`#${this.weight_id + '_' + target_id}`).prop("disabled", true);
            $(`#${Node.nodes[target_id].weight_id + '_' + this.id}`).prop("disabled", true);

            Node.drawLines();

            return;
        }
        if($(event.target).html() == '+'){
            console.log(`Admin enabled connection between ${this.node_id} & ${Node.nodePrefix + target_id} at t=${clock_value.val()}`);
            $(event.target).html("-");
            $(`#${Node.nodes[target_id].toggleLink_id + '_' + this.id}`).html('-');
            $(`#${this.deleteLink_id + '_' + target_id}`).prop("disabled", false);
            $(`#${Node.nodes[target_id].deleteLink_id + '_' + this.id}`).prop("disabled", false);
            $(`#${this.weight_id + '_' + target_id}`).prop("disabled", false);
            $(`#${Node.nodes[target_id].weight_id + '_' + this.id}`).prop("disabled", false);

            let removeValues = [];
            target_id = parseInt(target_id);
            for(let i=0 ; i< Node.disabled.length; i++){
                if(Node.disabled[i][0] == this.id && Node.disabled[i][1] == target_id){
                    removeValues.push(Node.disabled[i]);
                    Node.links.push([this.id, target_id]);
                }
                if(Node.disabled[i][0] == target_id && Node.disabled[i][1] == this.id){
                    removeValues.push(Node.disabled[i]);
                    Node.links.push([target_id, this.id]);
                }
            }
            for(let i=0; i< removeValues.length; i++){
                Node.disabled.splice(Node.disabled.indexOf(removeValues[i]),1);
            }

            //readd weight
            this.links[target_id] = parseInt($(`#${this.weight_id + '_' + target_id}`).val());
            delete this.downed[target_id];
            Node.nodes[target_id].links[this.id] = parseInt($(`#${Node.nodes[target_id].weight_id + '_' + this.id}`).val());
            delete Node.nodes[target_id].downed[this.id];

            Node.drawLines();

            return;
        }
    }

    deleteLink(event){
        let id = $(event.target).attr('id');
        let target_id = id.substring(this.deleteLink_id.length + '_'.length, id.length);
        this.removelink(target_id);
        Node.nodes[target_id].removelink(this.id);
        Node.SPF();
        for(const[target, node] of Object.entries(Node.nodes)){
            node.updateTable();
        }

        let removeValues = [];
        for(let i=0 ; i< Node.links.length; i++){
            if(Node.links[i][0] == this.id && Node.links[i][1] == target_id){
                removeValues.push(Node.links[i]);
            }
            if(Node.links[i][0] == target_id && Node.links[i][1] == this.id){
                removeValues.push(Node.links[i]);
            }
        }
        //remove index from global links
        for(let i=0; i< removeValues.length; i++){
            Node.links.splice(Node.links.indexOf(removeValues[i]),1);
        }
        
        Node.drawLines();
    }

    addlink(){
        Node.linking = true;
        Node.linkingNode = this;
    }
    
    //updates the path table
    updateTable(){
        for(const[target, node] of Object.entries(Node.nodes)){
            if($(`#${this.paths_id + '_' + target}`).length){
                $(`#${this.paths_id + '_' + target}`).remove();
            }
            if(this.distances[target] != Number.MAX_VALUE && this.distances[target] != Number.MAX_VALUE){
                $(this.pathRow(this.paths_id, target, this.distances[target], this.forwarding[target])).appendTo(`#${this.paths_id}`);
            }
        } 
    }

    //adds the html for a path on the paths table in the node menu
    pathRow(paths_id, target, distance, forward){
        return `<tr id='${paths_id + '_' + target}'><td>${target}</td><td>${distance}</td><td>${forward}</td></tr>`;

    }

    //adds the html for a link on the link table in the node menu
    linkRow(link_id, target_id, weight_id, toggleLink_id, deleteLink_id){
        return `<tr id=${link_id + '_' + target_id}>
                <td>Node <b>${target_id}</b></td>
                <td><input class='${weight_id}' id='${weight_id + '_' + target_id}' style="width:50px" value='1' min='1' type='number'/></td>
                <td><button class='${toggleLink_id}' id='${toggleLink_id + '_' + target_id}' style='width: 100%'>-</button></td>
                <td><button class='${deleteLink_id}' id='${deleteLink_id + '_' + target_id}' style='width: 100%'>x</button></td>
            </tr>`;
    }

    deleteNode(){
        this.node.remove();
        this.menu.remove();
        let removeValues = [];
        //gather global indices
        for(let i=0 ; i< Node.links.length; i++){
            if(Node.links[i][0] == this.id){
                removeValues.push(Node.links[i]);
            }
            if(Node.links[i][1] == this.id){
                removeValues.push(Node.links[i]);
            }
        }
        //remove index from global links
        for(let i=0; i< removeValues.length; i++){
            Node.links.splice(Node.links.indexOf(removeValues[i]),1);
        }

        removeValues = [];
        //gather global indices
        for(let i=0 ; i< Node.disabled.length; i++){
            if(Node.disabled[i][0] == this.id){
                removeValues.push(Node.disabled[i]);
                let target = Node.disabled[i][1];
                Node.nodes[target].links.length--;
                $(`#${Node.nodes[target].links_id + '_' + this.id}`).remove();
                if(Node.nodes[target].links.length == 0){
                    $(`#none_${Node.nodes[target].id}`).show();
                }
            }
            if(Node.disabled[i][1] == this.id){
                removeValues.push(Node.disabled[i]);
                let target = Node.disabled[i][0];
                Node.nodes[target].links.length--;
                $(`#${Node.nodes[target].links_id + '_' + this.id}`).remove();
                if(Node.nodes[target].links.length == 0){
                    $(`#none_${Node.nodes[target].id}`).show();
                }
            }
        }
        //remove index from global links
        for(let i=0; i< removeValues.length; i++){
            Node.disabled.splice(Node.disabled.indexOf(removeValues[i]),1);
        }
        //remove from local links
        for(const[key, value] of Object.entries(this.links)){
            if(key != 'length'){
                Node.nodes[key].removelink(this.id);
                if(this.id in Node.nodes[key].disabledLinks){
                    delete Node.nodes[key].disabledLinks[this.id];
                }
            }
        }
        //remove from global nodes list
        delete Node.nodes[this.id];
        //redraw links
        Node.drawLines();
        //remove table entries and recalculate
        Node.SPF();
        for(const[target, node] of Object.entries(Node.nodes)){
            node.updateTable();
            $(`#${node.paths_id + '_' + this.id}`).remove();
        }
        this.run_clock = null;
        this.ping = null;
    }

    removelink(id, remove = true){
        delete this.links[id];
        
        if(remove){
            this.links.length--;
            $(`#${this.links_id + '_' + id}`).remove();
        }
        if(this.links.length == 0){
            $(`#none_${this.id}`).show();
        }
    }

    //changes the weight of a link between two nodes
    changeWeight(event){
        let id = $(event.target).attr('id');
        let weight = $(event.target).val();
        let target_id = id.substring(this.weight_id.length + '_'.length, id.length);

        if(this.links[target_id] !== undefined){
            this.links[target_id] = parseInt(weight);
            Node.nodes[target_id].links[this.id] = parseInt(weight);
            $(`#${Node.nodes[target_id].weight_id + '_' + this.id}`).val(weight);
        }

        //calculate forwarding table for all nodes
        Node.SPF();
        for(const[target, node] of Object.entries(Node.nodes)){
            node.updateTable();
        }
    }

    //draws the links on the canvas
    static drawLines(){
        ctx.clearRect(0,0, canvas.width, canvas.height);
        Node.links.forEach((node_pair)=>{
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
            ctx.strokeStyle = "#000000";
            ctx.stroke();
        });
        //disabled links
        Node.disabled.forEach((node_pair)=>{
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
            ctx.strokeStyle = "#FF0000";
            ctx.stroke();
        });
    }

    //adds the node positionally to the screen
    placeNode(){
        let left = Math.floor(Math.random()*80) + 10;
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

    //creates the node image
    createNode(top, left){
        return `
        <img 
            src='img/node.svg' 
            draggable='false' 
            class='node' 
            id='${this.node_id}' 
            style=
                'top: ${top}%; 
                left: ${left}%;'
        ></img>`
    }
    
    //creates the html for the node menu
    createMenu(top, left){
        return `
        <div draggable='false' id='${this.menu_id}' style='top: ${top}%; left: ${left}%; display: none; position: absolute;'>
            <table>
                <thead>
                    <th>Node ${this.id}</th>
                </thead>
                <tbody>
                    <tr><td>
                        <table id='${'table_' + this.links_id}' colspan=2>
                            <thead>
                                <th colspan=4>Links: <button class='next' id='${this.next_id}' >></button></th>
                            </thead>
                            <tbody id='${this.links_id}'>
                                <tr><td><b>Link</b></td><td><b>Weight</b></td><td><b>Toggle</b></td><td><b>Delete</b></td></tr>
                                <tr id='none_${this.id}'>
                                    <td>None</td>
                                    <td><input style="width: 50px" type='number' min='0' value=0 disabled/></td>
                                    <td><button style='width: 100%' disabled>-</button></td>
                                    <td><button style='width: 100%' disabled>x</button></td>
                                </tr>
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
                                    <td><button id='${this.disable_id}' style='width: 100%'>Disable</button></td>
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

    //creates the forwearding table for the node menu
    createForwardingTable(){
        this.forwarding = {};
        for(const[target, step] of Object.entries(this.path)){
            let targ = target;
            let hop = step;
            this.forwarding[target] = targ;
            while(targ != hop){
                this.forwarding[target] += hop;
                targ = hop;
                hop = this.path[hop];
            }
            this.forwarding[target] += (this.forwarding[target].includes(hop)) ? "" : hop;
            this.forwarding[target] = this.forwarding[target].split("").reverse().join("")[0];
        }
    }

    //gets the next node for dijkstras algorithm
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

    //implements the shortest path first algorithm for a single node
    nodeSPF(){
        let node_id = this.id;
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
                for(const[neighbor, weight] of Object.entries(Node.nodes[u].links)){
                    if(neighbor == 'length' || Node.nodes[neighbor].disabled || Node.disabled.includes([neighbor, Node.nodes[u].id]) || Node.disabled.includes([Node.nodes[u].id, neighbor])){
                        continue;
                    }
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
        this.distances = dist;
        this.path = previous;
        this.createForwardingTable();
    }

    //implements the shortest path first algorithm
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
                    for(const[neighbor, weight] of Object.entries(Node.nodes[u].links)){
                        if(neighbor == 'length' || Node.nodes[neighbor].disabled || Node.disabled.includes([neighbor, Node.nodes[u].id]) || Node.disabled.includes([Node.nodes[u].id, neighbor])){
                            continue;
                        }
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

