<script setup>
import { ref, computed, watch } from 'vue';

import Console from "./components/Console.vue";
import PortalEditor from "./components/PortalEditor.vue";
import PluginDirectory from "./components/PluginDirectory.vue";

const visiblePanel = ref('console');

const consoleVisible         = computed(() => visiblePanel.value === 'console');
const portalEditorVisible    = computed(() => visiblePanel.value === 'portalEditor');
const pluginDirectoryVisible = computed(() => visiblePanel.value === 'pluginDirectory');
</script>


<template>

<div class="header">
  <input type="radio" v-model="visiblePanel" id="console" name="panel" value="console" checked /><label for="console">Console</label>
  <input type="radio" v-model="visiblePanel" id="portalEditor" name="panel" value="portalEditor" /><label for="portalEditor">Portal Editor</label>
  <input type="radio" v-model="visiblePanel" id="pluginDirectory" name="panel" value="pluginDirectory" /><label for="pluginDirectory">Plugins</label>
</div>

<KeepAlive><Console v-if="consoleVisible" /></KeepAlive>
<KeepAlive><PortalEditor v-if="portalEditorVisible" /></KeepAlive>
<KeepAlive><PluginDirectory v-if="pluginDirectoryVisible" /></KeepAlive>

</template>


<style>
input {
    color: white;
    background-color: black;
}
label {
    color: white;
    background-color: black;
}
body {
    background-color: black;
}
.colorf {
    color: #ffffff;
}
.color0 {
    color: black;
}
.color1 {
    color: blue;
}
.color2 {
    color: green;
}
.color3 {
    color: aqua;
}
.color4 {
    color: red;
}
.color5 {
    color: purple;
}
.color6 {
    color: gold;
}
.color7 {
    color: grey;
}
.color8 {
    color: grey;
}
.color9 {
    color: blue;
}
.colora {
    color: green;
}
.colorb {
    color: aqua;
}
.colorc {
    color: red;
}
.colord {
    color: purple;
}
.colore {
    color: yellow;
}
.colorr {
    color: white;
}
.headline {
    color: white;
    text-decoration: underline;
}
</style>

<style scoped>
  .header {
      margin-bottom: 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid white;
  }
</style>
