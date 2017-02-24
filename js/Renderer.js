class Renderer {
    constructor(simulation, canvas) {
        this.simulation = simulation;
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.context.imageSmoothingEnabled = false;

        this.canvasBuffer = document.createElement('canvas');
        this.contextBuffer = this.canvasBuffer.getContext("2d");
        this.imageDataBuffer = context.createImageData(simulation.width, simulation.height);
        this.imageBuffer = new Image();
    }

    render() {
        let canvas = this.canvas;
        let canvasBuffer = this.canvasBuffer;
        let data = this.imageDataBuffer.data;

        // edit buffer data
        // data[] = 0;

        // put image data on canvas buffer
        this.contextBuffer.putImageData(this.imageDataBuffer);

        // create image from canvas buffer
        this.imageBuffer.src = canvasBuffer.toDataUrl();

        // draw scaled-up image on real canvas once it is ready:
        this.imageBuffer.onload = () => {
            this.context.drawImage(canvasBuffer, 0, 0, canvasBuffer.width, canvasBuffer.height, 0, 0, canvas.width, canvas.height);
        }
    }
}
