#!/usr/bin/env bash
#
# project-coherence.sh — compare what `project.yaml` DECLARES against what the
# project actually IS.
#
# WHY THIS EXISTS
#
# Three defects share one shape: `project.yaml` is treated as the source of truth
# and is never reconciled against the artifact it describes.
#
#   1  engine.version says 4.7.2; project.godot says 4.6; the binary is 4.6.1
#   2  engine.rendering says Forward+; project.godot says gl_compatibility
#   3  commands.build names an export preset with no export_presets.cfg
#
# The second is why this is a script and not another paragraph. `/setup-engine`
# ALREADY carries an emphatic, source-cited warning naming both of the exact
# mistakes that produce it ("Jolt is Godot's default 3D engine", "Forward+ is
# desktop-focused"). Prose is in place and does not hold on its own. What was
# missing was a step that reads back what was written.
#
# F1's root cause was subtler and is fixed elsewhere: `/setup-engine` is told to
# write an `Installed at pin time` row into VERSION.md, and no VERSION.md had
# such a row. There was no slot, so the step vanished leaving no trace. The row
# now ships in all three reference files, and check 1 below reads it.
#
# Babylon.js has no editor binary and no project.godot: its "installed version"
# is node_modules/@babylonjs/core, its project file is package.json, and its
# commands are npm scripts. Checks 3, 4/5 and 6 read those instead.
#
# OBSERVATIONS, NEVER VERDICTS
#
# Per CLAUDE.md: a script that scores or judges will eventually contradict a mode
# or override it cannot see. This one prints what it compared and what it found,
# and always exits 0. The reader decides. A check that cannot run says so by
# name — silence is never treated as agreement.

set -u
export LC_ALL=C

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT" || exit 0

DIFFERS=0
CHECKED=0
SKIPPED=0

say()      { printf '%s\n' "$*"; }
match()    { CHECKED=$((CHECKED+1)); say "[MATCH]       $*"; }
differs()  { CHECKED=$((CHECKED+1)); DIFFERS=$((DIFFERS+1)); say "[DIFFERS]     $*"; }
skipped()  { SKIPPED=$((SKIPPED+1)); say "[NOT CHECKED] $*"; }

# Read one `key: value` from a named top-level block of project.yaml.
# Deliberately simple: this file is machine-written and two levels deep.
yaml_block_value() {
  block="$1"; key="$2"
  awk -v b="$block" -v k="$key" '
    $0 ~ "^"b":" { inb=1; next }
    inb && /^[a-zA-Z_]/ { inb=0 }
    inb && $0 ~ "^[[:space:]]+"k":" {
      sub("^[[:space:]]*"k":[[:space:]]*", "")
      gsub(/^"|"$/, "")
      print; exit
    }
  ' project.yaml 2>/dev/null
}

summarise() {
  say ""
  say "checked $CHECKED · differs $DIFFERS · not checked $SKIPPED"
  say ""
  say "Observations only — no verdict. 'not checked' is not agreement:"
  say "each line above names why that comparison could not be made."
  exit 0
}

say "=== project coherence ==="

if [ ! -f project.yaml ]; then
  skipped "everything — no project.yaml at the repo root. Run /start."
  summarise
fi

ENGINE="$(yaml_block_value engine name)"
VERSION="$(yaml_block_value engine version)"
RENDERING="$(yaml_block_value engine rendering)"
PHYSICS="$(yaml_block_value engine physics)"

if [ -z "$ENGINE" ]; then
  skipped "every engine check — project.yaml has no engine.name. Run /setup-engine."
  summarise
fi

ENGINE_LC="$(printf '%s' "$ENGINE" | tr 'A-Z' 'a-z')"
# The canonical value is `BabylonJS`; normalise the display spelling too, so a
# hand-edited `Babylon.js` still finds docs/engine-reference/babylonjs/.
[ "$ENGINE_LC" = "babylon.js" ] && ENGINE_LC="babylonjs"
VERFILE="docs/engine-reference/$ENGINE_LC/VERSION.md"

# Babylon.js is an npm package, not an editor binary: the "installed version"
# is the one npm resolved into node_modules, and the project file is
# package.json. Read both once; checks 3, 4/5 and 6 use them.
BJS_INSTALLED=""
if [ -f node_modules/@babylonjs/core/package.json ]; then
  BJS_INSTALLED="$(grep -oE '"version"[[:space:]]*:[[:space:]]*"[^"]+"' node_modules/@babylonjs/core/package.json \
                   | head -1 | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')"
fi
# True when package.json declares a script named $1 (dependencies, devDeps and
# scripts all share the `"name": "value"` shape, so key on the scripts block).
pkg_has_script() {
  [ -f package.json ] || return 1
  awk -v k="$1" '
    /"scripts"[[:space:]]*:[[:space:]]*\{/ { ins=1; next }
    ins && /\}/ { ins=0 }
    ins && $0 ~ "\""k"\"[[:space:]]*:" { found=1 }
    END { exit found ? 0 : 1 }
  ' package.json
}

# --- 1. VERSION.md carries a recorded installed-version probe -----------------
if [ ! -f "$VERFILE" ]; then
  skipped "pinned-reference checks — $VERFILE does not exist"
else
  PINNED="$(grep -E '^\| \*\*Engine Version\*\* \|' "$VERFILE" \
            | sed -E 's/^\| \*\*Engine Version\*\* \| *//; s/ *\|$//')"
  INSTALLED_ROW="$(grep -E '^\| \*\*Installed at pin time\*\* \|' "$VERFILE" \
            | sed -E 's/^\| \*\*Installed at pin time\*\* \| *//; s/ *\|$//')"

  if [ -z "$INSTALLED_ROW" ]; then
    differs "$VERFILE has no 'Installed at pin time' row. /setup-engine is required to write one; its absence means the probe result was never recorded, not that the versions agree."
  elif printf '%s' "$INSTALLED_ROW" | grep -qE 'NOT DETERMINED'; then
    skipped "pinned-vs-installed — $VERFILE records '$INSTALLED_ROW'. A probe that did not run has not established a match."
  else
    match "VERSION.md records the installed version at pin time: $INSTALLED_ROW"
  fi

  # --- 2. project.yaml version vs the pinned reference ------------------------
  if [ -z "$PINNED" ]; then
    skipped "project.yaml version vs pinned reference — no Engine Version row in $VERFILE"
  elif [ -z "$VERSION" ]; then
    skipped "project.yaml version vs pinned reference — project.yaml has no engine.version"
  elif printf '%s' "$PINNED" | grep -qF "$VERSION"; then
    match "engine.version ($VERSION) agrees with $VERFILE ($PINNED)"
  else
    differs "engine.version is '$VERSION' but $VERFILE pins '$PINNED'. Agents consult the reference file, so they will answer for a version the project does not declare."
  fi
fi

# --- 3. Declared version vs the binary actually installed ---------------------
PROBE=""
case "$ENGINE_LC" in
  godot)
    if command -v godot >/dev/null 2>&1; then
      PROBE="$(godot --version 2>/dev/null | head -1)"
    fi
    ;;
  unity)   command -v Unity >/dev/null 2>&1 && PROBE="$(Unity -version 2>/dev/null | head -1)" ;;
  unreal)  command -v UnrealEditor-Cmd >/dev/null 2>&1 && PROBE="$(UnrealEditor-Cmd -version 2>/dev/null | head -1)" ;;
  babylonjs) [ -n "$BJS_INSTALLED" ] && PROBE="@babylonjs/core $BJS_INSTALLED" ;;
esac

if [ -z "$PROBE" ] && [ "$ENGINE_LC" = "babylonjs" ]; then
  skipped "declared version vs installed package — no node_modules/@babylonjs/core/package.json (run npm install). A probe that could not run has not established absence."
elif [ -z "$PROBE" ]; then
  skipped "declared version vs installed binary — no $ENGINE binary found on PATH. A probe that could not run has not established absence."
elif [ -z "$VERSION" ]; then
  skipped "declared version vs installed binary — project.yaml has no engine.version"
else
  # Compare on major.minor: a patch difference is normal and not worth a flag.
  WANT="$(printf '%s' "$VERSION" | grep -oE '^[0-9]+\.[0-9]+')"
  GOT="$(printf '%s' "$PROBE"  | grep -oE '[0-9]+\.[0-9]+' | head -1)"
  if [ -n "$WANT" ] && [ "$WANT" = "$GOT" ]; then
    match "engine.version $VERSION matches the installed binary ($PROBE)"
  else
    differs "engine.version is '$VERSION' but the binary on PATH is '$PROBE'. Build, test and smoke commands all target the declared version."
  fi
fi

# --- 4/5. Declared rendering + physics vs the real project file --------------
# Godot: project.godot. Babylon.js: package.json + the code root (src/).
if [ "$ENGINE_LC" = "babylonjs" ]; then
  if [ ! -f package.json ]; then
    skipped "project-file checks — no package.json in this repo (the Babylon.js project has not been scaffolded)"
  else
    if grep -qE '"@babylonjs/core"[[:space:]]*:' package.json; then
      match "package.json depends on @babylonjs/core"
    else
      differs "engine.name is '$ENGINE' but package.json has no @babylonjs/core dependency. Nothing the babylonjs-* specialists write will resolve its imports."
    fi

    # Havok ships as its own WASM package; declaring it without the package
    # sends the implementer to tune a physics plugin the build cannot load.
    if [ -z "$PHYSICS" ]; then
      skipped "physics — project.yaml has no engine.physics"
    elif printf '%s' "$PHYSICS" | grep -qiE 'havok'; then
      if grep -qE '"@babylonjs/havok"[[:space:]]*:' package.json; then
        match "engine.physics ($PHYSICS) — @babylonjs/havok is in package.json"
      else
        differs "engine.physics is '$PHYSICS' but package.json has no @babylonjs/havok dependency. HavokPlugin cannot initialise without its WASM package."
      fi
    else
      match "engine.physics ($PHYSICS)"
    fi

    # WebGPU is opt-in: Babylon's default `Engine` class is WebGL2, and WebGPU
    # needs an explicit `WebGPUEngine`. Only meaningful once code exists.
    if [ -z "$RENDERING" ]; then
      skipped "rendering — project.yaml has no engine.rendering"
    elif ! printf '%s' "$RENDERING" | grep -qiE 'webgpu'; then
      skipped "rendering — engine.rendering '$RENDERING' uses Babylon's default WebGL2 Engine; there is no file setting to compare it against"
    elif [ -z "$(find src -name '*.ts' -o -name '*.tsx' 2>/dev/null | head -1)" ]; then
      skipped "rendering — engine.rendering declares WebGPU, but there is no TypeScript under src/ yet to compare it against"
    elif grep -rqE 'WebGPUEngine' src 2>/dev/null; then
      match "engine.rendering ($RENDERING) — WebGPUEngine is referenced under src/"
    else
      differs "engine.rendering is '$RENDERING' but nothing under src/ references WebGPUEngine. Babylon's default Engine class is WebGL2, so the game runs on a renderer the config does not declare."
    fi
  fi
elif [ "$ENGINE_LC" != "godot" ]; then
  skipped "project-file checks — implemented for Godot and Babylon.js only; $ENGINE has no single equivalent file this script can read"
elif [ ! -f project.godot ]; then
  skipped "project-file checks — no project.godot in this repo"
else
  METHOD="$(grep -E '^renderer/rendering_method' project.godot \
            | sed -E 's/.*= *"?([a-z_]+)"?.*/\1/' | head -1)"
  if [ -z "$METHOD" ]; then
    skipped "rendering — project.godot sets no renderer/rendering_method (Godot then uses its own default, which this script will not guess)"
  elif [ -z "$RENDERING" ]; then
    skipped "rendering — project.yaml has no engine.rendering"
  else
    case "$RENDERING" in
      Compatibility|compatibility|"GL Compatibility") WANT_M="gl_compatibility" ;;
      "Forward+"|forward_plus|"Forward Plus")         WANT_M="forward_plus" ;;
      Mobile|mobile)                                  WANT_M="mobile" ;;
      *)                                              WANT_M="" ;;
    esac
    if [ -z "$WANT_M" ]; then
      skipped "rendering — engine.rendering '$RENDERING' is not one this script maps to a Godot rendering_method"
    elif [ "$WANT_M" = "$METHOD" ]; then
      match "engine.rendering ($RENDERING) agrees with project.godot ($METHOD)"
    else
      differs "engine.rendering is '$RENDERING' (expects $WANT_M) but project.godot runs '$METHOD'. Whichever is wrong, an agent reading project.yaml will advise for the wrong renderer."
    fi
  fi

  # Jolt is Godot's default 3D physics engine; 2D is unchanged (Godot Physics
  # 2D). See docs/engine-reference/godot/modules/physics.md. Declaring Jolt on a
  # 2D project sends the implementer to tune a backend the game does not use.
  if [ -z "$PHYSICS" ]; then
    skipped "physics — project.yaml has no engine.physics"
  elif printf '%s' "$PHYSICS" | grep -qiE 'jolt'; then
    if grep -qE '(Node2D|CharacterBody2D|RigidBody2D|Area2D|StaticBody2D)' \
         $(find src -name '*.gd' -o -name '*.tscn' 2>/dev/null) /dev/null 2>/dev/null; then
      differs "engine.physics is 'Jolt', but 2D nodes were found under src/. Jolt is Godot's default 3D engine; 2D still uses Godot Physics 2D (docs/engine-reference/godot/modules/physics.md)."
    else
      match "engine.physics ($PHYSICS) — no 2D nodes found under src/ to contradict it"
    fi
  else
    match "engine.physics ($PHYSICS)"
  fi
fi

# --- 6. Declared commands reference files that exist -------------------------
BUILD_CMD="$(yaml_block_value commands build)"
TEST_CMD="$(yaml_block_value commands test)"

if [ -z "$BUILD_CMD" ] && [ -z "$TEST_CMD" ]; then
  skipped "command checks — project.yaml declares no commands.build or commands.test"
else
  if printf '%s' "$BUILD_CMD" | grep -qE 'export-(debug|release|pack)'; then
    if [ -f export_presets.cfg ]; then
      match "commands.build names an export preset and export_presets.cfg exists"
    else
      differs "commands.build is '$BUILD_CMD' but there is no export_presets.cfg. Godot cannot resolve the preset, so this command fails the first time CI or /smoke-check runs it."
    fi
  fi

  # npm-driven commands (Babylon.js): the "file" a command names is a
  # package.json script. `npm test` is shorthand for `npm run test`.
  RUN_CMD="$(yaml_block_value commands run)"
  for _pair in "build:$BUILD_CMD" "test:$TEST_CMD" "run:$RUN_CMD"; do
    _field="${_pair%%:*}"; _cmd="${_pair#*:}"
    _script="$(printf '%s' "$_cmd" | sed -nE 's/^npm (run(-script)? )?([A-Za-z0-9:_-]+).*/\3/p')"
    [ -z "$_script" ] && continue
    case "$_script" in run|run-script) continue ;; esac
    if [ ! -f package.json ]; then
      differs "commands.$_field is '$_cmd' but there is no package.json. npm has no script to run, so this command fails the first time anything runs it."
    elif pkg_has_script "$_script"; then
      match "commands.$_field names npm script '$_script' and package.json defines it"
    else
      differs "commands.$_field is '$_cmd' but package.json defines no '$_script' script."
    fi
  done

  RUNNER="$(printf '%s' "$TEST_CMD" | grep -oE '[A-Za-z0-9_/.-]+\.(gd|cs|py|sh)' | head -1)"
  if [ -n "$RUNNER" ]; then
    if [ -f "$RUNNER" ]; then
      match "commands.test runner exists ($RUNNER)"
    else
      differs "commands.test is '$TEST_CMD' but '$RUNNER' does not exist. At qa.level: minimal nothing ever creates it, so this command is unrunnable as written."
    fi
  fi
fi

summarise
