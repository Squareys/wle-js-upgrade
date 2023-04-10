/**
 * /!\ This file is auto-generated.
 *
 * This is the entry point of your standalone application.
 *
 * There are multiple tags used by the editor to inject code automatically:
 *     - `wle:auto-imports:start` and `wle:auto-imports:end`: The list of import statements
 *     - `wle:auto-register:start` and `wle:auto-register:end`: The list of component to register
 *     - `wle:auto-constants:start` and `wle:auto-constants:end`: The project's constants,
 *        such as the project's name, whether it should use the physx runtime, etc...
 *     - `wle:auto-benchmark:start` and `wle:auto-benchmark:end`: Append the benchmarking code
 */

/* wle:auto-imports:start */
import {ConfettiParticles} from './confetti-particles.js';
import {HitTestLocation} from '@wonderlandengine/components';
import {MouseLookComponent} from '@wonderlandengine/components';
import {PaperballSpawner} from './paperball-spawner.js';
import {PlayAgainButton} from './play-again-button.js';
import {ScoreDisplay} from './score-display.js';
import {WastebinSpawner} from './wastebin-spawner.js';
/* wle:auto-imports:end */
import * as API from '@wonderlandengine/api'; // Deprecated: Backward compatibility.
import {loadRuntime} from '@wonderlandengine/api';
import {ScoreTrigger} from './score-trigger.js';
import {BallPhysics} from './ball-physics.js';

/* wle:auto-constants:start */
const ProjectName = 'Wastepaperbin AR';
const RuntimeBaseName = 'WonderlandRuntime';
const WithPhysX = false;
const WithLoader = false;
/* wle:auto-constants:end */

const engine = await loadRuntime(RuntimeBaseName, {
    physx: WithPhysX,
    loader: WithLoader,
});
Object.assign(engine, API); // Deprecated: Backward compatibility.
window.WL = engine; // Deprecated: Backward compatibility.

engine.onSceneLoaded.push(() => {
    const el = document.getElementById('version');
    if (el) setTimeout(() => el.remove(), 2000);
});

const arButton = document.getElementById('ar-button');
if (arButton) {
    arButton.dataset.supported = engine.arSupported;
}
const vrButton = document.getElementById('vr-button');
if (vrButton) {
    vrButton.dataset.supported = engine.vrSupported;
}

/* wle:auto-register:start */
engine.registerComponent(ConfettiParticles);
engine.registerComponent(HitTestLocation);
engine.registerComponent(MouseLookComponent);
engine.registerComponent(PaperballSpawner);
engine.registerComponent(PlayAgainButton);
engine.registerComponent(ScoreDisplay);
engine.registerComponent(WastebinSpawner);
/* wle:auto-register:end */
engine.registerComponent(ScoreTrigger);
engine.registerComponent(BallPhysics);

engine.scene.load(`${ProjectName}.bin`);

/* wle:auto-benchmark:start */
/* wle:auto-benchmark:end */
