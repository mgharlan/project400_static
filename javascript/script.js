let movingNode = null;
let count = 0;
let canvas = null;
let isDown = false;
let wasDragging = false;
let nodePrefix = 'node_';
let menuPrefix = 'menu_';
let connecting = false;
let connectingNode = null;

$().ready(function(){
    canvas = $('#canvas');
    let lines = document.getElementById('lines');
    ctx = lines.getContext("2d");

    canvas.on('mousedown', '.frog', function(){
        isDown = true;
        movingNode = $(this);
    });
    canvas.on('mousemove', function(event){
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

            let top = canvas.position().top;
            let bottom = top + canvas.outerHeight(true);
            let left = canvas.position().left;
            let right = left + canvas.outerWidth(true);


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
        }
    });
    canvas.on('mouseup', function(){
        isDown = false;
    });

    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(50, 50);
    ctx.stroke();
});

function addNode(){
    let node_id = nodePrefix + count;
    let menu_id = menuPrefix + count;
    count++;
    let left = Math.floor(Math.random()*80);
    let top = Math.floor(Math.random()*80) + 10;
    let node = $(createNode(node_id, top, left)).appendTo(canvas);
    let menu = $(createMenu(menu_id, top, left)).appendTo(canvas);

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
    console.log(connectingNode);
}

function clickNode(node){
    if(connecting){
        connecting = false;
        console.log(node);
    }
    else{
        if(!wasDragging){
            let id_num = $(node).attr('id').substring(nodePrefix.length);
            $('#' + menuPrefix +id_num).toggle();
        }
        else{
            wasDragging = false;
        }
    }
}

function createNode(node_id, top, left){
    return `
    <img 
        src='img/frog.svg' 
        draggable='false' 
        class='frog' 
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