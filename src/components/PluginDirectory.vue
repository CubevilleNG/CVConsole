<script setup>
import { cvcgFetch } from '../lib/utils.js';
import { ref, computed, onMounted } from 'vue';
import { getPluginDirectoryURL } from '../lib/urls.js';

const serverList = ref([]);
const pluginTable = ref([]);
const errorList = ref([]);

const qtrim = ((s) => s.replace(/["']/g, ''));

const filesWithErrors = computed(() => {
  if(errorList.value.length == 0)
    return "None :D";
  return errorList.value.join(', ');
});

onMounted(() => {
  cvcgFetch(getPluginDirectoryURL(), (data) => {
    serverList.value = data.serverlist;
    for(let i = 0; i < data.pluginlist.length; i++) {
      let tablerow = { plugin: qtrim(data.pluginlist[i]) };
      let rowdata = [];
      for(let j = 0; j < serverList.value.length; j++) {
	if(data.matrix[j][i]) {
	  data.matrix[j][i].version = qtrim(data.matrix[j][i].version);
	}
	rowdata.push(data.matrix[j][i]);
      }
      tablerow.plugindata = rowdata;
      pluginTable.value.push(tablerow);
      errorList.value = data.errorlist;
    }
    pluginTable.value.sort((a, b) => { return a.plugin.toUpperCase() > b.plugin.toUpperCase(); });
  });
});
</script>


<template>
<table>
  <thead>
    <tr>
      <th>Plugin</th>
      <th v-for="server in serverList">{{ server }}</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="pluginrow in pluginTable">
      <td><div class="tablecell">{{ pluginrow.plugin }}</div></td>
      <td v-for="server in pluginrow.plugindata">
	<div class="tablecell">
	  <span :class="server ? (server.link ? 'linkcol' : 'filecol') : ''">
	    {{ server ? server.version : '-' }} <!-- server.version -->
	  </span>
	</div>
      </td>
    </tr>
  </tbody>
</table>
<div class="errors">
  Errors reading files: {{ filesWithErrors }}.  
</div>
</template>


<style scoped>
table {
    background-color: white;
    table-layout: fixed;
    width: 97vw;
    position: relative;
    border-spacing: 0;
    border-collapse: collapse;
}
th {
    width: 4rem;
    overflow-x: hidden;
    position: sticky;
    top: 0;
    background-color: white;
    padding: 1px;
    margin: 0;
}
td {
    overflow-x: hidden;
    width: 4rem;
    white-space: nowrap;
    border: 1px solid black;
    padding: 1px;
    margin: 0;
}
.linkcol {
    color: green;
}
.filecol {
    color: red;
}
.tablecell {
    overflow-x: hidden;
}
.errors {
    color: red;
}
</style>
