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
    for (let x = 0; x < field.width(); x++) {
        for (let y = 0; y < field.height() ; y++) {
            let d = field.getDensity(x, y)
            let p = Math.min(d, 40);
            field.setDensity(x, y, -p);
            let rng = Math.random() * 0.6 - 0.3;
            field.setVelocity(x, y, rng, -d/50);
        }
    }
    if ((omx >= 0 && omx < displaySize && omy >= 0 && omy < displaySize) && mouseIsDown) {
        var dx = mx - omx;
        var dy = my - omy;
        var length = (Math.sqrt(dx * dx + dy * dy) + 0.5) | 0;
        if (length < 1) length = 1;
        for (var i = 0; i < length; i++) {
            var x = (((omx + dx * (i / length)) / displaySize) * field.width()) | 0;
            var y = (((omy + dy * (i / length)) / displaySize) * field.height()) | 0;
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    if (x + j - 2 >= 0 && x + j - 2 < displaySize && y + k - 2 >= 0 && y + k - 2 < displaySize) {
                        field.setVelocity(x + j - 2, y + k - 2, dx / 2, dy / 2 - 1);
                        field.setDensity(x + j - 2, y + k - 2, 100);
                    }
                }
            }
        }
        omx = mx;
        omy = my;
    }
    for (var i = 0; i < sources.length; i++) {
        var x = ((sources[i][0] / displaySize) * field.width()) | 0;
        var y = ((sources[i][1] / displaySize) * field.height()) | 0;
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                if (x + j - 2 >= 0 && x + j - 2 < displaySize && y + k - 2 >= 0 && y + k - 2 < displaySize) {
                    field.setDensity(x + j - 2, y + k - 2, 100);
                    field.setVelocity(x + j - 2, y + k - 2, 0, - 2);
                }
            }
        }
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
        document.getElementById("fps").innerHTML = "FPS: " + ((1000 * frames / (end - start) + 0.5) | 0);
        let fieldInfo = field.getFieldInfo();
        document.getElementById("avg").innerHTML = fieldInfo.getAvgDensity().toFixed(3);
        document.getElementById("max").innerHTML = fieldInfo.getMaxDensity().toFixed(3);
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
