
function FluidField2() {


    var uiCallback;
    let self = this;
    this.fluidSolver = {}
    function Field(dens, u, v) {
        // Just exposing the fields here rather than using accessors is a measurable win during display (maybe 5%)
        // but makes the code ugly.
        this.setDensity = function(x, y, d) {
            dens[(x + 1) + (y + 1) * rowSize] = d;
        };
        this.getDensity = function(x, y) {
            return dens[(x + 1) + (y + 1) * rowSize];
        };
        this.getAvgDensity = function() {
            return dens.reduce((s, c) => s + c, 0) / dens.length;
        };
        this.getMaxDensity = function() {
            return dens.reduce((m, c) => c > m ? c : m);
        };
        this.setVelocity = function(x, y, xv, yv) {
            u[(x + 1) + (width + 2) * (y + 1)] = xv;
            v[(x + 1) + (y + 1) * rowSize] = yv;
        };
        this.getXVelocity = function(x, y) {
            return u[(x + 1) + (y + 1) * rowSize];
        };
        this.getYVelocity = function(x, y) {
            return v[(x + 1) + (y + 1) * rowSize];
        };
        this.width = function() {
            return width;
        };
        this.height = function() {
            return height;
        };
    }

    this.getFieldInfo = function() {
        return new Field(dens, u, v);
    };


    function applyPhysics() {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let d = dens[(x + 1) + (y + 1) * rowSize];
                let p = d * 1.5;
                dens[(x + 1) + (y + 1) * rowSize] = d*0.9;
                let r = 1;
                let rng = Math.random() * r - r / 2;
                u_prev[(x + 1) + (y + 1) * rowSize] = rng;
                v_prev[(x + 1) + (y + 1) * rowSize] = -Math.pow(d / 100, 0.4) / 1.2;

            }
        }
    }

    this.update = function(fps) {
        [dens_prev, u_prev, v_prev].forEach(x => x.fill(0));
        applyPhysics(); // modify x_prev according to dens u et v
        uiCallback(new Field(dens_prev, u_prev, v_prev)); // modify x_prev according to user actions
        this.fluidSolver.update();
        displayFunc(new Field(dens, u, v));

    };
    this.setDisplayFunction = function(func) {
        displayFunc = func;
    };


    this.iterations = function() {
        return iterations;
    };
    this.setIterations = function(iters) {
        if (iters > 0 && iters <= 100)
            iterations = iters;
    };
    this.setUICallback = function(callback) {
        uiCallback = callback;
    };
    var iterations = 10;
    var visc = 0;
    var dt = 0.1;
    var dens;
    var dens_prev;
    var u;
    var u_prev;
    var v;
    var v_prev;
    var width;
    var height;
    var rowSize;
    var size;
    var displayFunc;

    function reset() {
        rowSize = width + 2;
        size = (width + 2) * (height + 2);
        dens = new Array(size);
        dens_prev = new Array(size);
        u = new Array(size);
        u_prev = new Array(size);
        v = new Array(size);
        v_prev = new Array(size);
        for (var i = 0; i < size; i++)
            dens_prev[i] = u_prev[i] = v_prev[i] = dens[i] = u[i] = v[i] = 0;
    }
    this.reset = reset;
    this.setResolution = function(hRes, wRes) {
        width = wRes;
        height = hRes;

        reset();

        this.fluidSolver = new FluidField(width, height, Math.pow(10,-10), Math.pow(10,-10));
        dens = this.fluidSolver.densityField;
        u = this.fluidSolver.xVelocityField;
        v = this.fluidSolver.yVelocityField;
        dens_prev = this.fluidSolver.densitySourceField;
        u_prev = this.fluidSolver.xVelocitySourceField;
        v_prev = this.fluidSolver.yVelocitySourceField;
    };


}
