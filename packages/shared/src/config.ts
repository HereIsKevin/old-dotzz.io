export { Config, defaultConfig };

interface Velocity {
  increase: number;
  decrease: number;
  max: number;
}

interface Config {
  // server
  host: string;
  port: number;
  // arena
  width: number;
  height: number;
  food: number;
  foodSize: number;
  // velocity
  velocity: Velocity;
  // intervals
  frameRate: number;
  responseRate: number;
  // reconcilation
  tolerance: number;
  resolve: number;
  // player size
  baseSize: number;
  sizeChange: 20;
  growth: number;
}

const defaultConfig: Config = {
  // server
  host: "192.168.1.196",
  port: 8000,
  // arena
  width: 2000,
  height: 2000,
  food: 200,
  foodSize: 10,
  // velocity
  velocity: {
    increase: 0.4,
    decrease: 0.1,
    max: 4,
  },
  // intervals
  frameRate: 1000 / 60,
  responseRate: 1000 / 30,
  // reconcilation
  tolerance: 1,
  resolve: 2,
  // player
  baseSize: 20,
  sizeChange: 20,
  growth: 0.05,
};
