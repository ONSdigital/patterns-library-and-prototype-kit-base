import { port, testURL, replacePaths, generateURLs } from './percy.config';
import PercyScript from '@percy/script';
import httpServer from 'http-server';

PercyScript.run(async (page, percySnapshot) => {
  await replacePaths();

  let server = httpServer.createServer();
  server.listen(port);
  console.log(`Server started at ${testURL}`);

  // Get all snapshots of components, patterns and styles
  const urls = await generateURLs();
  for (const url of urls) {
    await page.goto(url.url);
    await percySnapshot(url.name, { widths: [420, 740, 1300] });
  }

  // Snapshots of interactive components with state

  // Checkboxes
  await page.goto(`${testURL}/build/components/checkboxes/examples/checkboxes/index.html`);
  let checkbox = 'input[id="bacon"]';
  await page.evaluate(checkbox => document.querySelector(checkbox).click(), checkbox);
  await percySnapshot('Checked checkbox', { widths: [1300] });

  // Accordion
  await page.goto(`${testURL}/build/components/accordion/examples/accordion/index.html`);
  page.waitForSelector('.collapsible--initialised');
  let buttonAll = '.js-collapsible-all';
  await page.evaluate(buttonAll => document.querySelector(buttonAll).click(), buttonAll);
  await percySnapshot('Open accordion', { widths: [1300] });

  server.close();
});
