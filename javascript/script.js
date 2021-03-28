let movingNode = null;
let count = 0;
let main = null;
let isDown = false;
let wasDragging = false;
let nodePrefix = 'node_';
let menuPrefix = 'menu_';
let connecting = false;
let connectingNode = null;
let ctx = null;
let connections = [];

$().ready(function(){
    main = $('#main');
    let canvas = document.getElementById('canvas');
    canvas.setAttribute('width', main.width());
    canvas.setAttribute('height', main.height());
    ctx = canvas.getContext("2d");

    main.on('mousedown', '.node', function(){
        isDown = true;
        movingNode = $(this);
    });
    main.on('mousemove', function(event){
        if(isDown){
            node = movingNode;
            id_num = node.attr('id').substring(nodePrefix.length);
            menu = $('#' + menuPrefix + id_num);
            wasDragging = true;
            let x = event.pageX;
            let y = event.pageY;

            let width = node.width();
            let height = node.height();

            let menu_width = menu.width();
            let menu_height = menu.height();

            let top = main.position().top;
            let bottom = top + main.outerHeight(true);
            let left = main.position().left;
            let right = left + main.outerWidth(true);


            if (y > top + height/2 && y < bottom - height/2 && x > left + width/2 && x < right - width/2){    
                let x_adj = x - width/2;
                let y_adj = y - height/2;
                node.css('left', x_adj+'px');
                node.css('top', y_adj+'px');

                let menu_x_adj = x - menu_width/2;
                let menu_y_adj = y - menu_height/2;
                let menu_y_shift = height/2 + menu_height/2;
                menu.css('left', menu_x_adj);
                menu.css('top', menu_y_adj + menu_y_shift);
            }

            ctx.clearRect(0,0, canvas.width, canvas.height);
            for(const [start, end] of Object.entries(connections)){
                drawLine(start, end);
            }

        }
    });
    main.on('mouseup', function(){
        isDown = false;
    });
});

function addNode(){
    let node_id = nodePrefix + count;
    let menu_id = menuPrefix + count;
    count++;
    let left = Math.floor(Math.random()*80);
    let top = Math.floor(Math.random()*80) + 10;
    let node = $(createNode(node_id, top, left)).appendTo(main);
    let menu = $(createMenu(menu_id, top, left)).appendTo(main);

    let width = node.width();
    let height = node.height();

    let menu_width = menu.width();
    let menu_height = menu.height();

    //adjust width and height to be middle of point
    let x = node.position().left;
    let y = node.position().top;
    let x_adj = x - width/2;
    let y_adj = y - height/2;
    node.css('left', x_adj+'px');
    node.css('top', y_adj+'px');

    let menu_x_adj = x - menu_width/2;
    let menu_y_adj = y - menu_height/2;
    let menu_y_shift = height/2 + menu_height/2;
    menu.css('left', menu_x_adj);
    menu.css('top', menu_y_adj + menu_y_shift);
}

function addConnection(button){
    connecting = true;
    connectingNode = $('#' + nodePrefix + $(button).closest('div').attr('id').substring(menuPrefix.length));
}

function clickNode(node){
    node = $(node);
    if(connecting && node != connectingNode){
        drawLine(node.attr('id'), connectingNode.attr('id'));
        connections[node.attr('id')] = connectingNode.attr('id');
        connecting = false;
        connectingNode = null;
    }
    else{
        if(!wasDragging){
            let id_num = node.attr('id').substring(nodePrefix.length);
            $('#' + menuPrefix +id_num).toggle();
        }
        else{
            wasDragging = false;
        }
    }
}

function drawLine(start_node, end_node){
    start_node = $(`#${start_node}`);
    end_node = $(`#${end_node}`);
    ctx.lineWidth = 1;
    ctx.beginPath();
    x_start = start_node.position().left + start_node.width()/2;
    y_start = start_node.position().top - $('.top-bar').height() + start_node.height()/2;
    x_end = end_node.position().left + end_node.width()/2;
    y_end = end_node.position().top - $('.top-bar').height() + end_node.height()/2;
    ctx.moveTo(x_start, y_start);
    ctx.lineTo(x_end, y_end);
    ctx.stroke();
}

function createNode(node_id, top, left){
    return `
    <img 
        src='img/frog.svg' 
        draggable='false' 
        class='node' 
        id='${node_id}' 
        style=
            'top: ${top}%; 
            left: ${left}%;'
        onclick=clickNode(this)
    ></img>`
}

function createMenu(menu_id, top, left){
    return `
    <div draggable='false' id='${menu_id}' style='top: ${top}%; left: ${left}%; display: none; position: absolute;'>
        <table>
            <thead>
                <th>Node</th>
            </thead>
            <tbody>
                <tr><td>
                    <table>
                        <thead>
                            <th>Connections:</th>
                        </thead>
                        <tbody>
                            <tr><td>Testing</td></tr>
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
                                <td><button onclick=addConnection(this)>Connect</button></td>
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