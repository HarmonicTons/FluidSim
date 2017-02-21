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
let fluidSolver = {

    /**
     * Update the field by solving the next step
     * @param {Number} dt step's duration
     */
    nextStep: function(w, h, d, u, v, d0, u0, v0, bnds = [], diff = 0, visc = 0, dt = 0.1, iterations = 10) {
        this.dens_step(d, d0, u, v, diff, dt, w, h, bnds, iterations);
        this.vel_step(u, v, u0, v0, visc, dt, w, h, bnds, iterations);
        [d0, u0, v0].forEach(x => x.fill(0));
    },

    /**
     * Add source
     * @param {Array} x
     * @param {Array} s
     * @param {Number} dt
     */
    add_source: function(x, s, dt, w, h) {
        let size = (w + 2) * (h + 2);
        for (let i = 0; i < size; i++) {
            x[i] += dt * s[i];
        }
    },

    /**
     * Set boundaries
     * @param {Number} b
     * @param {Array} x
     * @param {Object[]} bnds boundaries {x,y,w,h} w & h >= 5
     */
    set_bnd: function(b, x, w, bnds) {
        let IX = (i, j) => i + (w + 2) * j;

        if (bnds.length == 0) return;
        bnds.forEach(bnd => {
            for (let i = 1; i < bnd.w - 1; i++) {
                x[IX(bnd.x + i, bnd.y)] = b == 2 ? -x[IX(bnd.x + i, bnd.y - 1)] : x[IX(bnd.x + i, bnd.y - 1)];
                x[IX(bnd.x + i, bnd.y + bnd.h - 1)] = b == 2 ? -x[IX(bnd.x + i, bnd.y + bnd.h)] : x[IX(bnd.x + i, bnd.y + bnd.h)];
            }
            for (let i = 1; i < bnd.h - 1; i++) {
                x[IX(bnd.x, bnd.y + i)] = b == 1 ? -x[IX(bnd.x - 1, bnd.y + i)] : x[IX(bnd.x - 1, bnd.y + i)];
                x[IX(bnd.x + bnd.w - 1, bnd.y + i)] = b == 1 ? -x[IX(bnd.x + bnd.w, bnd.y + i)] : x[IX(bnd.x + bnd.w, bnd.y + i)];
            }

            for (let i = 2; i < bnd.w - 2; i++) {
                for (let j = 2; j < bnd.h - 2; j++) {
                    x[IX(bnd.x + i, bnd.y + j)] = 0;
                }
            }

            x[IX(bnd.x, bnd.y)] = 0.5 * (x[IX(bnd.x - 1, bnd.y)] + x[IX(bnd.x, bnd.y - 1)]);
            x[IX(bnd.x, bnd.y + bnd.h - 1)] = 0.5 * (x[IX(bnd.x - 1, bnd.y + bnd.h - 1)] + x[IX(bnd.x, bnd.y + bnd.h)]);
            x[IX(bnd.x + bnd.w - 1, bnd.y)] = 0.5 * (x[IX(bnd.x + bnd.w, bnd.y - 1)] + x[IX(bnd.x + bnd.w - 1, bnd.y)]);
            x[IX(bnd.x + bnd.w - 1, bnd.y + bnd.h - 1)] = 0.5 * (x[IX(bnd.x + bnd.w, bnd.y + bnd.h - 1)] + x[IX(bnd.x + bnd.w - 1, bnd.y + bnd.h)]);
        });
    },

    /**
     * Linear solver
     * @param {Number} b
     * @param {Array} x
     * @param {Array} x0
     * @param {Number} a
     * @param {Number} c
     */
    lin_solve: function(b, x, x0, a, c, w, bnds, iterations) {
        let IX = (i, j) => i + (w + 2) * j;

        let kMax = iterations;
        for (let k = 0; k < kMax; k++) {
            for (let i = 1; i <= w; i++) {
                for (let j = 1; j <= h; j++) {
                    x[IX(i, j)] = (x0[IX(i, j)] + a * (x[IX(i - 1, j)] + x[IX(i + 1, j)] + x[IX(i, j - 1)] + x[IX(i, j + 1)])) / c;
                }
            }
            this.set_bnd(b, x, w, bnds);
        }
    },

    /**
     * Diffuse
     * @param {Number} b
     * @param {Array} x
     * @param {Array} x0
     * @param {Number} diff
     * @param {Number} dt
     */
    diffuse: function(b, x, x0, diff, dt, w, h, bnds, iterations) {
        let a = dt * diff * w * h;
        this.lin_solve(b, x, x0, a, 1 + 4 * a, w, bnds, iterations);
    },

    /**
     * Advect
     * @param {Number} b
     * @param {Array} d
     * @param {Array} d0
     * @param {Array} u
     * @param {Array} v
     * @param {Number} dt
     */
    advect: function (b, d, d0, u, v, dt, w, h, bnds) {
        let IX = (i, j) => i + (w + 2) * j;

        let dt0 = dt * Math.sqrt(w * h);
        for (let i = 1; i <= w; i++) {
            for (let j = 1; j <= h; j++) {
                let x = i - dt0 * u[IX(i, j)];
                let y = j - dt0 * v[IX(i, j)];

                if (x < 0.5) x = 0.5;
                if (x > w + 0.5) x = w + 0.5;
                let i0 = parseInt(x);
                let i1 = i0 + 1;

                if (y < 0.5) y = 0.5;
                if (y > h + 0.5) y = h + 0.5;
                let j0 = parseInt(y);
                let j1 = j0 + 1;

                let s1 = x - i0;
                let s0 = 1 - s1;
                let t1 = y - j0;
                let t0 = 1 - t1;

                d[IX(i, j)] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) + s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
            }
        }
        this.set_bnd(b, d, w, bnds);
    },

    /**
     * Project
     * @param {Array} u
     * @param {Array} v
     * @param {Array} p
     * @param {Array} div
     */
    project: function(u, v, p, div, w, h, bnds, iterations) {
        let IX = (i, j) => i + (w + 2) * j;

        for (let i = 1; i <= w; i++) {
            for (let j = 1; j <= h; j++) {
                div[IX(i, j)] = -0.5 * (u[IX(i + 1, j)] - u[IX(i - 1, j)] + v[IX(i, j + 1)] - v[IX(i, j - 1)]) / Math.sqrt(w * h);
                p[IX(i, j)] = 0;
            }
        }
        this.set_bnd(0, div, w, bnds);
        this.set_bnd(0, p, w, bnds);

        this.lin_solve(0, p, div, 1, 4, w, bnds, iterations);

        for (let i = 1; i <= w; i++) {
            for (let j = 1; j <= h; j++) {
                u[IX(i, j)] -= 0.5 * Math.sqrt(w * h) * (p[IX(i + 1, j)] - p[IX(i - 1, j)]);
                v[IX(i, j)] -= 0.5 * Math.sqrt(w * h) * (p[IX(i, j + 1)] - p[IX(i, j - 1)]);
            }
        }
        this.set_bnd(1, u, w, bnds);
        this.set_bnd(2, v, w, bnds);
    },

    /**
     * Apply density step
     * @param {Array} x
     * @param {Array} x0
     * @param {Array} u
     * @param {Array} v
     * @param {Number} diff diffusion rate
     * @param {Number} dt step's duration
     */
    dens_step: function (x, x0, u, v, diff, dt, w, h, bnds, iterations) {
        diff = 0; // FIXME a diff != 0 makes the solver diverge no matter what
        this.add_source(x, x0, dt, w, h);
        this.diffuse(0, x0, x, diff, dt, w, h, bnds, iterations);
        this.advect(0, x, x0, u, v, dt, w, h, bnds);
    },

    /**
     * Apply density step
     * @param {Array} u
     * @param {Array} u0
     * @param {Array} v
     * @param {Array} v0
     * @param {Number} visc viscosity
     * @param {Number} dt step's duration
     */
    vel_step : function (u, v, u0, v0, visc, dt, w, h, bnds, iterations) {
        this.add_source(u, u0, dt, w, h);
        this.add_source(v, v0, dt, w, h);
        this.diffuse(1, u0, u, visc, dt, w, h, bnds, iterations);
        this.diffuse(2, v0, v, visc, dt, w, h, bnds, iterations);
        this.project(u0, v0, u, v, w, h, bnds, iterations);
        this.advect(1, u, u0, u0, v0, dt, w, h, bnds);
        this.advect(2, v, v0, u0, v0, dt, w, h, bnds);
        this.project(u, v, u0, v0, w, h, bnds, iterations);
    }
}
