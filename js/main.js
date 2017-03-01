// parameters
const simulationSize = {
    width: 50,
    height: 50
}
const displaySize = {
    width: 100,
    height: 100
}
const fluidName = 'air';

// get the fluid from the catalog
let fluid = fluids.find(f => f.name === fluidName);

// set canvas size to wanted display size
let canvas = document.getElementById("canvas");
canvas.width = displaySize.width;
canvas.height = displaySize.height;

// initialize the simulation
let simulation = new Simulation(simulationSize.width, simulationSize.height, fluid, canvas);

// set a disk obstacle to show off
simulation.setObstacleDisk(25,25,8);

// set a global area (not optimal for big size simulation > 80*80px)
simulation.newArea(0, 0, simulationSize.width, simulationSize.height);

// start simulation
simulation.start();
