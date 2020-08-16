export { contained, collided, randint };

import { Sprite, massToSize } from "shared/sprites";

function randint(min: number, max: number): number {
  const roundedMin = Math.ceil(min);
  const roundedMax = Math.floor(max);

  return Math.floor(Math.random() * (roundedMax - roundedMin)) + roundedMin;
}

function collided(sprite1: Sprite, sprite2: Sprite): boolean {
  const deltaX = sprite1.x - sprite2.x;
  const deltaY = sprite1.y - sprite2.y;
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  const difference = massToSize(sprite1.mass) + massToSize(sprite2.mass);

  return distance < difference;
}

function contained(sprite1: Sprite, sprite2: Sprite): boolean {
  const deltaX = sprite1.x - sprite2.x;
  const deltaY = sprite1.y - sprite2.y;
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  const radius1 = massToSize(sprite1.mass);
  const radius2 = massToSize(sprite2.mass);

  return radius1 > distance + radius2;
}
