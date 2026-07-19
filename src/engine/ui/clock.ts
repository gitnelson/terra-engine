// Beijing + local clocks in the topbar (ported from console 809-814). Beijing is
// UTC+8; the class runs on Beijing morning time so the teacher can see both.
function pad(n: number): string { return (n < 10 ? '0' : '') + n; }

export function startClock(): void {
  const bjEl = document.getElementById('clkBJ');
  const loEl = document.getElementById('clkLO');
  function tick(): void {
    const now = new Date();
    const bj = new Date(now.getTime() + (now.getTimezoneOffset() + 8 * 60) * 60000);
    if (bjEl) bjEl.textContent = pad(bj.getHours()) + ':' + pad(bj.getMinutes());
    if (loEl) loEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  }
  tick();
  setInterval(tick, 15000);
}
