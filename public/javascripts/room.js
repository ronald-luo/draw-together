const socket = io();

window.addEventListener('load', () => {
    console.log('html loaded')

    const canvas = document.querySelector('canvas');
    let context = canvas.getContext('2d');

    socket.on('receive_draw', (data) => {
        // console.log(data.data)

        var destinationImage = new Image;

        destinationImage.onload = function(){
          context.drawImage(destinationImage,0,0);
        };
        destinationImage.src = data.png;

        context.drawImage(destinationImage, 0, 0);
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

    // event listeners

    let painting = false;

    const startPos = (e) => {
        painting = true;
        draw(e)
    }

    const stopPos = () => {
        painting = false;
        context.beginPath();

        socket.emit('send_draw', {png: canvas.toDataURL()})
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

    canvas.addEventListener('mousedown', startPos)
    canvas.addEventListener('mouseup', stopPos)
    canvas.addEventListener('mousemove', draw)
});
