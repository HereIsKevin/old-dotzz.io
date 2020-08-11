export { circleCollided, randint };

interface Circle {
  x: number;
  y: number;
  radius: number;
}

function randint(min: number, max: number) {
  const roundedMin = Math.ceil(min);
  const roundedMax = Math.floor(max);

  return Math.floor(Math.random() * (roundedMax - roundedMin)) + roundedMin;
}

function circleCollided(circle1: Circle, circle2: Circle): boolean {
  var deltaX = circle1.x - circle2.x;
  var deltaY = circle1.y - circle2.y;
  var distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

  if (distance < circle1.radius + circle2.radius) {
    return true;
  }

  return false;
}
