<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import YAML from 'js-yaml';
import { cvcgCommand } from '../lib/utils.js';
import { getPortalManualURL } from '../lib/urls.js';

// ************************* Various *************************

const showManual = () => {
  window.open(getPortalManualURL(), '_blank');
};

const enums = ref({ Sound: [], PotionEffectType: [] });


// ************************* Portal selection *************************

const worldList = ref([]);
const portalList = ref([]);
const portalListLoading = ref(false);
const selectedWorld = ref('');
const selectedPortal = ref('');


const noPortalSelected = computed(() => {
  return selectedPortal.value.length == 0;
});

const portalListBySelectedWorld = computed(() => {
  const p = portalList.value.filter((portal) => portal.worldname == selectedWorld.value);
  return p.map((p) => p.name).toSorted();
});

const updatePortalList = (() => {
  portalListLoading.value = true;
  cvcgCommand('cvportal listyml', (data) => {
    if(data.length == 0) {
      alert('No data available, are you logged in?');
      return;
    }
    portalList.value = YAML.load(data.substring(2)).PortalList;
    worldList.value = [...new Set(portalList.value.map((w) => w.worldname))].sort();
    portalListLoading.value = false;
  });
});

onMounted(() => {
  cvcgCommand('cvportal listenumsyml', (data) => {
    enums.value = YAML.load(data.substring(2));
  });
  updatePortalList();
});


// ************************* Portal editor *************************

const portalData = ref({});
const procPortalData = ref({});
const portalDataLoading = ref(false);

const updatePortalData = (portalName) => {
  portalDataLoading.value = true;
  cvcgCommand('cvportal serializeyml ' + portalName, (data) => {
    portalData.value = YAML.load(data.substring(2)).PortalData;
    updateProcPortalData();
    portalDataLoading.value = false;
  });
};

const portalRegionString = computed(() => {
  if(portalData.value) {
    if(portalData.value.minCorner == null)
      return 'regionless';
    else {
      const minc = portalData.value.minCorner;
      const maxc = portalData.value.maxCorner;
      const xdim = Math.round((maxc.x - minc.x) * 10) / 10;
      const ydim = Math.round((maxc.y - minc.y) * 10) / 10;
      const zdim = Math.round((maxc.z - minc.z) * 10) / 10;
      return `${minc.x} / ${minc.y} / ${minc.z}  to  ${maxc.x} / ${maxc.y} / ${maxc.z}  ( Size: ${xdim} / ${ydim} / ${zdim} )`;
    }
  }
  else {
    return '';
  }
});

const hasAction = (actionName) => portalData.value.actions.some((action) => action['=='] == actionName);
const getAction = (actionName) => portalData.value.actions.find((action) => action['=='] == actionName);

const removeFromList = (list, index, disabler) => {
  list.splice(index, 1);
  if(list.length == 0)
    disabler()
};
const removeSound =         (index) => removeFromList(procPortalData.value.sounds,         index, () => { procPortalData.value.soundsActive = false; });
const removeCommand =       (index) => removeFromList(procPortalData.value.commands,       index, () => { procPortalData.value.commandsActive = false; });
const removeSuCommand =     (index) => removeFromList(procPortalData.value.suCommands,     index, () => { procPortalData.value.suCommandsActive = false; });
const removePotionEffect =  (index) => removeFromList(procPortalData.value.potionEffects,  index, () => { procPortalData.value.potionEffectsActive = false; });
const removeForwardPortal = (index) => removeFromList(procPortalData.value.forwardPortals, index, () => { procPortalData.value.forwardPortalsActive = false; });
const addSound =            () => procPortalData.value.sounds.push({ sound: '', pitch: '1.0' });
const addCommand =          () => procPortalData.value.commands.push('');
const addSuCommand =        () => procPortalData.value.suCommands.push('');
const addPotionEffect =     () => procPortalData.value.potionEffects.push({ type: '', amplifier: '1', duration: '10', particles: false });
const addForwardPortal =    () => procPortalData.value.forwardPortals.push({ name: '', weight: '0' }); 

watch(() => procPortalData.value.commandsActive, (status) => {
  if(! status) return;
  if(procPortalData.value.commands.length == 0)
    addCommand();
});

watch(() => procPortalData.value.soundsActive, (status) => {
  if(! status) return;
  if(procPortalData.value.sounds.length == 0)
    addSound();
});

watch(() => procPortalData.value.suCommandsActive, (status) => {
  if(! status) return;
  if(procPortalData.value.suCommands.length == 0)
    addSuCommand();
});

watch(() => procPortalData.value.potionEffectsActive, (status) => {
  if(! status) return;
  if(procPortalData.value.potionEffects.length == 0)
    addPotionEffect();
});

watch(() => procPortalData.value.forwardPortalsActive, (status) => {
  if(! status) return;
  if(procPortalData.value.forwardPortals.length == 0)
    addForwardPortal();
});

watch(selectedPortal, async (newPortal, oldPortal) => {
  updatePortalData(newPortal);
});

const updateProcPortalData = () => { // Flattening portal data for gui
  procPortalData.value = {};
  
  procPortalData.value.clearInventory = hasAction('ClearInventory');
  procPortalData.value.removeEffects = hasAction('RemoveEffects');
  procPortalData.value.heal = hasAction('Heal');
  procPortalData.value.extinguish = hasAction('Extinguish');
  
  procPortalData.value.cooldownActive = portalData.value.cooldown > 0;
  procPortalData.value.cooldown = portalData.value.cooldown / 10000;
  procPortalData.value.globalCooldownActive = portalData.value.globalCooldown > 0;
  procPortalData.value.globalCooldown = portalData.value.globalCooldown / 10000;
  
  procPortalData.value.particlesActive = 'particle' in portalData.value;
  if(procPortalData.value.particlesActive) {
    procPortalData.value.particleType = portalData.value.particle;
    procPortalData.value.particleDelay = portalData.value.particleDelay;
  }
  else {
    procPortalData.value.particleType = '';
    procPortalData.value.particleDelay = 1;
  }
  
  procPortalData.value.permissionActive = portalData.value.permission.length > 0;
  procPortalData.value.permission = portalData.value.permission;
  
  procPortalData.value.conditionActive = portalData.value.condition.length > 0;
  procPortalData.value.condition = portalData.value.condition;
  
  procPortalData.value.teleportActive = hasAction('Teleport');
  if(procPortalData.value.teleportActive) {
    const loc = getAction('Teleport').location
    procPortalData.value.teleportX = Math.round(loc.x * 100) / 100;
    procPortalData.value.teleportY = Math.round(loc.y * 100) / 100;
    procPortalData.value.teleportZ = Math.round(loc.z * 100) / 100;
    procPortalData.value.teleportPitch = Math.round(loc.pitch);
    procPortalData.value.teleportYaw = Math.round(loc.yaw);
    procPortalData.value.teleportWorld = loc.world;
  }
  else {
    procPortalData.value.teleportX = '0';
    procPortalData.value.teleportY = '0';
    procPortalData.value.teleportZ = '0';
    procPortalData.value.teleportPitch = '0';
    procPortalData.value.teleportYaw = '0';
    procPortalData.value.teleportWorld = '';
  }
  
  procPortalData.value.spreadTeleportActive = hasAction('SpreadTeleport');
  if(procPortalData.value.spreadTeleportActive) {
    const tp = getAction('SpreadTeleport');
    procPortalData.value.spreadTeleportX = Math.round(tp.location.x * 100) / 100;
    procPortalData.value.spreadTeleportY = Math.round(tp.location.y * 100) / 100;
    procPortalData.value.spreadTeleportZ = Math.round(tp.location.z * 100) / 100;
    procPortalData.value.spreadTeleportYaw = Math.round(tp.location.yaw);
    procPortalData.value.spreadTeleportPitch = Math.round(tp.location.pitch);
    procPortalData.value.spreadTeleportWorld = tp.location.world;
    if(tp.area == null) {
      procPortalData.value.spreadTeleportAreaX = '0';
      procPortalData.value.spreadTeleportAreaY = '0';
      procPortalData.value.spreadTeleportAreaZ = '0';
      procPortalData.value.spreadTeleportRadius = tp.radius;
      procPortalData.value.spreadTeleportType = 'radius';
    }
    else {
      procPortalData.value.spreadTeleportType = 'cuboid';
      procPortalData.value.spreadTeleportAreaX = tp.area.x;
      procPortalData.value.spreadTeleportAreaY = tp.area.y;
      procPortalData.value.spreadTeleportAreaZ = tp.area.z;
      procPortalData.value.spreadTeleportRadius = '0';
    }
    procPortalData.value.spreadTeleportBorderOnly = tp.borderOnly;
    procPortalData.value.spreadTeleportCenterYaw = tp.centerYaw;
  }
  else {
    procPortalData.value.spreadTeleportX = '0';
    procPortalData.value.spreadTeleportY = '0';
    procPortalData.value.spreadTeleportZ = '0';
    procPortalData.value.spreadTeleportPitch = '0';
    procPortalData.value.spreadTeleportYaw = '0';
    procPortalData.value.spreadTeleportWorld = '0';
    procPortalData.value.spreadTeleportType = 'radius';
    procPortalData.value.spreadTeleportAreaX = '0';
    procPortalData.value.spreadTeleportAreaY = '0';
    procPortalData.value.spreadTeleportAreaZ = '0';
    procPortalData.value.spreadTeleportRadius = '0';
    procPortalData.value.spreadTeleportBorderOnly = false;
    procPortalData.value.spreadTeleportCenterYaw = false;
  }
  
  procPortalData.value.crossServerTeleportActive = hasAction('CrossServerTeleport');
  if(procPortalData.value.crossServerTeleportActive) {
    procPortalData.value.crossServerTeleportServer = getAction('CrossServerTeleport').server;
    procPortalData.value.crossServerTeleportWorld = getAction('CrossServerTeleport').portal;	
  }
  else {
    procPortalData.value.crossServerTeleportServer = '';
    procPortalData.value.crossServerTeleportWorld = '';
  }
  
  procPortalData.value.messageActive = hasAction('Message');
  if(procPortalData.value.messageActive) {
    procPortalData.value.message = getAction('Message').message;
  }
  else {
    procPortalData.value.message = '';
  }
  
  procPortalData.value.titleActive = hasAction('Title');
  if(procPortalData.value.titleActive) {
    const title = getAction('Title');
    procPortalData.value.title = title.title;
    procPortalData.value.subtitle = title.subtitle;
    procPortalData.value.titleFadeIn = title.fadeIn;
    procPortalData.value.titleFadeOut = title.fadeOut;
    procPortalData.value.titleStay = title.stay;
  }
  else {
    procPortalData.value.title = '';
    procPortalData.value.subtitle = '';
    procPortalData.value.titleFadeIn = '10';
    procPortalData.value.titleFadeOut = '10';
    procPortalData.value.titleStay = '40';
  }
  
  procPortalData.value.yawLimitActive = portalData.value.maxYaw != portalData.value.minYaw;
  procPortalData.value.yawLimitMin = portalData.value.minYaw;
  procPortalData.value.yawLimitMax = portalData.value.maxYaw;
  
  procPortalData.value.gamemodeActive = hasAction('GameMode');
  if(procPortalData.value.gamemodeActive) {
    procPortalData.value.gamemode = getAction('GameMode').gamemode;
  }
  else {
    procPortalData.value.gamemode = 'SURVIVAL';
  }
  
  procPortalData.value.forwardPortals = [];
  if(hasAction('Random')) {
    Object.keys(getAction('Random').portals).forEach((key) => {
      procPortalData.value.forwardPortals.push({ name: key, weight: getAction('Random').portals[key] });
    });							     
  }
  procPortalData.value.forwardPortalsActive = procPortalData.value.forwardPortals.length > 0;
  
  procPortalData.value.commands = [];
  portalData.value.actions.filter((action) => action['=='] == 'Cmd').forEach((action) => {
    procPortalData.value.commands.push(action.cmd)
  });
  procPortalData.value.commandsActive = procPortalData.value.commands.length > 0;
  
  procPortalData.value.suCommands = [];
  portalData.value.actions.filter((action) => action['=='] == 'SuCmd').forEach((action) => {
    procPortalData.value.suCommands.push(action.sucmd)
  });
  procPortalData.value.suCommandsActive = procPortalData.value.suCommands.length > 0;
  
  procPortalData.value.velocityActive = hasAction('Velocity');
  if(procPortalData.value.velocityActive) {
    const vel = getAction('Velocity');
    procPortalData.value.velocityX = vel.velocity.x;
    procPortalData.value.velocityY = vel.velocity.y;
    procPortalData.value.velocityZ = vel.velocity.z;
    procPortalData.value.velocityIgnoreY = vel.ignoreY;
    procPortalData.value.velocityPlayerDirection = vel.adjustToPlayerDirection;	
  }
  else {
    procPortalData.value.velocityX = 0;
    procPortalData.value.velocityY = 0;
    procPortalData.value.velocityZ = 0;
    procPortalData.value.velocityIgnoreY = false;
    procPortalData.value.velocityPlayerDirection = false;
  }
  
  procPortalData.value.potionEffects = [];
  portalData.value.actions.filter((action) => action['=='] == 'ApplyPotionEffect').forEach((action) => {
    procPortalData.value.potionEffects.push({
      type: action.type,
      amplifier: action.amplifier,
      duration: action.duration,
      particles: action.particles });
  });
  procPortalData.value.potionEffectsActive = procPortalData.value.potionEffects.length > 0;
  
  procPortalData.value.sounds = [];
  portalData.value.actions.filter((action) => action['=='] == 'Playsound').forEach((action) => {
    procPortalData.value.sounds.push({
      sound: action.sound,
      pitch: action.pitch
    });
  });
  procPortalData.value.soundsActive = procPortalData.value.sounds.length > 0;

};
</script>


<template>

<div class="portalSelection">
  <span @click="updatePortalList" class="interactive" :class="{ busy: portalListLoading }">⟳</span>
  <span @click="showManual" class="interactive"> i </span>
  <label class="selectionlabel" for="worldSelection">World:</label>
  <select name="worldSelection" id="worldSelection" v-model="selectedWorld">
    <option v-for="world in worldList">{{ world }}</option>
  </select>
  <label class="selectionlabel" for="portalSelection">Portal:</label>
  <select name="portalSelection" id="portalSelection" v-model="selectedPortal">
    <option v-for="portal in portalListBySelectedWorld">{{ portal }}</option>
  </select>
</div>

<div class="portalEditPanel" v-show="!noPortalSelected">
  
  <div class="portalEditSelectors">
    <span @click="updatePortalData(selectedPortal)" class="interactive" :class="{ busy: portalDataLoading }">⟳</span>
    <div><span class="color6">Selected Portal: </span>{{ portalData.name }}</div>
    <div><span class="color6">Region: </span>{{ portalRegionString }}</div>
    
    <div class="checklist">
      <div class="sectionbar">
	<div>
	  <input type="checkbox" id="permanent" v-model="portalData.permanent" />
	  <label class="checkboxlabel" for="permanent">Permanent</label>
	  <input type="checkbox" id="deathTriggered" v-model="portalData.deathTriggered" />
	  <label class="checkboxlabel" for="deathTriggered">Death Triggered</label>
	</div>
	<div>
	  <input type="checkbox" id="moveEventTriggered" v-model="portalData.moveEventTriggered" />
	  <label class="checkboxlabel" for="moveEventTriggered">Move Event Triggered</label>
	  <input type="checkbox" id="loginTriggered" v-model="portalData.loginTriggered" />
	  <label class="checkboxlabel" for="loginTriggered">Login Triggered</label>
	</div>
	<div>
	  <input type="checkbox" id="jumpEventTriggered" v-model="portalData.jumpEventTriggered" />
	  <label class="checkboxlabel" for="jumpEventTriggered">Jump Event Triggered</label>
	</div>
      </div>
      
      <div class="sectionbar">
	<input type="checkbox" id="conditionActiveSelector" v-model="procPortalData.conditionActive" />
	<label class="checkboxlabel" for="conditionActiveSelector">Condition</label>
	<input type="checkbox" id="permissionActiveSelector" v-model="procPortalData.permissionActive" />
	<label class="checkboxlabel" for="permissionActiveSelector">Permission</label>
	<div>
	  <input type="checkbox" id="yawLimitActiveSelector" v-model="procPortalData.yawLimitActive" />
	  <label class="checkboxlabel" for="yawLimitActiveSelector">Yaw Limit</label>
	</div>
      </div>
      
      <div class="sectionbar">
	<div>
	  <input type="checkbox" id="cooldownActive" v-model="procPortalData.cooldownActive" />
	  <label class="checkboxlabel" for="cooldownActive">Player Cooldown</label>
	  <input type="checkbox" id="globalCooldownActive" v-model="procPortalData.globalCooldownActive" />
	  <label class="checkboxlabel" for="globalCooldownActive">Global Cooldown</label>
	</div>
	<div>
	  <input type="number" min="1" class="smolinput" id="cooldown" v-model="procPortalData.cooldown" :disabled="procPortalData.cooldownActive == false" /> s
	  <div class="spacer"></div>
	  <input type="number" min="1" class="smolinput" id="globalCooldown" v-model="procPortalData.globalCooldown" :disabled="procPortalData.globalCooldownActive == false" /> s
	</div>
      </div>
      
      <div class="sectionbar">
	<div>
	  <input type="checkbox" id="clearInventory" v-model="procPortalData.clearInventory" />
	  <label class="checkboxlabel" for="clearInventory">Clear Inventory</label>
	  <input type="checkbox" id="extinguish" v-model="procPortalData.extinguish" />
	  <label class="checkboxlabel" for="extinguish">Extinguish</label>
	</div>
	<div>
	  <input type="checkbox" id="heal" v-model="procPortalData.heal" />
	  <label class="checkboxlabel" for="heal">Heal</label>
	  <input type="checkbox" id="keepInventory" v-model="portalData.keepInventory" />
	  <label class="checkboxlabel" for="keepInventory">Keep Inventory</label>
	</div>
	<div>
	  <input type="checkbox" id="removeEffects" v-model="procPortalData.removeEffects" />
	  <label class="checkboxlabel" for="removeEffects">Remove Effects</label>
	</div>
      </div>
      
      <div class="section">
	<div>
	  <input type="checkbox" id="messageActiveSelector" v-model="procPortalData.messageActive" />
	  <label class="checkboxlabel" for="messageActiveSelector">Chat Message</label>
	  <input type="checkbox" id="commandsActiveSelector" v-model="procPortalData.commandsActive" />
	  <label class="checkboxlabel" for="commandsActiveSelector">Commands</label>
	</div>
	<div>
	  <input type="checkbox" id="suCommandsActiveSelector" v-model="procPortalData.suCommandsActive" />
	  <label class="checkboxlabel" for="suCommandsActiveSelector">Su Commands</label>
	  <input type="checkbox" id="velocityActiveSelector" v-model="procPortalData.velocityActive" />
	  <label class="checkboxlabel" for="velocityActiveSelector">Velocity</label>
	</div>
	<div>
	  <input type="checkbox" id="crossServerTeleportActiveSelector" v-model="procPortalData.crossServerTeleportActive" />
	  <label class="checkboxlabel" for="crossServerTeleportActiveSelector">Cross-Server Teleport</label>
	  <input type="checkbox" id="gamemodeActive" v-model="procPortalData.gamemodeActive" />
	  <label class="checkboxlabel" for="gamemodeActive">Gamemode</label>
	</div>
	<div>
	  <input type="checkbox" id="particlesActiveSelector" v-model="procPortalData.particlesActive" />
	  <label class="checkboxlabel" for="particlesActiveSelector">Particles</label>
	  <input type="checkbox" id="forwardPortalsActiveSelector" v-model="procPortalData.forwardPortalsActive" />
	  <label class="checkboxlabel" for="forwardPortalsActiveSelector">Forward / Random</label>
	</div>
	<div>
	  <input type="checkbox" id="teleportActiveSelector" v-model="procPortalData.teleportActive" />
	  <label class="checkboxlabel" for="teleportActiveSelector">Teleport</label>
	  <input type="checkbox" id="titleActiveSelector" v-model="procPortalData.titleActive" />
	  <label class="checkboxlabel" for="titleActiveSelector">Title / Subtitle</label>
	</div>
	<div>
	  <input type="checkbox" id="potionEffectsActiveSelector" v-model="procPortalData.potionEffectsActive" />
	  <label class="checkboxlabel" for="potionEffectsActiveSelector">Potion Effects</label>
	  <input type="checkbox" id="soundsActiveSelector" v-model="procPortalData.soundsActive" />
	  <label class="checkboxlabel" for="soundsActiveSelector">Sounds</label>
	</div>
	<div>
	  <input type="checkbox" id="spreadTeleportActiveSelector" v-model="procPortalData.spreadTeleportActive" />
	  <label class="checkboxlabel" for="spreadTeleportActiveSelector">Spread Teleport</label>
	</div>
      </div>
      
    </div>
    
  </div>
  
  <div class="portalEditProperties">    
    <Transition>
      <div class="section" v-if="procPortalData.particlesActive">
	<input type="checkbox" id="particlesActive" v-model="procPortalData.particlesActive" />
	<label class="checkboxlabel" for="particlesActive">Particles</label>
	<div>
	  <select v-model="procPortalData.particleType">
	    <option v-for="particle in enums.Particle">{{ particle }}</option>
	  </select>
	  <br>
	  <input type="number" id="particleDelay" v-model="procPortalData.particleDelay" min="1" max="50" />
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.permissionActive">
	<input type="checkbox" id="permissionActive" v-model="procPortalData.permissionActive" />
	<label class="checkboxlabel" for="permissionActive">Permission</label>
	<div>
	  <input type="text" id="permission" v-model="procPortalData.permission" class="widetext" />
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.conditionActive">
	<input type="checkbox" id="conditionActive" v-model="procPortalData.conditionActive" />
	<label class="checkboxlabel" for="conditionActive">Condition</label>
	<div>
	  <input type="text" id="condition" v-model="procPortalData.condition" class="widetext" />
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.teleportActive">
	<input type="checkbox" id="teleportActive" v-model="procPortalData.teleportActive" />
	<label class="checkboxlabel" for="teleportActive">Teleport</label>
	<div>
	  <input type="number" id="teleportX" v-model="procPortalData.teleportX" class="smolinput" />
	  <input type="number" id="teleportY" v-model="procPortalData.teleportY" class="smolinput" />
	  <input type="number" id="teleportZ" v-model="procPortalData.teleportZ" class="smolinput" />
	</div>
	<div>
	  <input type="text" id="teleportWorld" v-model="procPortalData.teleportWorld" class="smolinput" />
	  <input type="number" id="teleportYaw" v-model="procPortalData.teleportYaw" class="smolinput" />
	  <input type="number" id="teleportPitch" v-model="procPortalData.teleportPitch" class="smolinput" />
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.crossServerTeleportActive">
	<input type="checkbox" id="crossServerTeleportActive" v-model="procPortalData.crossServerTeleportActive" />
	<label class="checkboxlabel" for="crossServerTeleportActive">Cross-Server Teleport</label>
	<div>
	  <input type="text" id="crossServerTeleportServer" v-model="procPortalData.crossServerTeleportServer" />
	  <input type="text" id="crossServerTeleportWorld" v-model="procPortalData.crossServerTeleportWorld" />
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.messageActive">
	<input type="checkbox" id="messageActive" v-model="procPortalData.messageActive" />
	<label class="checkboxlabel" for="messageActive">Chat Message</label>
	<div>
	  <input type="text" id="message" v-model="procPortalData.message" class="widetext" />
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.titleActive">
	<input type="checkbox" id="titleActive" v-model="procPortalData.titleActive" />
	<label class="checkboxlabel" for="titleActive">Title / Subtitle</label>
	<div>
	  <input type="text" id="title" v-model="procPortalData.title" class="widetext" /><br>
	  <input type="text" id="subtitle" v-model="procPortalData.subtitle" class="widetext" />
	</div>
	<div>
	  <input type="number" id="titleFadeIn" v-model="procPortalData.titleFadeIn" class="smolinput" />
	  <input type="number" id="titleStay" v-model="procPortalData.titleStay" class="smolinput" />
	  <input type="number" id="titleFadeOut" v-model="procPortalData.titleFadeOut" class="smolinput" />
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.yawLimitActive">
	<input type="checkbox" id="yawLimitActive" v-model="procPortalData.yawLimitActive" />
	<label class="checkboxlabel" for="yawLimitActive">Yaw Limit</label>
	<div>
	  <input type="number" id="yawLimitMin" v-model="procPortalData.yawLimitMin" class="smolinput" />
	  <input type="number" id="yawLimitMax" v-model="procPortalData.yawLimitMax" class="smolinput" />
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.gamemodeActive">
	<input type="checkbox" id="gamemodeActive" v-model="procPortalData.gamemodeActive" />
	<label class="checkboxlabel" for="gamemodeActive">Gamemode</label>
	<div>
	  <select name="worldSelection" id="worldSelection" v-model="procPortalData.gamemode">
	    <option>SURVIVAL</option>
	    <option>CREATIVE</option>
	    <option>SPECTATOR</option>
	    <option>ADVENTURE</option>
	  </select>
	</div>
      </div> 
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.commandsActive">
	<input type="checkbox" id="commandsActive" v-model="procPortalData.commandsActive" />
	<label class="checkboxlabel" for="commandsActive">Commands</label>
	<span class="interactive" @click="addCommand()"> +&nbsp;</span>
	<div v-for="(command, index) in procPortalData.commands">
	  <input type="text" v-model="procPortalData.commands[index]" class="widetext" /><span class="interactive" @click="removeCommand(index)">&nbsp;🗑&nbsp;</span>
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.suCommandsActive">
	<input type="checkbox" id="suCommandsActive" v-model="procPortalData.suCommandsActive" />
	<label class="checkboxlabel" for="suCommandsActive">Su Commands</label>
	<span class="interactive" @click="addSuCommand()"> +&nbsp;</span>
	<div v-for="(command, index) in procPortalData.suCommands">
	  <input type="text" v-model="procPortalData.suCommands[index]" class="widetext" />
	  <span class="interactive" @click="removeSuCommand(index)">&nbsp;🗑&nbsp;</span>
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.velocityActive">
	<input type="checkbox" id="velocityActive" v-model="procPortalData.velocityActive" />
	<label class="checkboxlabel" for="velocityActive">Velocity</label>
	<div>
	  <input type="checkbox" id="velocityPlayerDirection" v-model="procPortalData.velocityPlayerDirection" />
	  <label class="checkboxlabel" for="velocityPlayerDirection">x = Player Direction</label>
	  <input type="checkbox" id="velocityIgnoreY" v-model="procPortalData.velocityIgnoreY" />
	  <label class="checkboxlabel" for="velocityIgnoreY">Ignore Y</label>
	</div>
	<div>
	  <input type="number" v-model="procPortalData.velocityX" class="smolinput" />
	  <input type="number" v-model="procPortalData.velocityY" class="smolinput" :disabled="procPortalData.velocityIgnoreY" />
	  <input type="number" v-model="procPortalData.velocityZ" class="smolinput" :disabled="procPortalData.velocityPlayerDirection" />
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.forwardPortalsActive">
	<input type="checkbox" id="forwardPortalsActive" v-model="procPortalData.forwardPortalsActive" />
	<label class="checkboxlabel" for="forwardPortalsActive">Forward / Random</label>
	<span class="interactive" @click="addForwardPortal()">&nbsp;+&nbsp;</span>
	<div v-for="(portal, index) in procPortalData.forwardPortals">
	  <input type="text" v-model="procPortalData.forwardPortals[index].name" class="widetext" />
	  <span class="interactive" @click="removeForwardPortal(index)">&nbsp;🗑&nbsp;</span>
	  <br>
	  <input type="number" v-model="procPortalData.forwardPortals[index].weight" class="smolinput" />
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.potionEffectsActive">
	<input type="checkbox" id="potionEffectsActive" v-model="procPortalData.potionEffectsActive" />
	<label class="checkboxlabel" for="potionEffectsActive">Potion Effects</label>
	<span class="interactive" @click="addPotionEffect()">&nbsp;+&nbsp;</span>
	<div v-for="(effect, index) in procPortalData.potionEffects">
	  <select :name="'potionEffectSelection' + index" v-model="procPortalData.potionEffects[index].type">
	    <option v-for="potionEffect in enums.PotionEffectType">{{ potionEffect }}</option>
	  </select>
	  <span class="interactive" @click="removePotionEffect(index)">&nbsp;🗑&nbsp;</span>
	  <br />
	  <input type="number" v-model="procPortalData.potionEffects[index].amplifier" class="smolinput" />
	  <input type="number" v-model="procPortalData.potionEffects[index].duration" class="smolinput" />
	  <input type="checkbox" :id="'potionEffectParticles' + index" v-model="procPortalData.potionEffects[index].particles" />
	  <label class="checkboxlabel" :for="'potionEffectParticles' + index">With Particles</label>
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.soundsActive">
	<input type="checkbox" id="soundsActive" v-model="procPortalData.soundsActive" />
	<label class="checkboxlabel" for="soundsActive">Sounds</label>
	<span class="interactive" @click="addSound()">&nbsp;+&nbsp;</span>
	<div v-for="(sound, index) in procPortalData.sounds">
	  <select :name="'soundSelection' + index" v-model="procPortalData.sounds[index].sound">
	    <option v-for="sound in enums.Sound">{{ sound }}</option>
	  </select>
	  <span class="interactive" @click="removeSound(index)">&nbsp;🗑&nbsp;</span>
	  <br>
	  <input type="number" v-model="procPortalData.sounds[index].pitch" class="smolinput" />	  
	</div>
      </div>
    </Transition>
    
    <Transition>
      <div class="section" v-if="procPortalData.spreadTeleportActive">
	<input type="checkbox" id="spreadTeleportActive" v-model="procPortalData.spreadTeleportActive" />
	<label class="checkboxlabel" for="spreadTeleportActive">Spread Teleport</label>
	<div>
	  <input type="number" id="spreadTeleportX" v-model="procPortalData.spreadTeleportX" class="smolinput" />
	  <input type="number" id="spreadTeleportY" v-model="procPortalData.spreadTeleportY" class="smolinput" />
	  <input type="number" id="spreadTeleportZ" v-model="procPortalData.spreadTeleportZ" class="smolinput" />
	</div>
	<div>
	  <input type="text" id="spreadTeleportWorld" v-model="procPortalData.spreadTeleportWorld" class="smolinput" />
	  <input type="number" id="spreadTeleportYaw" v-model="procPortalData.spreadTeleportYaw" class="smolinput" />
	  <input type="number" id="spreadTeleportPitch" v-model="procPortalData.spreadTeleportPitch" class="smolinput" />
	</div>
	<input type="radio" id="spreadTeleportTypeRadius" value="radius" v-model="procPortalData.spreadTeleportType" />
	<label for="spreadTeleportTypeRadius">Radius</label>
	<input type="radio" id="spreadTeleportTypeCuboid" value="cuboid" v-model="procPortalData.spreadTeleportType" />
	<label for="spreadTeleportTypeCuboid">Cuboid Area</label>
	<div v-if="procPortalData.spreadTeleportType == 'cuboid'">
	  <input type="number" id="spreadTeleportAreaX" v-model="procPortalData.spreadTeleportAreaX" class="smolinput" />
	  <input type="number" id="spreadTeleportAreaY" v-model="procPortalData.spreadTeleportAreaY" class="smolinput" />
	  <input type="number" id="spreadTeleportAreaZ" v-model="procPortalData.spreadTeleportAreaZ" class="smolinput" />
	</div>
	<div v-if="procPortalData.spreadTeleportType == 'radius'">
	  <input type="number" id="spreadTeleportRadius" v-model="procPortalData.spreadTeleportRadius" class="smolinput" />
	</div>
	<input type="checkbox" id="spreadTeleportBorderOnly" v-model="procPortalData.spreadTeleportBorderOnly" />
	<label class="checkboxlabel" for="spreadTeleportBorderOnly">Border Only</label>
	<input type="checkbox" id="spreadTeleportCenterYaw" v-model="procPortalData.spreadTeleportCenterYaw" />
	<label class="checkboxlabel" for="spreadTeleportCenterYaw">Center Yaw</label>
      </div>
    </Transition>
    
  </div>    
</div>
</template>


<style scoped>
.selectionlabel {
    margin-left: 1rem;
    margin-right: 0.5rem;
}
.checkboxlabel {
    width: 11rem;
    display: inline-block;
}
select {
    width: 20rem;
}
div {
    color: white;
}
.portalEditPanel {
    margin-top: 1rem;
    user-select: none;
}
.section {
    margin-bottom: 1rem;
}
.sectionbar {
    margin-bottom: 0.5rem;
    padding-bottom: 0.7rem;
    border-bottom: 1px solid #555;
}
input:disabled {
    color: #666666;
}
.widetext {
    width: 20rem;
}
.smolinput {
    width: 7em;
}
.checklist {
    float: left;
}
p {
    margin: 0px;
    padding: 0px;
    margin-bottom: 0.5rem;
}

.v-enter-active {
    transition: opacity 0.5s ease;
}

.v-leave-active {
    transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}

.interactive {
    border: 1px solid white;
    margin-left: 0.5rem;
}

.interactive:hover {
    background-color: #555;
    cursor: pointer;
}

.busy {
    background-color: #a00;
}

.busy:hover {
    background-color: #c33;
}

.spacer {
    width: 6rem;
    display: inline-block;
}

.portalEditPanel {
    display: flex;
    gap: 5rem;
}

.portalSelection {
    padding-bottom: 0.7rem;
    border-bottom: 1px solid #555;
}

</style>
