// Emboque en los 7 escenarios: el solver replica la física del juego,
// calcula un tiro ganador para el nivel que tocó (posiciones y viento son
// aleatorios) y verifica que el nivel efectivamente sube. También se fuerzan
// niveles altos para cubrir la dificultad (lejos, viento fuerte, blancos
// girados, barreras largas, arcos chicos).
const { test, expect } = require("@playwright/test");
const { gotoGame, goScen, playLevel, forceLevel } = require("./helpers");

test.describe("emboques por escenario", () => {
  let errors;

  test("ciudad: 2 niveles seguidos", async ({ page }) => {
    errors = await gotoGame(page);
    await playLevel(page);
    await playLevel(page);
    expect(errors).toEqual([]);
  });

  test("selva: nivel 1", async ({ page }) => {
    errors = await gotoGame(page);
    await goScen(page, "selva");
    await playLevel(page);
    expect(errors).toEqual([]);
  });

  test("basquet: niveles 1 y 2 (se mueve el jugador)", async ({ page }) => {
    errors = await gotoGame(page);
    await goScen(page, "basquet");
    await playLevel(page);
    await playLevel(page);
    expect(errors).toEqual([]);
  });

  test("arquero: nivel 1 y nivel 8 forzado (blanco girado + viento)", async ({ page }) => {
    errors = await gotoGame(page);
    await goScen(page, "arquero");
    await playLevel(page);
    await forceLevel(page, 8);
    await playLevel(page);
    expect(errors).toEqual([]);
  });

  test("futbol: nivel 1 y nivel 7 forzado (barrera larga + arco chico)", async ({ page }) => {
    errors = await gotoGame(page);
    await goScen(page, "futbol");
    await playLevel(page);
    await forceLevel(page, 7);
    await playLevel(page);
    expect(errors).toEqual([]);
  });

  test("auto: nivel 1 y nivel 6 forzado (aro alto y girado)", async ({ page }) => {
    errors = await gotoGame(page);
    await goScen(page, "auto");
    await playLevel(page);
    await forceLevel(page, 6);
    await playLevel(page);
    expect(errors).toEqual([]);
  });

  test("granja: el turno alterna al acertar (vaquita → perrito → vaquita)", async ({ page }) => {
    errors = await gotoGame(page);
    await goScen(page, "granja");
    const turn = () => page.evaluate(() => window.__game.state.farm.turn);
    expect(await turn()).toBe("cow");

    // tira la vaquita (hacia +x) y le pega al perrito
    const info1 = await playLevel(page);
    expect(info1.dir).toBe(1);
    expect(await turn()).toBe("pup");

    // ahora tira el perrito (hacia -x, desde la derecha)
    const info2 = await playLevel(page);
    expect(info2.dir).toBe(-1);
    expect(info2.thrower.x).toBeGreaterThan(0);
    expect(info2.basket.x).toBeLessThan(0);
    expect(await turn()).toBe("cow");
    expect(errors).toEqual([]);
  });
});
