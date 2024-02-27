import { getCvcgURL } from './urls.js';

export function cvcgFetch(url, dataCallback) {
  const requestOptions = {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  };
  fetch(url, requestOptions)
    .then((response) => response.json())
    .then((data) => { dataCallback(data); });
}

export function cvcgCommand(commandString, dataCallback) {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command: commandString })
  };
  fetch(getCvcgURL(), requestOptions)
    .then((response) => response.json())
    .then((data) => { dataCallback(data.data); });  
}
