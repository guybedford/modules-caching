# Separate File v Bundled Cached Performance

The test is executing Preact (~10KB) 1000 times:
A) Bundled via RollupJS as bundle1000.js which represents 1000 full executions of Preact (10MB)
B) As separate ES modules, loaded 1000 times from the original preact.js

In general, with cold loading, separate files take ~2 times as long to load due to network and execution overhead of many modules.

This is somewhat expected.

What is not expected though is the huge difference that is seen in cached behaviour where the bundled version gets far better
caching performance benefits than the separate file version, turning the difference into a 10x difference.

This repo provides a replication of the scenario to investigate this, including against `--js-flags=--no-compilation-cache`.

### Setup

```
git clone git@github.com:guybedford/modules-caching
cd modules-caching
npm install
```

### Scenario 1: Testing cold boots

For the cold boots, run `npm run test-uncached`. This will start a local HTTP/2 server with caching disabled and load up Chromium with two pages `bundle.html` and `separate.html`.

Refreshing these pages manually yields timings something like the following for the 1000 Preact executions:

Bundled: ~500ms
Separate: ~1000ms

### Scenario 2: Testing cached reloads

For cached reloading run `npm run test-cached`. This starts a local HTTP/2 server with caching fully enabled.

Viewing the `bundle.html` and `separate.html` pages now yields more variable results as different cache layers kick in:

Bundled: Starts at ~500ms, next memory cache loads at ~250ms, then better caching loads at ~70ms, after a couple more refreshes it drops down to ~10ms and stays there, sometimes going back up to ~70ms.

Separate: Starts at ~1000ms, drops to ~600ms on memory cache, further improves to ~130ms with better caching, but then stays there going back up to ~300-600ms more regularly than the bundled version deoptimization to ~70ms. There is no third optimization layer kicking in like we saw with bundled.

### Scenario 3: Cached reloads with no compilation cache

To try and understand what cache layers are applying, we can run with `--js-flags=--no-compilation-cache` via `npm run test-cached-nocompilation`.

Again, manually looking at the timings:

Bundled: Starts at ~300ms, next memory cache loads at ~250ms, then it goes down to ~20ms and stays there. It doesn't get down to ~10ms anymore though so the `--no-compilation-cache` is clearly applying, its effect is just not as strong as expected so other caches seem to be more important.

Separate: Starts at ~800ms (faster because no cache?), drops to 600ms, then to 130ms, bouncing back to 300-600ms every few loads roughly as before. The compilation cache clearly has no effect.