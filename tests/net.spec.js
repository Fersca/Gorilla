// Partida de a dos 👥: dos navegadores conectados por WebRTC sin servidor.
// El test hace de "WhatsApp": saca la invitación de una página, la mete en la
// otra, y devuelve la respuesta — igual que harían dos personas con un QR o
// pegando el link. Después verifica que el juego quede realmente sincronizado.
const { test, expect } = require("@playwright/test");
const { GAME_URL, watchErrors } = require("./helpers");

async function openGame(page) {
  const errors = watchErrors(page);
  await page.goto(GAME_URL);
  await page.waitForFunction(() => !!window.__game);
  await page.waitForTimeout(2200);
  return errors;
}

// la cancha que ve cada jugador: tiene que ser idéntica en los dos
const board = (p) => p.evaluate(() => {
  const s = window.__game.state;
  return {
    lvl: s.level, turn: s.farm.turn,
    px: +s.thrower.x.toFixed(3), pz: +s.thrower.z.toFixed(3),
    tx: +s.basket.x.toFixed(3), tz: +s.basket.z.toFixed(3),
    w: +s.wind.toFixed(3), wz: +s.windZ.toFixed(3),
  };
});
const sameBoard = async (a, b) => JSON.stringify(await board(a)) === JSON.stringify(await board(b));

// el apretón de manos completo: A invita, B responde, A cierra
async function connect(host, guest) {
  const inv = await host.evaluate(() => window.__game.net.createOffer());
  expect(inv.length).toBeGreaterThan(50);
  const ans = await guest.evaluate((t) => window.__game.net.acceptOffer(t), inv);
  await host.evaluate((t) => window.__game.net.acceptAnswer(t), ans);
  for (const p of [host, guest]) {
    await p.waitForFunction(() => window.__game.net.state().on, null, { timeout: 30_000 });
  }
  // el anfitrión reparte la cancha: esperar a que llegue del otro lado
  await expect.poll(() => sameBoard(host, guest), { timeout: 30_000 }).toBe(true);
  return { inv, ans };
}

test("dos navegadores se conectan P2P y juegan la misma partida", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const host = await ctx.newPage();
  const guest = await ctx.newPage();
  const eHost = await openGame(host);
  const eGuest = await openGame(guest);

  const { inv } = await connect(host, guest);

  // la invitación entra en un QR y en un link de WhatsApp (holgado bajo 2 KB)
  expect(inv.length).toBeLessThan(2000);

  // los dos quedan en la granja, con roles distintos
  const sh = await host.evaluate(() => ({ ...window.__game.net.state(), scen: window.__game.state.scenKey }));
  const sg = await guest.evaluate(() => ({ ...window.__game.net.state(), scen: window.__game.state.scenKey }));
  expect(sh.scen).toBe("granja");
  expect(sg.scen).toBe("granja");
  expect(sh.myChar).toBe("cow");
  expect(sg.myChar).toBe("pup");
  expect(sh.isHost).toBe(true);
  expect(sg.isHost).toBe(false);

  // arranca la vaquita: el anfitrión tiene el turno y el invitado no
  expect(sh.myTurn).toBe(true);
  expect(sg.myTurn).toBe(false);
  expect(await guest.evaluate(() => document.getElementById("throwBtn").disabled)).toBe(true);

  // el anfitrión repartió la cancha: los dos ven lo mismo (posiciones y viento)
  expect(await board(guest)).toEqual(await board(host));

  // tira el anfitrión: el tiro se reproduce igual en la pantalla del otro
  await host.evaluate(() => {
    document.getElementById("angle").value = 40;
    document.getElementById("yaw").value = 3;
    document.getElementById("power").value = 55;
  });
  const triesGuest0 = await guest.evaluate(() => window.__game.state.tries);
  await host.click("#throwBtn");
  await guest.waitForFunction((t) => window.__game.state.tries > t, triesGuest0, { timeout: 20_000 });
  const shot = (p) => p.evaluate(() => ({
    a: +document.getElementById("angle").value,
    y: +document.getElementById("yaw").value,
    p: +document.getElementById("power").value,
  }));
  expect(await shot(guest)).toEqual({ a: 40, y: 3, p: 55 });

  // pase lo que pase (emboque o yerro), el turno pasa al otro en los dos lados
  for (const p of [host, guest]) {
    await p.waitForFunction(() => window.__game.state.farm.turn === "pup", null, { timeout: 90_000 });
  }
  expect(await host.evaluate(() => window.__game.net.state().myTurn)).toBe(false);
  expect(await guest.evaluate(() => window.__game.net.state().myTurn)).toBe(true);

  // el botón se habilita recién cuando arranca el turno nuevo (durante el
  // festejo/transición está bien que nadie pueda tirar): esperar a eso
  await guest.waitForFunction(() => !document.getElementById("throwBtn").disabled, null, { timeout: 60_000 });
  // y el anfitrión, que ya tiró, queda bloqueado hasta que le toque de nuevo
  expect(await host.evaluate(() => document.getElementById("throwBtn").disabled)).toBe(true);
  // la cancha del turno nuevo también es la misma para los dos
  await expect.poll(() => sameBoard(host, guest), { timeout: 30_000 }).toBe(true);

  // cortar la partida se avisa del otro lado
  await host.evaluate(() => window.__game.net.hangUp());
  await guest.waitForFunction(() => !window.__game.net.state().on, null, { timeout: 15_000 });

  expect(eHost).toEqual([]);
  expect(eGuest).toEqual([]);
  await ctx.close();
});

test("el link de invitación (el que se manda por WhatsApp) abre la respuesta con su QR", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const host = await ctx.newPage();
  const errH = await openGame(host);

  // el anfitrión crea la partida desde la UI real y copia el link
  await host.click("#netBtn");
  await host.click("#netCreate");
  await host.waitForSelector("#netQRBox img", { timeout: 60_000 });   // se dibujó el QR
  const link = await host.evaluate(() => {
    const c = document.getElementById("netCopyInv");
    return c ? c.getAttribute("data-link") : null;
  });

  // el otro abre ese link en su teléfono: cae directo en "devolvé tu respuesta"
  const guest = await ctx.newPage();
  const errG = watchErrors(guest);
  await guest.goto(link);
  await guest.waitForFunction(() => !!window.__game);
  await guest.waitForSelector("#netQRBox2 img", { timeout: 60_000 });  // QR de respuesta
  expect(await guest.evaluate(() => document.getElementById("netOverlay").classList.contains("show"))).toBe(true);
  // el hash se limpia para que recargar no vuelva a disparar el flujo
  expect(await guest.evaluate(() => location.hash)).toBe("");

  // y ese QR de respuesta cierra el trato: los dos quedan jugando
  const ans = await guest.evaluate(() => document.getElementById("netCopyAns").getAttribute("data-link"));
  await host.evaluate((t) => window.__game.net.acceptAnswer(t), ans);
  for (const p of [host, guest]) {
    await p.waitForFunction(() => window.__game.net.state().on, null, { timeout: 30_000 });
  }
  expect(await guest.evaluate(() => window.__game.state.scenKey)).toBe("granja");
  expect(errH).toEqual([]);
  expect(errG).toEqual([]);
  await ctx.close();
});
