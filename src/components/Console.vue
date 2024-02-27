<script setup>
import { ref } from 'vue';
import { cvcgCommand } from '../lib/utils.js';

const commandInput = ref('');
const consoleOutput = ref('');
const history = {
  commands: [],
  pointer: 0,
  current: '' };

const onArrowUpKey = (() => {
  if(history.pointer >= history.commands.length) return;
  if(history.pointer == 0)
    history.current = commandInput.value;
  commandInput.value = history.commands[history.pointer++];
});

const onArrowDownKey = (() => {
  if(history.pointer == 0) return;
  if(history.pointer == 1) {
    commandInput.value = history.current;
    history.pointer = 0;
    return;
  }
  commandInput.value = history.commands[--history.pointer - 1];
});
		     
const onEnterKey = (() => {
  const commandString = commandInput.value;
  commandInput.value = '';
  
  history.commands.unshift(commandString);
  history.commands = history.commands.filter((value, index) => history.commands.indexOf(value) == index);
  history.pointer = 0;

  consoleOutput.value += '<span class="headline">' + commandString + '</span><br>';

  cvcgCommand(commandString, (text) => {
    if(text.length == 0) {
      consoleOutput.value += '<span class="color4">No response from server :/</span><br>';
    }
    else {
      text = text.replace(/\n/g, "<br>");
      text = text.replace(/§f/, "<span class=\"colorf\">"); // TODO this is relying on the message always starting with &f, which it currently does, but it shouldn't really...
      text = text.replace(/§([0-9a-fr])/g, '</span><span class="color$1">');
      consoleOutput.value += text + "</span>";
    }
    setTimeout(function() {
      let el = document.getElementById("consoleOutput"); 
      el.scrollTop = el.scrollHeight;
    }, 0);
  });
});
</script>


<template>
  <div class="consoleOutput" id="consoleOutput" v-html="consoleOutput"></div>
  <input type="text"
	 @keyup.enter="onEnterKey"
	 @keyup.arrow-up.stop="onArrowUpKey"
	 @keyup.arrow-down.stop="onArrowDownKey"
	 v-model="commandInput" />
</template>


<style scoped>
  input {
      width: 80vw;
      margin-top: 0.5rem;
  }
  .consoleOutput {
    width: 90vw;
    height: 90vh;
    overflow-y: auto;
    color: white;
    background-color: #112;
  }
</style>
