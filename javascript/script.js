$().ready(function(){
    let movingNode = null;
    let count = 0;
    let canvas = $('#canvas');
    let isDown = false;
    let wasDragging = false;
    let nodePrefix = 'node_';
    let menuPrefix = 'menu_';

    let lines = document.getElementById('lines');
    ctx = lines.getContext("2d");

    $('#add').click(function(){
        let node_id = nodePrefix + count;
        let menu_id = menuPrefix + count;
        count++;
        let left = Math.floor(Math.random()*80);
        let top = Math.floor(Math.random()*80) + 10;
        node = $(`<img src='frog.svg' draggable='false' class='frog' id='${node_id}' style='top: ${top}%; left: ${left}%;'></img>`).appendTo(canvas);
        menu = $(`<span draggable='false' class='dot' id='${menu_id}' style='top: ${top}%; left: ${left}%; display: none;'></span>`).appendTo(canvas);

        //adjust width and height to be middle of point
        let x = node.position().left;
        let y = node.position().top;
        let x_adj = x - node.width()/2;
        let y_adj = y - node.height()/2;
        node.css('left', x_adj+'px');
        node.css('top', y_adj+'px');

        let menu_x_adj = x - menu.width()/2;
        let menu_y_adj = y - menu.height()/2;
        menu.css('left', menu_x_adj);
        menu.css('top', menu_y_adj);

    });

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
                menu.css('left', menu_x_adj);
                menu.css('top', menu_y_adj);
            }
        }
    });
    canvas.on('mouseup', function(){
        isDown = false;
    });
    canvas.on('click', '.frog', function(){
        if(!wasDragging){
            let id_num = $(this).attr('id').substring(nodePrefix.length);
            $('#' + menuPrefix +id_num).toggle();
        }
        else{
            wasDragging = false;
        }
    });

    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(50, 50);
    ctx.stroke();
});