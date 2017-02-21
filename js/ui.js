// HACK: lol wtf 
window.onmouseup = function() {
    mouseIsDown = false;
};


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

    if ((omx >= 0 && omx < displaySize && omy >= 0 && omy < displaySize) && mouseIsDown) {
        var dx = mx - omx;
        var dy = my - omy;
        var length = (Math.sqrt(dx * dx + dy * dy) + 0.5) | 0;
        if (length < 1) length = 1;
        for (var i = 0; i < length; i++) {
            var x = (((omx + dx * (i / length)) / displaySize) * field.width()) | 0;
            var y = (((omy + dy * (i / length)) / displaySize) * field.height()) | 0;
            let radius = 3;
            for (let j = 0; j < 2*radius+1; j++) {
                for (let k = 0; k < 2*radius+1; k++) {
                    let px = x + j - radius;
                    let py = y + k - radius;
                    let dist = Math.pow((j-radius)*(j-radius)+(k-radius)*(k-radius), 0.5);
                    let val = 100 * (1 - dist / Math.pow(2*radius*radius,0.5));
                    val = val > 100 ? 100 : val;
                    val = val < 0 ? 0 : val;
                    if (px >= 0 && px < displaySize && py >= 0 && py < displaySize) {
                        field.setVelocity(px, py, dx / 2, dy / 2 );
                        field.setDensity(px, py, val);
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
        for (let j = 0; j < 5; j++) {
            for (let k = 0; k < 5; k++) {
                if (x + j - 2 >= 0 && x + j - 2 < displaySize && y + k - 2 >= 0 && y + k - 2 < displaySize) {
                    field.setDensity(x + j - 2, y + k - 2, 100);
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
        omx = mx = event.offsetX;
        omy = my = event.offsetY;
        if (!event.altKey && event.button == 0)
            mouseIsDown = true;
        else
            sources.push([mx, my]);
        event.preventDefault();
        return false;
    }
    canvas.onmousemove = function(event) {
        mx = event.offsetX;
        my = event.offsetY;
    }
    field.setDisplayFunction(toggleDisplayFunction(canvas));
    startAnimation();
}
