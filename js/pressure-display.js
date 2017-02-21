if (this.CanvasRenderingContext2D && !CanvasRenderingContext2D.createImageData) {
    CanvasRenderingContext2D.prototype.createImageData = function(w, h) {
        return this.getImageData(0, 0, w, h);
    }
}
(function() {
    var buffer;
    var bufferData;
    var canvas;
    var clampData = false;

    function prepareBuffer(field) {
        canvas = canvas || document.getElementById("canvas");
        if (buffer && buffer.width == field.width() && buffer.height == field.height())
            return;
        buffer = document.createElement("canvas");
        buffer.width = field.width();
        buffer.height = field.height();
        var context = buffer.getContext("2d");
        try {
            bufferData = context.createImageData(field.width(), field.height());
        } catch (e) {
            return null;
        }
        if (!bufferData)
            return null;
        var max = field.width() * field.height() * 4;
        for (var i = 3; i < max; i += 4)
            bufferData.data[i] = 255;
        bufferData.data[0] = 256;
        if (bufferData.data[0] > 255)
            clampData = true;
        bufferData.data[0] = 0;
    }

    function displayDensity(field) {
        prepareBuffer(field);
        var context = canvas.getContext("2d");
        var width = field.width();
        var height = field.height();
        var data = bufferData.data;

        for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
                let c = field.getDensity(x, y);
                if (c >= 45) {
                    data[((y * (width * 4)) + (x * 4)) + 3] = 255;
                    data[((y * (width * 4)) + (x * 4)) + 2] = 255;
                    data[((y * (width * 4)) + (x * 4)) + 1] = 210;
                    data[((y * (width * 4)) + (x * 4)) + 0] = 210;
                } else if (c >= 18) {
                    data[((y * (width * 4)) + (x * 4)) + 3] = 255;
                    data[((y * (width * 4)) + (x * 4)) + 2] = 0;
                    data[((y * (width * 4)) + (x * 4)) + 1] = 165;
                    data[((y * (width * 4)) + (x * 4)) + 0] = 255;
                } else if (c >= 4) {
                    data[((y * (width * 4)) + (x * 4)) + 3] = 255;
                    data[((y * (width * 4)) + (x * 4)) + 2] = 0;
                    data[((y * (width * 4)) + (x * 4)) + 1] = 45;
                    data[((y * (width * 4)) + (x * 4)) + 0] = 255;
                } else if (c >= 3.8) {
                    data[((y * (width * 4)) + (x * 4)) + 3] = 255;
                    data[((y * (width * 4)) + (x * 4)) + 2] = 0;
                    data[((y * (width * 4)) + (x * 4)) + 1] = 0;
                    data[((y * (width * 4)) + (x * 4)) + 0] = 0;
                } else if (c >= 1) {
                    data[((y * (width * 4)) + (x * 4)) + 3] = 255;
                    data[((y * (width * 4)) + (x * 4)) + 2] = 10;
                    data[((y * (width * 4)) + (x * 4)) + 1] = 10;
                    data[((y * (width * 4)) + (x * 4)) + 0] = 10;
                } else if (c >= 0.2) {
                    data[((y * (width * 4)) + (x * 4)) + 3] = 255;
                    data[((y * (width * 4)) + (x * 4)) + 2] = 30;
                    data[((y * (width * 4)) + (x * 4)) + 1] = 30;
                    data[((y * (width * 4)) + (x * 4)) + 0] = 30;
                } else {
                    data[((y * (width * 4)) + (x * 4)) + 3] = 255;
                    data[((y * (width * 4)) + (x * 4)) + 2] = 0;
                    data[((y * (width * 4)) + (x * 4)) + 1] = 0;
                    data[((y * (width * 4)) + (x * 4)) + 0] = 0;
                }
            }
        }
        context.putImageData(bufferData, 0, 0);



        canvasZoom = canvasZoom || document.getElementById("canvasZoom");
        let ctxZoom = canvasZoom.getContext("2d");
        ctxZoom.imageSmoothingEnabled = false;
        ctxZoom.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvasZoom.width, canvasZoom.height);
    }

    function displayVelocity(field) {
        var context = canvas.getContext("2d");
        context.save();
        context.lineWidth = 1;
        var wScale = canvas.width / field.width();
        var hScale = canvas.height / field.height();
        context.fillStyle = "black";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = "rgb(0,255,0)";
        var vectorScale = 20;
        context.beginPath();
        for (var x = 0; x < field.width(); x += 10) {
            for (var y = 0; y < field.height(); y += 10) {
                context.moveTo(x * wScale + 0.5 * wScale, y * hScale + 0.5 * hScale);
                context.lineTo((x + 0.5 + vectorScale * field.getXVelocity(x, y)) * wScale,
                    (y + 0.5 + vectorScale * field.getYVelocity(x, y)) * hScale);
            }
        }
        context.stroke();
        context.restore();

        canvasZoom = canvasZoom || document.getElementById("canvasZoom");
        let ctxZoom = canvasZoom.getContext("2d");
        ctxZoom.imageSmoothingEnabled = false;
        ctxZoom.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvasZoom.width, canvasZoom.height);

    }
    var showVectors = false;
    toggleDisplayFunction = function(canvas) {
        if (showVectors) {
            showVectors = false;
            return displayVelocity;
        }
        showVectors = true;
        return displayDensity;
    }
})();
