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
var canvas;
var running = false;
var start = new Date;
var frames = 0;


function prepareFrame(field) {
    let w = canvas.width;
    let h = canvas.height;

    if ((omx >= 0 && omx < w && omy >= 0 && omy < h) && mouseIsDown) {
        var dx = mx - omx;
        var dy = my - omy;
        var length = (Math.sqrt(dx * dx + dy * dy) + 0.5) | 0;
        if (length < 1) length = 1;
        for (var i = 0; i < length; i++) {
            var x = (((omx + dx * (i / length)) / w) * field.width()) | 0;
            var y = (((omy + dy * (i / length)) / h) * field.height()) | 0;
            let radius = 6;
            for (let j = 0; j < 2*radius+1; j++) {
                for (let k = 0; k < 2*radius+1; k++) {
                    let px = x + j - radius;
                    let py = y + k - radius;
                    let dist = Math.pow((j-radius)*(j-radius)+(k-radius)*(k-radius), 0.5);
                    let val = 100 * (1 - dist / Math.pow(2*radius*radius,0.5));
                    val = val > 100 ? 100 : val;
                    val = val < 0 ? 0 : val;
                    if (px >= 0 && px < w && py >= 0 && py < h) {
                        field.setVelocity(px, py, dx / 2, dy / 2 );
                        field.setDensity(px, py, val);
                    }
                }
            }
        }
        omx = mx;
        omy = my;
    }
    sources = [[39,170]];
    for (var i = 0; i < sources.length; i++) {
        var x = ((sources[i][0] / w) * field.width()) | 0;
        var y = ((sources[i][1] / h) * field.height()) | 0;
        field.setDensity(x, y, 500);
        /*
        for (let j = 0; j < 5; j++) {
            for (let k = 0; k < 5; k++) {
                if (x + j - 2 >= 0 && x + j - 2 < w && y + k - 2 >= 0 && y + k - 2 < h) {
                    field.setDensity(x + j - 2, y + k - 2, 100);
                }
            }
        }*/
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
    canvas.width = 80;
    canvas.height = 180;
    field.setResolution(canvas.height, canvas.width);
    field.setUICallback(prepareFrame);

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
