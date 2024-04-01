function randomlyPlaceObjects(objects, render) {
  console.log("I randomly moving objects..");
  objects.forEach((object) => {
    object.position.set(Math.random() * 2 - 1, -0.5, Math.random());
    object.rotation.y = Math.random() * Math.PI * 2;
  });
  render();
}

export { randomlyPlaceObjects };
