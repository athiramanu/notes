import { writable } from 'svelte/store';

let dark = localStorage.getItem("darkTheme") == "true" ? true : false;

export const darkTheme = writable(dark);