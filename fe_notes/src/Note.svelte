<svelte:head>
	<title>NotePad</title>
</svelte:head>

<h1>Type your text here and access it from anywhere</h1>
<textarea type="text" class="textArea" bind:value={text}></textarea>
<div class="save">
	<button on:click="{save}">Save</button>
</div>

<script>
	let item = {};

    let text = "";
	let name = "";

	function save() {
		fetch(`http://localhost:3000/${name}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({"text": text})
		}).then(response => {
			console.log("Updated")
		}).catch(err => {
			console.log(err);
		})
	}

	function load(postid) {
		const curr = item.id;
		const isCurrent = curr && curr == postid;
		if (!postid || isCurrent) return Promise.resolve(item);
		name = postid;
		return fetch(`http://localhost:3000/${name}`)
			.then(r => r.json())
			.then(data => {
				text = data[0] ? data[0].text : data.text
			});
	}

	export function preload(req) {
		return load(req.params.postid);
	}

	// Comes from App (router)
	export let params = {};

	// Initial value (preload)
	let post = item;

	// Reactively update `post` value
	$: load(params.postid).then(obj => post = obj);
</script>

<style>
    .textArea {
		width: 70%;
		min-height: 30em;
		resize: none;
	}
	h1 {
		color: #ff3e00;
		font-weight: 100;
	}
	button {
		background-color: #ff3e00; /* Green */
		border: none;
		color: white;
		padding: 15px 32px;
		text-align: center;
		text-decoration: none;
		display: block;
		font-size: 16px;
		float: right;
		cursor: pointer;
	}
	.save {
		width: 70%;
	    margin: 0 auto;
	}
</style>