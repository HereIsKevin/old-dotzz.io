export { Config, defaultConfig };

interface Config {
  // server
  host: string;
  port: number;
  // arena
  width: number;
  height: number;
  food: number;
  foodMass: number;
  // velocity
  velocityIncrease: number;
  velocityDecrease: number;
  velocityMax: number;
  // intervals
  frameRate: number;
  responseRate: number;
  // reconcilation
  tolerance: number;
  resolve: number;
  // player
  playerMass: number;
  sizeModifier: number;
  sizeBase: number;
}

const defaultConfig: Config = {
  // server
  host: "192.168.1.196",
  port: 8000,
  // arena
  width: 2000,
  height: 2000,
  food: 200,
  foodMass: 5,
  // velocity
  velocityIncrease: 0.4,
  velocityDecrease: 0.1,
  velocityMax: 4,
  // intervals
  frameRate: 1000 / 60,
  responseRate: 1000 / 30,
  // reconcilation
  tolerance: 1,
  resolve: 2,
  // player
  playerMass: 20,
  sizeModifier: 20,
  sizeBase: 7,
};
