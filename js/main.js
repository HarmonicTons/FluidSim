// parameters
const simulationSize = {
    width: 100,
    height: 100
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
let area = simulation.newArea(0, 0, 50, 50);

// start simulation
simulation.start();

let d = -20;
let i=0;
setInterval(function(){
    if (i > 1) return;
    i++;
    d *= -1;
    simulation.moveArea(area, d, d);
},1000)
