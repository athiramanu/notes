import { writable } from 'svelte/store';

let dark = localStorage.getItem("darkTheme") ?? false;

localStorage.setItem("darkTheme", dark);

export const darkTheme = writable(dark);