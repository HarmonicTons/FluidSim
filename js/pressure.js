function Simulation() {
    this.cycles = 0; // nombre total d'iterations effectuées depuis le lancement de la simulation
    this.isPaused = true;
    this.stepDuration = 0.1;
    this.solverIterations = 10;
    this.fields = [];

    // 1 simulation = 1 ensemble de field
    // c'est la simulation qui sait où sont placer les fields dans l'univers du jeu
    // les fields eux-mêmes sont totalement ignorant de ce qui se passe en dehors de leurs bordures
    // c'est la simulation qui choisie de déplacer un field par exemple en fonction de la position des curseurs / sources
    // c'est la simulation qui controle la position des sources et des obstacles
    // 1 field ne contient que l'information de sont fluid

    this.start = function() {
        if (!this.isPaused) {
            console.log("The simulation is already running.");
            return;
        }
        this.isPaused = false;
        this.simulationLoop();
    }

    this.pause = function() {
        if (this.isPaused) {
            console.log("The simulation is already paused.");
            return;
        }
        this.isPaused = true;
    }

    this.ui = function() {
        return // renvoie un object permettant à d'indiquer les actions de l'utilisateur > impact userActions
    }

    this.simulationLoop = function() {
        if (this.isPaused) {
            return;
        }

        this.fields.forEach(field => {
            this.applyUserActions(field);
            this.applyPhysics(field);
            field.fluidSolver.nextStep();
        })

        this.cycles++;
        setTimeout(function() {
            this.simulationLoop()
        }, 0);
    }
}

function Field(w, h) {
    this.height = 0;
    this.width = 0;
    this.boundaries = []; // obstacles dans le champs
    this.size = (width + 2) * (height + 2); // TODO les + 2 disparaitrons quand les bords ne seront plus systématiques

    this.u = [...Array(this.size)].fill(0);
    this.v = [...Array(this.size)].fill(0);
    this.d = [...Array(this.size)].fill(0);
    this.u0 = [...Array(this.size)].fill(0);
    this.v0 = [...Array(this.size)].fill(0);
    this.d0 = [...Array(this.size)].fill(0);

    this.visc = 0;
    this.diff = 0;

    this.fluidSolver = new fluidSolver(this);
}



function FluidField() {


    var uiCallback;

    function Field(dens, u, v) {
        // Just exposing the fields here rather than using accessors is a measurable win during display (maybe 5%)
        // but makes the code ugly.
        this.setDensity = function(x, y, d) {
            dens[(x + 1) + (y + 1) * rowSize] = d;
        }
        this.getDensity = function(x, y) {
            return dens[(x + 1) + (y + 1) * rowSize];
        }
        this.getAvgDensity = function() {
            return dens.reduce((s, c) => s + c, 0) / dens.length;
        }
        this.getMaxDensity = function() {
            return dens.reduce((m, c) => c > m ? c : m);
        }
        this.setVelocity = function(x, y, xv, yv) {
            u[(x + 1) + (y + 1) * rowSize] = xv;
            v[(x + 1) + (y + 1) * rowSize] = yv;
        }
        this.getXVelocity = function(x, y) {
            return u[(x + 1) + (y + 1) * rowSize];
        }
        this.getYVelocity = function(x, y) {
            return v[(x + 1) + (y + 1) * rowSize];
        }
        this.width = function() {
            return width;
        }
        this.height = function() {
            return height;
        }
    }

    this.getFieldInfo = function() {
        return new Field(dens, u, v);
    }

    function queryUI(d, u, v) {
        // i think that's stupid do reset the prev vectors
        /*for (var i = 0; i < size; i++)
            u[i] = v[i] = d[i] = 0.0;*/
        uiCallback(new Field(d, u, v));
    }

    this.update = function() {
        queryUI(dens_prev, u_prev, v_prev);
        // insert fire physics here
        this.fluidSolver.nextStep();
        displayFunc(new Field(dens, u, v));

        // don't know if necessary or even a good idea to do that:
        for (var i = 0; i < size; i++) {
            u_prev[i] = u[i];
            v_prev[i] = v[i];
            dens_prev[i] = dens[i];
        }
    }
    this.setDisplayFunction = function(func) {
        displayFunc = func;
    }


    this.iterations = function() {
        return iterations;
    }
    this.setIterations = function(iters) {
        if (iters > 0 && iters <= 100)
            iterations = iters;
    }
    this.setUICallback = function(callback) {
        uiCallback = callback;
    }
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
        var res = wRes * hRes;
        if (res > 0 && res < 1000000 && (wRes != width || hRes != height)) {
            width = wRes;
            height = hRes;
            reset();
            return true;
        }
        return false;
    }
    this.setResolution(64, 64);

    this.fluidSolver = new FluidSolver({
        d: dens,
        u: u,
        v: v,
        d0: dens_prev,
        u0: u_prev,
        v0: v_prev,
        width: width,
        height: height,
        diff: 0,
        visc: 0
    });
}
