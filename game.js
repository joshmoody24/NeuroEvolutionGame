import Vec2 from './geometry/Vec2.mjs';
// import {instance as gameManager} from './utility/GameManager.mjs';
import Config from './config.json' assert {type: 'json'};
import Amoeba from './ecosystem/Amoeba.mjs';
import Food from './ecosystem/Food.mjs';
import Manager from './ecosystem/Manager.mjs';
import BrainViewer from './ui/BrainViewer.mjs';

let width = 512;
let height = 512;

let app = new PIXI.Application({width, height, antialias:true});
let hud = new PIXI.Application({width, height, antialias:true});

let manager = new Manager();
window.onkeydown = (e) => manager.setKey(e.key, true);
window.onkeyup = (e) => manager.setKey(e.key, false);
manager.app = app;
manager.hud = hud;

const animals = [];
for(let i = 0; i < Config.starting_animals; i++){
	const spawnPos = new Vec2(Math.random() * width, Math.random() * height);
	const genome = Amoeba.InitialGenome(manager);
	animals.push(
		new Amoeba(spawnPos, genome, manager)
	);
}

const genome = Amoeba.InitialGenome(manager);
console.log(genome);
let mut_animal = new Amoeba(new Vec2(25, 25), genome, manager);
// temp for testing mutations
for(let i = 0; i < 1; i++){
	let newGenome =  mut_animal.genome.GetMutatedGenome(manager);
	console.log(newGenome);
	mut_animal = new Amoeba(new Vec2(25, 25), newGenome, manager);
}

animals.push(mut_animal);

const foods = [new Food(new Vec2(20,20), 0xfcf8ec, 10)];


let objects = [...animals, ...foods, ]//...lines];

objects.forEach(o => app.stage.addChild(o));
console.log("Objects:", objects);

app.renderer.backgroundColor = 0x456268;
document.querySelector("div#canvas").appendChild(app.view);
app.ticker.add((delta) => {
	app.stage.children.forEach(o => {
		o.update(delta);
	});
});

hud.renderer.backgroundColor = 0x333333;
document.querySelector("div#hud").appendChild(hud.view);

const brainViewer = new BrainViewer(hud);
brainViewer.loadBrain(mut_animal);
hud.ticker.add((delta) => {
	brainViewer.update();
})


// resize
window.onresize = () => {
	let d = document.querySelector("div#canvas");
	width = d.clientWidth;
	height = width;
	app.renderer.resize(width, height);
	hud.renderer.resize(width, height);
}

window.onresize();
