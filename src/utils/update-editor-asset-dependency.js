let fs = require('fs');

!(async () => {
    let download = {
        // === Blackprint Engine ===
        "code-generation.min.js": "https://cdn.jsdelivr.net/npm/@blackprint/engine@0.9/dist/code-generation.min.js",
        "code-generation.min.js.map": "https://cdn.jsdelivr.net/npm/@blackprint/engine@0.9/dist/code-generation.min.js.map",
        "engine.min.js": "https://cdn.jsdelivr.net/npm/@blackprint/engine@0.9/dist/engine.min.js",
        "engine.min.js.map": "https://cdn.jsdelivr.net/npm/@blackprint/engine@0.9/dist/engine.min.js.map",
        "skeleton.min.js": "https://cdn.jsdelivr.net/npm/@blackprint/engine@0.9/dist/skeleton.min.js",
        "skeleton.min.js.map": "https://cdn.jsdelivr.net/npm/@blackprint/engine@0.9/dist/skeleton.min.js.map",

        // === Blackprint Sketch ===
        "blackprint.min.js": "https://cdn.jsdelivr.net/npm/@blackprint/sketch@0.9/dist/blackprint.min.js",
        "blackprint.min.js.map": "https://cdn.jsdelivr.net/npm/@blackprint/sketch@0.9/dist/blackprint.min.js.map",
        "blackprint.min.js": "https://cdn.jsdelivr.net/npm/@blackprint/sketch@0.9/dist/blackprint.min.js",
        "blackprint.min.js.map": "https://cdn.jsdelivr.net/npm/@blackprint/sketch@0.9/dist/blackprint.min.js.map",
        "blackprint.sf.js": "https://cdn.jsdelivr.net/npm/@blackprint/sketch@0.9/dist/blackprint.sf.js",
        "blackprint.sf.js.map": "https://cdn.jsdelivr.net/npm/@blackprint/sketch@0.9/dist/blackprint.sf.js.map",
        "blackprint.sf.css": "https://cdn.jsdelivr.net/npm/@blackprint/sketch@0.9/dist/blackprint.sf.css",
        "blackprint.sf.css.map": "https://cdn.jsdelivr.net/npm/@blackprint/sketch@0.9/dist/blackprint.sf.css.map",

        // === Other library ===
        "lodash.min.js": "https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js",
        "eventpine.js": "https://cdn.jsdelivr.net/npm/eventpine@1.0.3/eventpine.js",
        "fonts/fontawesome.min.css": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/fontawesome.min.css",
        "webfonts/fa-regular-400.woff2": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-regular-400.woff2",
        "webfonts/fa-regular-400.woff": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-regular-400.woff",
        "webfonts/fa-regular-400.ttf": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-regular-400.ttf",
        "fonts/solid.min.css": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/solid.min.css",
        "webfonts/fa-solid-900.woff2": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-solid-900.woff2",
        "webfonts/fa-solid-900.woff": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-solid-900.woff",
        "webfonts/fa-solid-900.ttf": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-solid-900.ttf",
        "fonts/brands.min.css": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/brands.min.css",
        "webfonts/fa-brands-400.woff2": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-brands-400.woff2",
        "webfonts/fa-brands-400.woff": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-brands-400.woff",
        "webfonts/fa-brands-400.ttf": "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts/fa-brands-400.ttf",
        "sweetalert2.min.css": "https://cdn.jsdelivr.net/npm/sweetalert2@11.1.2/dist/sweetalert2.min.css",
        "sweetalert2.min.js": "https://cdn.jsdelivr.net/npm/sweetalert2@11.1.2/dist/sweetalert2.min.js",
        "SFDatabase.min.js": "https://cdn.jsdelivr.net/npm/sfdatabase-js@1.3.2/dist/SFDatabase.min.js",
        "SFDatabase.min.js.map": "https://cdn.jsdelivr.net/npm/sfdatabase-js@1.3.2/dist/SFDatabase.min.js.map",
        "timeplate.min.js": "https://cdn.jsdelivr.net/npm/timeplate@0.1.0/dist/timeplate.min.js",
        "timeplate.min.js.map": "https://cdn.jsdelivr.net/npm/timeplate@0.1.0/dist/timeplate.min.js.map",
        "coloris.min.css": "https://cdn.jsdelivr.net/gh/mdbassit/Coloris@0.25.0/dist/coloris.min.css",
        "coloris.min.js": "https://cdn.jsdelivr.net/gh/mdbassit/Coloris@0.25.0/dist/coloris.min.js",
    };

    for (let key in download) {
        console.log("Downloading: " + download[key]);
        fs.writeFileSync(__dirname + "/../../out/assets/" + key, Buffer.from(await (await fetch(download[key])).arrayBuffer()));
    }
})();