// parameters
const simulationSize = {
    width: 80,
    height: 80
};
const displaySize = {
    width: 160,
    height: 160
};
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
simulation.setObstacleDisk(40, 40, 20);
simulation.setObstacleSquare(0, 0, simulationSize.width, 2);
simulation.setObstacleSquare(0, 0, 2, simulationSize.height);
simulation.setObstacleSquare(0, simulationSize.height - 2, simulationSize.width, 2);
simulation.setObstacleSquare(simulationSize.width - 2, 0, 2, simulationSize.height);

// set a global area (not optimal for big size simulation > 80*80px)
let area = simulation.newArea(0, 0, simulationSize.width, simulationSize.height);

// start simulation
simulation.start();


// display fps
setInterval(function() {
    document.getElementById("fps").innerHTML = simulation.fps;
}, 1000);
