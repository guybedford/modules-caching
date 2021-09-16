let startTime;

export function start () {
  startTime = performance.now();
}

export function stop () {
  document.body.innerHTML = `<p>Time: ${performance.now() - startTime}</p>`;
}
