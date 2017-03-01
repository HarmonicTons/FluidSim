class Renderer {
    constructor(simulation, canvas, displayDensity = true, displayVelocity = false) {
        this.simulation = simulation;
        this.canvas = canvas;
        this.displayDensity = displayDensity;
        this.displayVelocity = displayVelocity;

        // display canvas
        this.context = canvas.getContext("2d");
        this.context.imageSmoothingEnabled = false;
        // create buffer canvas
        this.canvasBuffer = document.createElement('canvas');
        this.canvasBuffer.width = simulation.width;
        this.canvasBuffer.height = simulation.height;
        this.contextBuffer = this.canvasBuffer.getContext("2d");
        this.imageDataBuffer = this.contextBuffer.createImageData(simulation.width, simulation.height);
        this.imageBuffer = new Image();
    }

    render() {
        this.displayDensity && this.renderDensity();
        this.displayVelocity && this.renderVelocity();
    }

    renderDensity() {
        let canvas = this.canvas;
        let canvasBuffer = this.canvasBuffer;
        let data = this.imageDataBuffer.data;

        // edit buffer data
        this._renderFlame(data);

        // put image data on canvas buffer
        this.contextBuffer.putImageData(this.imageDataBuffer, 0, 0);

        // create image from canvas buffer
        this.imageBuffer.src = canvasBuffer.toDataURL();

        // draw scaled-up image on real canvas once it is ready:
        this.imageBuffer.onload = () => {
            this.context.drawImage(canvasBuffer, 0, 0, canvasBuffer.width, canvasBuffer.height, 0, 0, canvas.width, canvas.height);
        }
    }

    renderVelocity() {

        // TODO: render the velocity field with vector on each pixel

    }

    _renderFlame(data) {
        let w = this.simulation.width;
        let h = this.simulation.height;

        function setPixel(x, y, r, g, b, a = 255) {
            let i = y * w * 4 + x * 4;
            data[i + 0] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = a;
        }

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                let c = this.simulation.getDensity(x, y);
                let o = this.simulation.getObstacle(x,y);
                if (c >= 45) {
                    // rgb(210,210,255)
                    setPixel(x, y, 210, 210, 255);
                } else if (c >= 18) {
                    // rgb(255,165,0)
                    setPixel(x, y, 255, 165, 0);
                } else if (c >= 4) {
                    // rgb(255,45,0)
                    setPixel(x, y, 255, 45, 0);
                } else if (c >= 3.8) {
                    // rgb(0,0,0)
                    setPixel(x, y, 0, 0, 0);
                } else if (c >= 1) {
                    // rgb(10,10,10)
                    setPixel(x, y, 10, 10, 10);
                } else if (c >= 0.2) {
                    // rgb(30,30,30)
                    setPixel(x, y, 30, 30, 30);
                } else if (c >= 0) {
                    // rgb(0,0,0)
                    setPixel(x, y, 0, 0, 0);
                } else {
                    // rgb(0,0,255)
                    setPixel(x, y, 0, 0, 255);
                }

                if (o) {
                    // rgb(0,0,255)
                    setPixel(x, y, 0, 0, 255);
                }

            }
        }
    }
}
