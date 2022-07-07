window.addEventListener('load', () => {
    const socket = io();
    const roomID = document.querySelector('.roomID').id
    const stack = [];
    const redo = [];
    let start_over = '';

    const canvas = document.querySelector('canvas');
    let context = canvas.getContext('2d');

    // alert others of user connection

    socket.emit('join room', {room: roomID})

    start_over = canvas.toDataURL(); // store new canvas state
    
    
    socket.on('alert others', (data) => {
        console.log(data.alert)
        const users = document.querySelector('.active-users')
        const user = document.createElement('div')
        user.classList.add('user')
        users.appendChild(user)
    })

    // update canvas when other users draw

    socket.on('receive_draw', (data) => {
        resize()
        let destinationImage = new Image;

        destinationImage.onload = function(){
          context.drawImage(destinationImage, 0, 0);
        };
        destinationImage.src = data.png;
        // console.log(data.png)
        // context.drawImage(destinationImage, 0, 0);
        // console.log(destinationImage)
    })

    // resizing 

    const resize = () => {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
    }

    resize()

    window.addEventListener('resize', () => {
        resize()
    })

    // painting

    let painting = false;

    const startPos = (e) => {
        painting = true;
        draw(e)
    }

    const stopPos = () => {
        painting = false;
        context.beginPath();
        socket.emit('send_draw', {png: canvas.toDataURL(), room: roomID}) // emit canvas to server
        stack.push(canvas.toDataURL()) // add current state to stack
    }

    const draw = (e) => {
        if (!painting) {
            return
        }
        
        context.lineWidth = 10;
        context.lineCap = 'round';
        context.lineTo(e.clientX, e.clientY);
        context.stroke();
        context.beginPath();
        context.moveTo(e.clientX, e.clientY);
    }

    // event listeners

    canvas.addEventListener('mousedown', startPos)
    canvas.addEventListener('mouseup', stopPos)
    canvas.addEventListener('mousemove', draw)

    // undo

    document.querySelector('#undo-icon').addEventListener('click', () => {
        
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
    });

    // redo

    document.querySelector('#redo-icon').addEventListener('click', () => {
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
    });

    // start over

    document.querySelector('#new-icon').addEventListener('click', () => {
        resize()
        let img = new Image;

        stack.push(start_over)
        img.onload = function() {
            context.drawImage(img, 0, 0);
        };

        img.src = start_over

        socket.emit('send_draw', {png: start_over, room: roomID}) // emit canvas to server
    });

    // color picker

    document.querySelector('#color-icon').addEventListener('click', (e) => {
        let colorSwitch = document.querySelector('.colorSwitch');
        colorSwitch.classList.toggle('colorSwitchInactive')
    });

    document.querySelector('.colorSwitch').addEventListener('input', (e) => {
        context.strokeStyle = e.target.value
    });

    // copy to clipboard

    document.querySelector('#clipboard').addEventListener('click', () => {
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
    });

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

});