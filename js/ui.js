onmouseup = function() {
    mouseIsDown = false;
}


var frames = 0;
var force = 5;
var source = 100;
var sources = [];
var omx, omy;
var mx, my;
var mouseIsDown = false;
var res;
var displaySize;
var fieldRes;
var canvas;
var running = false;
var start = new Date;
var frames = 0;


function prepareFrame(field) {
    for (let x = 0; x < displaySize; x++) {
        for (let y = 0; y < displaySize; y++) {
            let d = Math.min(field.getDensity(x, y) - 0.01, 0);
            field.setDensity(x, y, d);
        }
    }
    if ((omx >= 0 && omx < displaySize && omy >= 0 && omy < displaySize) && mouseIsDown) {
        var dx = mx - omx;
        var dy = my - omy;
        var length = (Math.sqrt(dx * dx + dy * dy) + 0.5) | 0;
        if (length < 1) length = 1;
        for (var i = 0; i < length; i++) {
            var x = (((omx + dx * (i / length)) / displaySize) * field.width()) | 0
            var y = (((omy + dy * (i / length)) / displaySize) * field.height()) | 0;
            field.setVelocity(x, y, dx, dy);
            field.setDensity(x, y, 50);
        }
        omx = mx;
        omy = my;
    }
    for (var i = 0; i < sources.length; i++) {
        var x = ((sources[i][0] / displaySize) * field.width()) | 0;
        var y = ((sources[i][1] / displaySize) * field.height()) | 0;
        field.setDensity(x, y, 50);
    }

}

function stopAnimation() {
    running = false;
    clearTimeout(interval);
}

function startAnimation() {
    if (running)
        return;
    running = true;
    interval = setTimeout(updateFrame, 10);
}

function updateFrame() {
    field.update();
    var end = new Date;
    frames++;
    if ((end - start) > 1000) {
        console.log("FPS: " + ((1000 * frames / (end - start) + 0.5) | 0));
        start = end;
        frames = 0;
    }
    if (running)
        interval = setTimeout(updateFrame, 10);
}



window.onload = function() {
    canvas = document.getElementById("canvas");
    field = new FluidField(canvas);
    document.getElementById("iterations").value = 10;
    res = document.getElementById("resolution");
    field.setUICallback(prepareFrame);
    updateRes = function() {
        var r = parseInt(res.value);
        canvas.width = r;
        canvas.height = r;
        displaySize = r;
        fieldRes = r;
        field.setResolution(r, r);
    }
    updateRes();

    canvas.onmousedown = function(event) {
        omx = mx = event.layerX;
        omy = my = event.layerY;
        if (!event.altKey && event.button == 0)
            mouseIsDown = true;
        else
            sources.push([mx, my]);
        event.preventDefault();
        return false;
    }
    canvas.onmousemove = function(event) {
        mx = event.layerX;
        my = event.layerY;
    }
    field.setDisplayFunction(toggleDisplayFunction(canvas));
    startAnimation();
}
