/**
 * 2D Fluid solver
 *
 * Original code in C written by Jos Stam.
 * http://www.dgp.toronto.edu/people/stam/reality/index.html
 * Adapted to JavaScript by Thomas Roncin.
 */

/**
 * Create a fluid solver
 * Use .nextStep() to solve and update the fluid field.
 * @param {Number} w width of the area
 * @param {Number} h height of the area
 * @param {Array} d field of density
 * @param {Array} u field of x-velocity
 * @param {Array} v field of y-velocity
 * @param {Array} d0 influence on the field of density to take into account
 * @param {Array} u0 influence on the field of x-velocity to take into account
 * @param {Array} v0 influence on the field of y-velocity to take into account
 * @param {Number} diff diffusion rate
 * @param {Number} visc viscosity
 */
function FluidSolver(w, h, d, u, v, d0, u0, v0, diff, visc, iterations = 10) {

    /**
     * Update the field by solving the next step
     * @param {Number} dt step's duration
     */
    this.nextStep = function(dt = 0.1) {
        dens_step(d, d0, u, v, diff, dt);
        vel_step(u, v, u0, v0, visc, dt);
        [d0, u0, v0].forEach(x => x.fill(0));
    };

    // Size and Index
    let N = w; // TODO adapt to a non square shape field
    let IX = (i, j) => i + (N + 2) * j;

    /**
     * For each cell
     * @param {Function} forStep
     */
    function FOR_EACH_CELL(forStep) {
        for (let i = 1; i <= N; i++) {
            for (let j = 1; j <= N; j++) {
                forStep(i, j);
            }
        }
    }

    /**
     * Add source
     * @param {Array} x
     * @param {Array} s
     * @param {Number} dt
     */
    function add_source(x, s, dt) {
        let size = (N + 2) * (N + 2);
        for (let i = 0; i < size; i++) {
            x[i] += dt * s[i];
        }
    }

    /**
     * Set boundaries
     * @param {Number} b
     * @param {Array} x
     */
    function set_bnd(b, x) {

        // TODO adapt to field.boundaries;

        for (let i = 1; i <= N; i++) {
            x[IX(0, i)] = b == 1 ? -x[IX(1, i)] : x[IX(1, i)];
            x[IX(N + 1, i)] = b == 1 ? -x[IX(N, i)] : x[IX(N, i)];
            x[IX(i, 0)] = b == 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
            x[IX(i, N + 1)] = b == 2 ? -x[IX(i, N)] : x[IX(i, N)];
        }
        x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
        x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
        x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
        x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
    }

    /**
     * Linear solver
     * @param {Number} b
     * @param {Array} x
     * @param {Array} x0
     * @param {Number} a
     * @param {Number} c
     */
    function lin_solve(b, x, x0, a, c) {
        let kMax = iterations;
        for (let k = 0; k < kMax; k++) {
            FOR_EACH_CELL((i, j) => {
                x[IX(i, j)] = (x0[IX(i, j)] + a * (x[IX(i - 1, j)] + x[IX(i + 1, j)] + x[IX(i, j - 1)] + x[IX(i, j + 1)])) / c;
            });
            set_bnd(b, x);
        }
    }

    /**
     * Diffuse
     * @param {Number} b
     * @param {Array} x
     * @param {Array} x0
     * @param {Number} diff
     * @param {Number} dt
     */
    function diffuse(b, x, x0, diff, dt) {
        let a = dt * diff * N * N;
        lin_solve(b, x, x0, a, 1 + 4 * a);
    }

    /**
     * Advect
     * @param {Number} b
     * @param {Array} d
     * @param {Array} d0
     * @param {Array} u
     * @param {Array} v
     * @param {Number} dt
     */
    function advect(b, d, d0, u, v, dt) {
        let dt0 = dt * N;
        FOR_EACH_CELL((i, j) => {
            let x = i - dt0 * u[IX(i, j)];
            let y = j - dt0 * v[IX(i, j)];

            if (x < 0.5) x = 0.5;
            if (x > N + 0.5) x = N + 0.5;
            let i0 = parseInt(x);
            let i1 = i0 + 1;

            if (y < 0.5) y = 0.5;
            if (y > N + 0.5) y = N + 0.5;
            let j0 = parseInt(y);
            let j1 = j0 + 1;

            let s1 = x - i0;
            let s0 = 1 - s1;
            let t1 = y - j0;
            let t0 = 1 - t1;

            d[IX(i, j)] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) + s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
        });
        set_bnd(b, d);
    }

    /**
     * Project
     * @param {Array} u
     * @param {Array} v
     * @param {Array} p
     * @param {Array} div
     */
    function project(u, v, p, div) {
        FOR_EACH_CELL((i, j) => {
            div[IX(i, j)] = -0.5 * (u[IX(i + 1, j)] - u[IX(i - 1, j)] + v[IX(i, j + 1)] - v[IX(i, j - 1)]) / N;
            p[IX(i, j)] = 0;
        });
        set_bnd(0, div);
        set_bnd(0, p);

        lin_solve(0, p, div, 1, 4);

        FOR_EACH_CELL((i, j) => {
            u[IX(i, j)] -= 0.5 * N * (p[IX(i + 1, j)] - p[IX(i - 1, j)]);
            v[IX(i, j)] -= 0.5 * N * (p[IX(i, j + 1)] - p[IX(i, j - 1)]);
        });
        set_bnd(1, u);
        set_bnd(2, v);
    }

    /**
     * Apply density step
     * @param {Array} x
     * @param {Array} x0
     * @param {Array} u
     * @param {Array} v
     * @param {Number} diff diffusion rate
     * @param {Number} dt step's duration
     */
    function dens_step(x, x0, u, v, diff, dt) {
        diff = 0; // FIXME a diff != 0 makes the solver diverge no matter what
        add_source(x, x0, dt);
        diffuse(0, x0, x, diff, dt);
        advect(0, x, x0, u, v, dt);
    }

    /**
     * Apply density step
     * @param {Array} u
     * @param {Array} u0
     * @param {Array} v
     * @param {Array} v0
     * @param {Number} visc viscosity
     * @param {Number} dt step's duration
     */
    function vel_step(u, v, u0, v0, visc, dt) {
        add_source(u, u0, dt);
        add_source(v, v0, dt);
        diffuse(1, u0, u, visc, dt);
        diffuse(2, v0, v, visc, dt);
        project(u0, v0, u, v);
        advect(1, u, u0, u0, v0, dt);
        advect(2, v, v0, u0, v0, dt);
        project(u, v, u0, v0);
    }
}
