export { Config, defaultConfig };

interface Config {
  host: string;
  port: number;
  width: number;
  height: number;
  velocityIncrease: number;
  velocityDecrease: number;
  maxVelocity: number;
  frameRate: number;
  responseRate: number;
  tolerance: number;
  resolve: number;
  maxFood: number;
  foodIncrease: number;
  foodSize: number;
  minSize: number;
  maxSize: number;
  growth: number;
}

const defaultConfig: Config = {
  host: "192.168.1.196",
  port: 8000,
  width: 2000,
  height: 2000,
  velocityIncrease: 0.4,
  velocityDecrease: 0.1,
  maxVelocity: 4,
  frameRate: 1000 / 60,
  responseRate: 1000 / 6,
  tolerance: 1,
  resolve: 2,
  maxFood: 200,
  foodIncrease: 10,
  foodSize: 10,
  minSize: 20,
  maxSize: 40,
  growth: 0.05,
};
