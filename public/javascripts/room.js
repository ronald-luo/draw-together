window.addEventListener('load', () => {
    const socket = io();
    const roomID = document.querySelector('.roomID').id
    const canvas = document.querySelector('canvas');
    let stack = [];
    let redo = [];
    let start_over = '';
    let currentColor = document.querySelector('.userColor').id;
    let fillColor = '#000000';
    let currentSize = 10;
    let context = canvas.getContext('2d');
    let numClients = 1;

    // alert others of user connection

    start_over = canvas.toDataURL(); // store new canvas state

    // notify others when a client has joined

    socket.emit('join room', {room: roomID}) // helps server keep track of IDs in a room
    
    socket.on('alert others', (data) => {
        console.log(data.alert)
    })

    const updateRoomSize = (size) => {
        const users = document.querySelector('.active-users')
        const usersCount = document.querySelector('.active-user-count')
        const userNodes = document.querySelectorAll('.user')
        
        userNodes.forEach((node) => {
            node.remove()
        })

        for (let i = 0; i < size; i++) {
            const user = document.createElement('div')
            user.classList.add('user')
            users.appendChild(user)
        }

        usersCount.textContent = `${size} active users`
    };

    // update canvas when others draw
 
    socket.on('receive_draw', (data) => {
        resize()
        let destinationImage = new Image;

        destinationImage.onload = function(){
          context.drawImage(destinationImage, 0, 0);
        };
        destinationImage.src = data.png;

        updateRoomSize(data.roomSize);
    })

    // update server when user disconnects

    socket.on("disconnect", () => {
        socket.emit('leave room', {room: roomID})
    });

    // resizing 

    const resize = () => {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        context.strokeStyle = currentColor;
    }
    resize() // resize on start

    // color

    const setColor = () => {
        resize()
        context.strokeStyle = currentColor;
    }
    
    setColor() // set color start

    // no tool selected alert

    const noToolAlert = () => {
        /* Alert no tool selected */
        const noToolAlert = document.querySelector('.no-selected-tool')
        noToolAlert.classList.add('no-tool-alert');
        noToolAlert.textContent = 'Select a tool on the left.'

        setTimeout(() => {
            noToolAlert.classList.remove('no-tool-alert');
        }, 3000);
    }

    // painting

    let painting = false;

    // pen down

    const startPos = (e) => {
        const pencilActive = document.querySelector('#pencil-icon');
        const bucketActive = document.querySelector('#bucket-icon')

        if (bucketActive.classList.contains('activeIcon')) {
            fillScreen()
        }
        else if (pencilActive.classList.contains('activeIcon')) {
            context.beginPath();
            painting = true;
            draw(e)
        } else {
            noToolAlert()
        }
    }

    // bucket fill

    const fillScreen = () => {
        context.beginPath();
        context.rect(0, 0, window.innerWidth, window.innerHeight);
        context.fillStyle = fillColor;
        context.fill();

        // emit to server and push to stack

        socket.emit('send_draw', {png: canvas.toDataURL(), room: roomID}) // emit canvas to server
        stack.push(canvas.toDataURL()) // add current state to stack

        // reset redo stack if user draws and redo stack is not empty

        if (redo.length > 0) {
            redo = []
        }
    };

    // draw

    const draw = (e) => {
        if (!painting) {
            return
        }
        context.lineWidth = currentSize;
        context.lineCap = 'round';
        context.lineTo(e.clientX, e.clientY);
        context.stroke();
        context.beginPath();
        context.moveTo(e.clientX, e.clientY);
    }

    // pen up

    const stopPos = () => {
        const pencilActive = document.querySelector('#pencil-icon');

        if (pencilActive.classList.contains('activeIcon')) {
            painting = false;
            context.beginPath();
    
            // emit to server and push to stack
        
            socket.emit('send_draw', {png: canvas.toDataURL(), room: roomID}) // emit canvas to server
            stack.push(canvas.toDataURL()) // add current state to stack
    
            // reset redo stack if user draws and redo stack is not empty
    
            if (redo.length > 0) {
                redo = []
            }
        }
    }

    // undo functions

    const handleUndo = () => {
        if (stack.length > 0) {
            resize()
            redo.push(stack.pop());
    
            let img = new Image;
    
            img.onload = function() {
                context.drawImage(img, 0, 0);
            };
            img.src = stack.at(-1)

            socket.emit('send_draw', {png: stack.at(-1), room: roomID}) // emit canvas to server
        }
    }

    // redo functions

    const handleRedo = () => {
        if (redo.length > 0) {
            resize()
            stack.push(redo.pop())

            let img = new Image;

            img.onload = function() {
                context.drawImage(img, 0, 0);
            };

            img.src = stack.at(-1)

            socket.emit('send_draw', {png: stack.at(-1), room: roomID}) // emit canvas to server
        }
    }


    // check if cmd + z / ctrl + z pressed or cmd + y / ctrl + y pressed

    var keys = {}
    const undoRedoKeys = (e) => {
        let { keyCode, type } = e || Event; // to deal with IE
        let isKeyDown = (type == 'keydown');
        keys[keyCode] = isKeyDown;
    
        // cmd + z or ctrl + z
        if(isKeyDown && keys[91] && keys[90] || isKeyDown && keys[17] && keys[90]){
            handleUndo()
        }

        // cmd + y or ctrl + y
        if(isKeyDown && keys[91] && keys[89] || isKeyDown && keys[17] && keys[89]){
            handleRedo()
        }
    };

    // start over

    const handleRefresh = () => {
        if (stack.length > 0) {
            resize()
            let img = new Image;
    
            stack.push(start_over)
            img.onload = function() {
                context.drawImage(img, 0, 0);
            };
    
            img.src = start_over
    
            socket.emit('send_draw', {png: start_over, room: roomID}) // emit canvas to server

            if (redo.length > 0) {
                redo = []
            }
        } else {
            console.log('draw something first')
        }
    };

    // pencil settings

    var handlePencil = () => {

        // deactivate bucket icon if it is active
        const bucketActive = document.querySelector('#bucket-icon')
        if (bucketActive.classList.contains('activeIcon')) {
            handleBucket()
        }

        // add color picker

        handleColorPencil()

        const pencilIcon = document.querySelector('#pencil-icon');
        pencilIcon.classList.toggle('activeIcon');

        const pencilSettings = document.querySelector('.pencil-settings')
        pencilSettings.classList.toggle('pencilSettingsActive')
    };

    const changeSize = (e) => {
        currentSize = e.target.value;
        context.lineWidth = currentSize;
    }

    // color picker

    const handleColorPencil = () => {
        const colorSwitch = document.querySelector('.colorSwitch');
        colorSwitch.classList.toggle('colorSwitchActive');
    };

    const changeColorPencil = (e) => {
        currentColor = e.target.value;
        context.strokeStyle = currentColor;
    };


    // fill bucket

    var handleBucket = () => {

        // de-activate pencilIcon if it is active.
        const pencilActive = document.querySelector('#pencil-icon');

        if (pencilActive.classList.contains('activeIcon')) {
            handlePencil()
        }

        // toggle active icon
        const bucketIcon = document.querySelector('#bucket-icon');
        bucketIcon.classList.toggle('activeIcon');

        bucketIcon.toggleAttribute('isActive', 'isActive')
        document.body.classList.toggle('fill-crosshair') // toggle crosshair when fill is active

        // create color picker
        const fillSwitch = document.querySelector('.fillSwitch');
        fillSwitch.classList.toggle('fillSwitchActive');
    };

    const changeColorBucket = (e) => {
        fillColor = e.target.value;
    }

    // copy to clipboard

    const handleClipboard = () => {
        const idCopy = document.querySelector('.roomID').id;

        const copyText = document.createElement('input')
        copyText.value = idCopy
    
        copyTextToClipboard(window.location.href)

        /* Alert the copied text */
        const alertCopied =  document.querySelector('.copied-alert')
        alertCopied.classList.add('alert');
        alertCopied.textContent = `Room ${copyText.value} copied to clipboard.`
    
        setTimeout(() => {
            alertCopied.classList.remove('alert');
        }, 3000);
    }

    function fallbackCopyTextToClipboard(text) {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
      
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
      
        try {
          var successful = document.execCommand('copy');
          var msg = successful ? 'successful' : 'unsuccessful';
          console.log('Fallback: Copying text command was ' + msg);
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
        }
      
        document.body.removeChild(textArea);
    }

    function copyTextToClipboard(text) {
        if (!navigator.clipboard) {
            fallbackCopyTextToClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    }

    // event listeners

    canvas.addEventListener('mousedown', startPos)
    canvas.addEventListener('mouseup', stopPos)
    canvas.addEventListener('mousemove', draw)
    window.addEventListener('resize', resize)
    window.addEventListener("keyup", undoRedoKeys);
    window.addEventListener("keydown", undoRedoKeys);
    document.querySelector('#pencil-icon').addEventListener('click', handlePencil)
    document.querySelector('.sizeSwitch').addEventListener('input', changeSize)
    document.querySelector('#bucket-icon').addEventListener('click', handleBucket)
    document.querySelector('.fillSwitch').addEventListener('input', changeColorBucket);
    document.querySelector('.colorSwitch').addEventListener('input', changeColorPencil);
    document.querySelector('#undo-icon').addEventListener('click', handleUndo);
    document.querySelector('#redo-icon').addEventListener('click', handleRedo);
    document.querySelector('#new-icon').addEventListener('click', handleRefresh);
    document.querySelector('#clipboard').addEventListener('click', handleClipboard);
    document.querySelector('#clipboard').addEventListener('click', handlePencil);
});